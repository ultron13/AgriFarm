import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { payoutsQueue, invoicesQueue, notificationsQueue } from '../jobs/queues';
import { OrderService } from '../services/order.service';

const mockListing = vi.mocked(prisma.produceListing);
const mockBuyer = vi.mocked(prisma.buyer);
const mockOrder = vi.mocked(prisma.order);
const mockInvoice = vi.mocked(prisma.invoice);
const mockPayout = vi.mocked(prisma.payout);
const mockPayoutsQueue = vi.mocked(payoutsQueue);
const mockInvoicesQueue = vi.mocked(invoicesQueue);
const mockNotificationsQueue = vi.mocked(notificationsQueue);

// 100 kg at R10/kg:
//   farmGate      = 10 × 100       = R1 000.00
//   logistics     = 4.5 × 100      = R  450.00
//   baseDelivered                   = R1 450.00
//   buyerComm     = 1450 × 0.08    = R  116.00
//   deliveredPrice                  = R1 566.00
const LISTING = {
  id: 'listing-1',
  farmerId: 'farmer-1',
  farmGatePrice: new Prisma.Decimal('10.00'),
  minimumOrderKg: new Prisma.Decimal('50'),
  farmer: { id: 'farmer-1' },
  product: { name: 'Tomatoes' },
};

const BUYER = {
  id: 'buyer-1',
  displayName: 'Test Buyer',
  creditLimit: null as Prisma.Decimal | null,
  preferredPaymentTerms: 30,
  whatsappNumber: '+27821234567',
};

const ORDER_INPUT = {
  items: [{ listingId: 'listing-1', quantityKg: 100 }],
  deliveryDate: new Date(Date.now() + 86_400_000 * 7).toISOString(),
};

beforeEach(() => vi.clearAllMocks());

// ─── createOrder ─────────────────────────────────────────────────────────────

describe('OrderService.createOrder', () => {
  describe('pricing arithmetic', () => {
    it('computes totalFarmGateValue, logisticsCharge, and deliveredPrice correctly', async () => {
      mockListing.findUniqueOrThrow.mockResolvedValue(LISTING as any);
      mockBuyer.findUniqueOrThrow.mockResolvedValue(BUYER as any);
      mockOrder.create.mockResolvedValue({ id: 'order-1', items: [] } as any);
      mockListing.updateMany.mockResolvedValue({ count: 1 });
      mockInvoice.create.mockResolvedValue({ id: 'inv-1' } as any);

      await OrderService.createOrder('buyer-1', ORDER_INPUT);

      const { data } = mockOrder.create.mock.calls[0][0] as any;
      expect(data.totalFarmGateValue.toFixed(2)).toBe('1000.00');
      expect(data.logisticsCharge.toFixed(2)).toBe('450.00');
      expect(data.deliveredPrice.toFixed(2)).toBe('1566.00');
    });
  });

  // ── minimum order ───────────────────────────────────────────────────────────
  describe('minimum order validation', () => {
    it('throws BELOW_MINIMUM_ORDER (422) when quantity is under the listing minimum', async () => {
      mockListing.findUniqueOrThrow.mockResolvedValue({
        ...LISTING,
        minimumOrderKg: new Prisma.Decimal('200'),
      } as any);

      await expect(OrderService.createOrder('buyer-1', ORDER_INPUT))
        .rejects.toMatchObject({ statusCode: 422, code: 'BELOW_MINIMUM_ORDER' });
    });

    it('allows an order when quantity exactly equals minimumOrderKg', async () => {
      mockListing.findUniqueOrThrow.mockResolvedValue({
        ...LISTING,
        minimumOrderKg: new Prisma.Decimal('100'),
      } as any);
      mockBuyer.findUniqueOrThrow.mockResolvedValue(BUYER as any);
      mockOrder.create.mockResolvedValue({ id: 'order-1', items: [] } as any);
      mockListing.updateMany.mockResolvedValue({ count: 1 });
      mockInvoice.create.mockResolvedValue({ id: 'inv-1' } as any);

      await expect(OrderService.createOrder('buyer-1', ORDER_INPUT)).resolves.toBeDefined();
    });

    it('does not reach the DB write when the first item fails the minimum check', async () => {
      mockListing.findUniqueOrThrow.mockResolvedValue({
        ...LISTING,
        minimumOrderKg: new Prisma.Decimal('200'),
      } as any);

      await expect(OrderService.createOrder('buyer-1', ORDER_INPUT))
        .rejects.toMatchObject({ code: 'BELOW_MINIMUM_ORDER' });

      expect(mockOrder.create).not.toHaveBeenCalled();
    });
  });

  // ── credit limit ────────────────────────────────────────────────────────────
  describe('credit limit enforcement', () => {
    it('skips the aggregate query when buyer.creditLimit is null', async () => {
      mockListing.findUniqueOrThrow.mockResolvedValue(LISTING as any);
      mockBuyer.findUniqueOrThrow.mockResolvedValue({ ...BUYER, creditLimit: null } as any);
      mockOrder.create.mockResolvedValue({ id: 'order-1', items: [] } as any);
      mockListing.updateMany.mockResolvedValue({ count: 1 });
      mockInvoice.create.mockResolvedValue({ id: 'inv-1' } as any);

      await OrderService.createOrder('buyer-1', ORDER_INPUT);

      expect(mockOrder.aggregate).not.toHaveBeenCalled();
    });

    it('throws CREDIT_LIMIT_EXCEEDED (409) when outstanding + new order exceeds limit', async () => {
      mockListing.findUniqueOrThrow.mockResolvedValue(LISTING as any);
      mockBuyer.findUniqueOrThrow.mockResolvedValue({
        ...BUYER,
        creditLimit: new Prisma.Decimal('2000'),
      } as any);
      // outstanding 800 + deliveredPrice 1566 = 2366 > 2000
      mockOrder.aggregate.mockResolvedValue({
        _sum: { deliveredPrice: new Prisma.Decimal('800') },
      } as any);

      await expect(OrderService.createOrder('buyer-1', ORDER_INPUT))
        .rejects.toMatchObject({ statusCode: 409, code: 'CREDIT_LIMIT_EXCEEDED' });
    });

    it('allows an order when outstanding + new total equals the limit exactly', async () => {
      mockListing.findUniqueOrThrow.mockResolvedValue(LISTING as any);
      // limit = 800 + 1566 = 2366 (not strictly greater → passes)
      mockBuyer.findUniqueOrThrow.mockResolvedValue({
        ...BUYER,
        creditLimit: new Prisma.Decimal('2366'),
      } as any);
      mockOrder.aggregate.mockResolvedValue({
        _sum: { deliveredPrice: new Prisma.Decimal('800') },
      } as any);
      mockOrder.create.mockResolvedValue({ id: 'order-1', items: [] } as any);
      mockListing.updateMany.mockResolvedValue({ count: 1 });
      mockInvoice.create.mockResolvedValue({ id: 'inv-1' } as any);

      await expect(OrderService.createOrder('buyer-1', ORDER_INPUT)).resolves.toBeDefined();
    });

    it('treats null aggregate sum as zero outstanding balance', async () => {
      mockListing.findUniqueOrThrow.mockResolvedValue(LISTING as any);
      mockBuyer.findUniqueOrThrow.mockResolvedValue({
        ...BUYER,
        creditLimit: new Prisma.Decimal('2000'),
      } as any);
      // Prisma returns null when there are no matching rows
      mockOrder.aggregate.mockResolvedValue({ _sum: { deliveredPrice: null } } as any);
      mockOrder.create.mockResolvedValue({ id: 'order-1', items: [] } as any);
      mockListing.updateMany.mockResolvedValue({ count: 1 });
      mockInvoice.create.mockResolvedValue({ id: 'inv-1' } as any);

      await expect(OrderService.createOrder('buyer-1', ORDER_INPUT)).resolves.toBeDefined();
    });
  });

  // ── stock guard ─────────────────────────────────────────────────────────────
  describe('stock guard (atomic check-and-decrement)', () => {
    it('throws INSUFFICIENT_STOCK (409) when updateMany returns count 0', async () => {
      mockListing.findUniqueOrThrow.mockResolvedValue(LISTING as any);
      mockBuyer.findUniqueOrThrow.mockResolvedValue(BUYER as any);
      mockOrder.create.mockResolvedValue({ id: 'order-1', items: [] } as any);
      mockListing.updateMany.mockResolvedValue({ count: 0 }); // race — stock gone
      mockInvoice.create.mockResolvedValue({ id: 'inv-1' } as any);

      await expect(OrderService.createOrder('buyer-1', ORDER_INPUT))
        .rejects.toMatchObject({ statusCode: 409, code: 'INSUFFICIENT_STOCK' });
    });
  });

  // ── side effects ────────────────────────────────────────────────────────────
  describe('post-commit side effects', () => {
    it('enqueues invoice generation and buyer notification after transaction commits', async () => {
      mockListing.findUniqueOrThrow.mockResolvedValue(LISTING as any);
      mockBuyer.findUniqueOrThrow.mockResolvedValue(BUYER as any);
      mockOrder.create.mockResolvedValue({ id: 'order-1', items: [] } as any);
      mockListing.updateMany.mockResolvedValue({ count: 1 });
      mockInvoice.create.mockResolvedValue({ id: 'inv-1' } as any);

      await OrderService.createOrder('buyer-1', ORDER_INPUT);

      expect(mockInvoicesQueue.add).toHaveBeenCalledWith(
        'generate_invoice',
        expect.objectContaining({ invoiceId: 'inv-1', orderId: 'order-1' }),
      );
      expect(mockNotificationsQueue.add).toHaveBeenCalledWith(
        'order_placed',
        expect.objectContaining({ templateId: 'order_confirmed' }),
      );
    });
  });
});

// ─── confirmDelivery ──────────────────────────────────────────────────────────

describe('OrderService.confirmDelivery', () => {
  // ── state validation ────────────────────────────────────────────────────────
  describe('state validation', () => {
    it.each(['DELIVERED', 'CANCELLED', 'REFUNDED', 'DISPUTED'])(
      'throws INVALID_STATE (400) when order status is %s',
      async (status) => {
        mockOrder.findUniqueOrThrow.mockResolvedValue({
          id: 'order-1', status, items: [], buyer: {},
        } as any);

        await expect(OrderService.confirmDelivery('order-1'))
          .rejects.toMatchObject({ statusCode: 400, code: 'INVALID_STATE' });
      },
    );
  });

  // ── payout arithmetic ───────────────────────────────────────────────────────
  describe('payout arithmetic', () => {
    it('deducts 5% seller commission: gross 1000 → commission 50 → net 950', async () => {
      mockOrder.findUniqueOrThrow.mockResolvedValue({
        id: 'order-1',
        status: 'PENDING',
        items: [{
          farmGatePrice: new Prisma.Decimal('10'),
          quantityKg: new Prisma.Decimal('100'),
          listing: { farmerId: 'farmer-1', farmer: { id: 'farmer-1' } },
        }],
        buyer: {},
      } as any);
      mockOrder.update.mockResolvedValue({ id: 'order-1', status: 'DELIVERED' } as any);
      mockPayout.create.mockResolvedValue({ id: 'payout-1' } as any);

      await OrderService.confirmDelivery('order-1');

      const { data } = mockPayout.create.mock.calls[0][0] as any;
      expect(data.grossAmount.toFixed(2)).toBe('1000.00');
      expect(data.commission.toFixed(2)).toBe('50.00');
      expect(data.netAmount.toFixed(2)).toBe('950.00');
    });

    it('aggregates two line-items from the same farmer into one payout (10×100 + 5×200 = 2000)', async () => {
      mockOrder.findUniqueOrThrow.mockResolvedValue({
        id: 'order-1',
        status: 'CONFIRMED',
        items: [
          { farmGatePrice: new Prisma.Decimal('10'), quantityKg: new Prisma.Decimal('100'), listing: { farmerId: 'farmer-1', farmer: { id: 'farmer-1' } } },
          { farmGatePrice: new Prisma.Decimal('5'),  quantityKg: new Prisma.Decimal('200'), listing: { farmerId: 'farmer-1', farmer: { id: 'farmer-1' } } },
        ],
        buyer: {},
      } as any);
      mockOrder.update.mockResolvedValue({ id: 'order-1', status: 'DELIVERED' } as any);
      mockPayout.create.mockResolvedValue({ id: 'payout-1' } as any);

      await OrderService.confirmDelivery('order-1');

      expect(mockPayout.create).toHaveBeenCalledTimes(1);
      const { data } = mockPayout.create.mock.calls[0][0] as any;
      expect(data.grossAmount.toFixed(2)).toBe('2000.00');
    });

    it('creates separate payout records for two different farmers', async () => {
      mockOrder.findUniqueOrThrow.mockResolvedValue({
        id: 'order-1',
        status: 'CONFIRMED',
        items: [
          { farmGatePrice: new Prisma.Decimal('10'), quantityKg: new Prisma.Decimal('100'), listing: { farmerId: 'farmer-1', farmer: { id: 'farmer-1' } } },
          { farmGatePrice: new Prisma.Decimal('8'),  quantityKg: new Prisma.Decimal('50'),  listing: { farmerId: 'farmer-2', farmer: { id: 'farmer-2' } } },
        ],
        buyer: {},
      } as any);
      mockOrder.update.mockResolvedValue({ id: 'order-1', status: 'DELIVERED' } as any);
      mockPayout.create.mockResolvedValue({ id: 'payout-1' } as any);

      await OrderService.confirmDelivery('order-1');

      expect(mockPayout.create).toHaveBeenCalledTimes(2);
    });
  });

  // ── side effects ────────────────────────────────────────────────────────────
  describe('side effects', () => {
    it('enqueues one payout job per farmer', async () => {
      mockOrder.findUniqueOrThrow.mockResolvedValue({
        id: 'order-1',
        status: 'PENDING',
        items: [
          { farmGatePrice: new Prisma.Decimal('10'), quantityKg: new Prisma.Decimal('100'), listing: { farmerId: 'farmer-1', farmer: { id: 'farmer-1' } } },
          { farmGatePrice: new Prisma.Decimal('8'),  quantityKg: new Prisma.Decimal('50'),  listing: { farmerId: 'farmer-2', farmer: { id: 'farmer-2' } } },
        ],
        buyer: {},
        payment: { status: 'PAID' },
      } as any);
      mockOrder.update.mockResolvedValue({ id: 'order-1', status: 'DELIVERED' } as any);
      mockPayout.create.mockResolvedValue({ id: 'payout-1' } as any);

      await OrderService.confirmDelivery('order-1');

      expect(mockPayoutsQueue.add).toHaveBeenCalledTimes(2);
      expect(mockPayoutsQueue.add).toHaveBeenCalledWith(
        'process_payout',
        { payoutId: 'payout-1' },
        expect.objectContaining({ delay: expect.any(Number) }),
      );
    });
  });
});
