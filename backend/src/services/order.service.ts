import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { payoutsQueue, notificationsQueue, invoicesQueue } from '../jobs/queues';

const LOGISTICS_COST_PER_KG = new Prisma.Decimal('4.5');
const BUYER_COMMISSION = new Prisma.Decimal('0.08');
const SELLER_COMMISSION = new Prisma.Decimal('0.05');

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

    // Validate minimum order quantities per listing before touching totals
    for (let i = 0; i < input.items.length; i++) {
      const qty = new Prisma.Decimal(input.items[i].quantityKg);
      const listing = listings[i];
      if (qty.lt(listing.minimumOrderKg)) {
        throw Object.assign(
          new Error(
            `Minimum order for ${listing.product.name} is ${listing.minimumOrderKg} kg ` +
            `(you ordered ${input.items[i].quantityKg} kg)`
          ),
          { statusCode: 422, code: 'BELOW_MINIMUM_ORDER' }
        );
      }
    }

    let totalFarmGateValue = new Prisma.Decimal(0);
    let totalKg = new Prisma.Decimal(0);
    const lineItems = input.items.map((item, idx) => {
      const listing = listings[idx];
      const qty = new Prisma.Decimal(item.quantityKg);
      totalFarmGateValue = totalFarmGateValue.add(listing.farmGatePrice.mul(qty));
      totalKg = totalKg.add(qty);
      return { listingId: item.listingId, quantityKg: item.quantityKg, qty, farmGatePrice: listing.farmGatePrice };
    });

    const logisticsCharge = LOGISTICS_COST_PER_KG.mul(totalKg);
    // Commission charged on farm-gate + logistics so the take-rate applies to
    // everything the buyer pays for, matching the per-item formula below.
    const baseDelivered = totalFarmGateValue.add(logisticsCharge);
    const buyerCommission = baseDelivered.mul(BUYER_COMMISSION);
    const deliveredPrice = baseDelivered.add(buyerCommission);

    const orderNumber = `FC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const buyer = await prisma.buyer.findUniqueOrThrow({ where: { id: buyerId } });

    // Enforce credit limit when one is configured on the buyer profile
    if (buyer.creditLimit !== null) {
      const { _sum } = await prisma.order.aggregate({
        where: { buyerId, status: { notIn: ['CANCELLED', 'REFUNDED'] }, deletedAt: null },
        _sum: { deliveredPrice: true },
      });
      const outstanding = _sum.deliveredPrice ?? new Prisma.Decimal(0);
      if (outstanding.add(deliveredPrice).gt(buyer.creditLimit)) {
        throw Object.assign(
          new Error(
            `Order total of R${deliveredPrice.toFixed(2)} would exceed your credit limit of R${buyer.creditLimit.toFixed(2)}`
          ),
          { statusCode: 409, code: 'CREDIT_LIMIT_EXCEEDED' }
        );
      }
    }

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
              deliveredPrice: item.farmGatePrice
                .add(LOGISTICS_COST_PER_KG)
                .mul(new Prisma.Decimal(1).add(BUYER_COMMISSION)),
            })),
          },
        },
        include: { items: true },
      });

      // Atomic check-and-decrement — prevents oversell under concurrent orders
      for (const item of lineItems) {
        const updated = await tx.produceListing.updateMany({
          where: { id: item.listingId, availableKg: { gte: item.quantityKg } },
          data: { availableKg: { decrement: item.quantityKg } },
        });
        if (updated.count === 0) {
          throw Object.assign(
            new Error(`Insufficient stock for listing ${item.listingId}`),
            { statusCode: 409, code: 'INSUFFICIENT_STOCK' }
          );
        }
      }

      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: o.id,
          buyerSnapshot: { displayName: buyer.displayName },
          lineItems: lineItems.map((item, idx) => ({
            name: listings[idx].product.name,
            quantityKg: item.quantityKg,
            farmGatePrice: item.farmGatePrice.toFixed(4),
            amount: item.farmGatePrice.mul(item.qty).toFixed(2),
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

    const IS_MOCK = process.env.NODE_ENV !== 'production';
    const payoutDelay = IS_MOCK ? 5_000 : 48 * 60 * 60 * 1000;
    const scheduledFor = new Date(Date.now() + (IS_MOCK ? 0 : 48 * 60 * 60 * 1000));

    const farmerPayouts = new Map<string, { farmerId: string; gross: Prisma.Decimal }>();
    for (const item of order.items) {
      const farmerId = item.listing.farmerId;
      // Both fields are Prisma.Decimal from the DB — no Number() conversion needed
      const gross = item.farmGatePrice.mul(item.quantityKg);
      const existing = farmerPayouts.get(farmerId);
      farmerPayouts.set(farmerId, { farmerId, gross: existing ? existing.gross.add(gross) : gross });
    }

    for (const [, { farmerId, gross }] of farmerPayouts) {
      const commission = gross.mul(SELLER_COMMISSION);
      const payout = await prisma.payout.create({
        data: { orderId, farmerId, grossAmount: gross, commission, netAmount: gross.sub(commission), scheduledFor },
      });
      await payoutsQueue.add('process_payout', { payoutId: payout.id }, { delay: payoutDelay });
    }

    return updated;
  },
};
