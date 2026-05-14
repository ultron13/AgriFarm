import { prisma } from '../lib/prisma';
import { payoutsQueue, notificationsQueue, invoicesQueue } from '../jobs/queues';

const LOGISTICS_COST_PER_KG = 4.5;
const BUYER_COMMISSION = 0.08;
const SELLER_COMMISSION = 0.05;

interface CreateOrderInput {
  items: Array<{ listingId: string; quantityKg: number }>;
  deliveryDate: string;
  notes?: string;
  source?: 'WEB' | 'WHATSAPP' | 'FIELD_AGENT' | 'API';
}

export const OrderService = {
  async createOrder(buyerId: string, input: CreateOrderInput) {
    const listings = await Promise.all(
      input.items.map((i) =>
        prisma.produceListing.findUniqueOrThrow({
          where: { id: i.listingId },
          include: { farmer: true, product: true },
        })
      )
    );

    let totalFarmGateValue = 0;
    let totalKg = 0;
    const lineItems = input.items.map((item, idx) => {
      const listing = listings[idx];
      const farmGateValue = Number(listing.farmGatePrice) * item.quantityKg;
      totalFarmGateValue += farmGateValue;
      totalKg += item.quantityKg;
      return { ...item, farmGatePrice: Number(listing.farmGatePrice) };
    });

    const logisticsCharge = LOGISTICS_COST_PER_KG * totalKg;
    const buyerCommission = totalFarmGateValue * BUYER_COMMISSION;
    const deliveredPrice = totalFarmGateValue + logisticsCharge + buyerCommission;

    const orderNumber = `FC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const buyer = await prisma.buyer.findUniqueOrThrow({ where: { id: buyerId } });
    const paymentDueDate = new Date(input.deliveryDate);
    paymentDueDate.setDate(paymentDueDate.getDate() + buyer.preferredPaymentTerms);

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const { order, invoiceId } = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber,
          buyerId,
          deliveryDate: new Date(input.deliveryDate),
          totalFarmGateValue,
          logisticsCharge,
          deliveredPrice,
          paymentTermDays: buyer.preferredPaymentTerms,
          paymentDueDate,
          notes: input.notes,
          source: input.source ?? 'WEB',
          items: {
            create: lineItems.map((item) => ({
              listingId: item.listingId,
              quantityKg: item.quantityKg,
              farmGatePrice: item.farmGatePrice,
              deliveredPrice: (item.farmGatePrice + LOGISTICS_COST_PER_KG) * (1 + BUYER_COMMISSION),
            })),
          },
        },
        include: { items: true },
      });

      // Reserve listing capacity
      for (const item of lineItems) {
        await tx.produceListing.update({
          where: { id: item.listingId },
          data: { availableKg: { decrement: item.quantityKg } },
        });
      }

      // Create invoice record (PDF generated async by worker)
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: o.id,
          buyerSnapshot: { displayName: buyer.displayName },
          lineItems: lineItems.map((item, idx) => ({
            name: listings[idx].product.name,
            quantityKg: item.quantityKg,
            farmGatePrice: item.farmGatePrice,
            amount: item.farmGatePrice * item.quantityKg,
          })),
          subtotal: deliveredPrice,
          vatAmount: 0,
          total: deliveredPrice,
          dueDate: paymentDueDate,
        },
      });

      return { order: o, invoiceId: inv.id };
    });

    await invoicesQueue.add('generate_invoice', { invoiceId, orderId: order.id });

    await notificationsQueue.add('order_placed', {
      channel: 'whatsapp' as const,
      to: buyer.whatsappNumber ?? '',
      templateId: 'order_confirmed',
      variables: { orderNumber, deliveryDate: input.deliveryDate, amount: `R${deliveredPrice.toFixed(2)}` },
    });

    return order;
  },

  async confirmDelivery(orderId: string) {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: { include: { listing: { include: { farmer: true } } } }, buyer: true },
    });

    if (['DELIVERED', 'CANCELLED', 'REFUNDED', 'DISPUTED'].includes(order.status)) {
      throw Object.assign(new Error('Order cannot be confirmed in its current state'), { statusCode: 400, code: 'INVALID_STATE' });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' },
    });

    // In dev/mock mode payouts process in 5 seconds; in production use 48 hours
    const IS_MOCK = process.env.NODE_ENV !== 'production';
    const payoutDelay = IS_MOCK ? 5_000 : 48 * 60 * 60 * 1000;
    const scheduledFor = new Date(Date.now() + (IS_MOCK ? 0 : 48 * 60 * 60 * 1000));

    const farmerPayouts = new Map<string, { farmerId: string; gross: number }>();
    for (const item of order.items) {
      const farmerId = item.listing.farmerId;
      const gross = Number(item.farmGatePrice) * Number(item.quantityKg);
      const existing = farmerPayouts.get(farmerId);
      farmerPayouts.set(farmerId, { farmerId, gross: (existing?.gross ?? 0) + gross });
    }

    for (const [, { farmerId, gross }] of farmerPayouts) {
      const commission = gross * SELLER_COMMISSION;
      const payout = await prisma.payout.create({
        data: { orderId, farmerId, grossAmount: gross, commission, netAmount: gross - commission, scheduledFor },
      });
      await payoutsQueue.add('process_payout', { payoutId: payout.id }, { delay: payoutDelay });
    }

    return updated;
  },
};
