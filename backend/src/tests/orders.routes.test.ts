import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { authHeader } from './helpers';

const app = createApp();
const mockOrder = vi.mocked(prisma.order);
const mockBuyer = vi.mocked(prisma.buyer);
const mockFarmer = vi.mocked(prisma.farmer);
const mockPayout = vi.mocked(prisma.payout);

const buyerToken = authHeader('buyer-user', 'BUYER');
const farmerToken = authHeader('farmer-user', 'FARMER');
const adminToken = authHeader('admin-user', 'ADMIN');

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/orders', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/orders');
    expect(res.status).toBe(401);
  });

  it('scopes results to BUYER own orders', async () => {
    mockBuyer.findUnique.mockResolvedValue({ id: 'b1' } as any);
    mockOrder.findMany.mockResolvedValue([]);
    mockOrder.count.mockResolvedValue(0);
    const res = await request(app).get('/api/v1/orders').set(buyerToken);
    expect(res.status).toBe(200);
    expect(mockOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ buyerId: 'b1' }) })
    );
  });

  it('scopes results to FARMER own listings', async () => {
    mockFarmer.findUnique.mockResolvedValue({ id: 'f1' } as any);
    mockOrder.findMany.mockResolvedValue([]);
    mockOrder.count.mockResolvedValue(0);
    const res = await request(app).get('/api/v1/orders').set(farmerToken);
    expect(res.status).toBe(200);
    expect(mockOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ items: { some: { listing: { farmerId: 'f1' } } } }) })
    );
  });

  it('returns all orders for ADMIN', async () => {
    mockOrder.findMany.mockResolvedValue([]);
    mockOrder.count.mockResolvedValue(0);
    const res = await request(app).get('/api/v1/orders').set(adminToken);
    expect(res.status).toBe(200);
    expect(mockOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.not.objectContaining({ buyerId: expect.anything() }) })
    );
  });
});

describe('GET /api/v1/orders/:id', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/orders/order-1');
    expect(res.status).toBe(401);
  });

  it('returns 404 if order not found', async () => {
    mockOrder.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/orders/order-1').set(adminToken);
    expect(res.status).toBe(404);
  });

  it('returns 403 when BUYER requests another buyer order (BOLA)', async () => {
    mockOrder.findUnique.mockResolvedValue({ id: 'o1', buyerId: 'other', items: [] } as any);
    mockBuyer.findUnique.mockResolvedValue({ id: 'b1' } as any);
    const res = await request(app).get('/api/v1/orders/order-1').set(buyerToken);
    expect(res.status).toBe(403);
  });

  it('returns order for owning BUYER', async () => {
    mockOrder.findUnique.mockResolvedValue({ id: 'o1', buyerId: 'b1', items: [] } as any);
    mockBuyer.findUnique.mockResolvedValue({ id: 'b1' } as any);
    const res = await request(app).get('/api/v1/orders/order-1').set(buyerToken);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/v1/orders', () => {
  const validOrder = {
    items: [{ listingId: 'l1', quantityKg: 100 }],
    deliveryDate: new Date(Date.now() + 86400000 * 7).toISOString(),
  };

  it('requires BUYER or ADMIN role', async () => {
    const res = await request(app).post('/api/v1/orders').set(farmerToken).send(validOrder);
    expect(res.status).toBe(403);
  });

  it('returns 422 for missing required fields', async () => {
    const res = await request(app).post('/api/v1/orders').set(buyerToken).send({ deliveryDate: new Date().toISOString() });
    expect(res.status).toBe(422);
  });

  it('returns 404 if buyer profile missing', async () => {
    mockBuyer.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/api/v1/orders').set(buyerToken).send(validOrder);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/orders/:id/dispute', () => {
  it('requires BUYER or ADMIN role', async () => {
    const res = await request(app)
      .post('/api/v1/orders/o1/dispute')
      .set(farmerToken)
      .send({ reason: 'Produce arrived damaged and mouldy' });
    expect(res.status).toBe(403);
  });

  it('returns 422 if reason is too short', async () => {
    const res = await request(app)
      .post('/api/v1/orders/o1/dispute')
      .set(buyerToken)
      .send({ reason: 'bad' });
    expect(res.status).toBe(422);
  });

  it('returns 403 when BUYER disputes another buyer order (BOLA)', async () => {
    mockOrder.findUnique.mockResolvedValue({ id: 'o1', buyerId: 'other', status: 'DELIVERED' } as any);
    mockBuyer.findUnique.mockResolvedValue({ id: 'b1' } as any);
    const res = await request(app)
      .post('/api/v1/orders/o1/dispute')
      .set(buyerToken)
      .send({ reason: 'Produce arrived damaged and mouldy' });
    expect(res.status).toBe(403);
  });

  it('returns 409 if order status is not disputable', async () => {
    mockOrder.findUnique.mockResolvedValue({ id: 'o1', buyerId: 'b1', status: 'PENDING' } as any);
    mockBuyer.findUnique.mockResolvedValue({ id: 'b1' } as any);
    const res = await request(app)
      .post('/api/v1/orders/o1/dispute')
      .set(buyerToken)
      .send({ reason: 'Produce arrived damaged and mouldy' });
    expect(res.status).toBe(409);
  });

  it('disputes order and cancels pending payouts', async () => {
    mockOrder.findUnique.mockResolvedValue({ id: 'o1', buyerId: 'b1', status: 'DELIVERED', notes: null } as any);
    mockBuyer.findUnique.mockResolvedValue({ id: 'b1' } as any);
    mockOrder.update.mockResolvedValue({ id: 'o1', status: 'DISPUTED' } as any);
    mockPayout.updateMany.mockResolvedValue({ count: 1 } as any);
    const res = await request(app)
      .post('/api/v1/orders/o1/dispute')
      .set(buyerToken)
      .send({ reason: 'Produce arrived damaged and mouldy' });
    expect(res.status).toBe(200);
    expect(mockPayout.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CANCELLED' } })
    );
  });
});

describe('POST /api/v1/orders/:id/resolve-dispute', () => {
  it('requires ADMIN or SUPER_ADMIN role', async () => {
    const res = await request(app)
      .post('/api/v1/orders/o1/resolve-dispute')
      .set(buyerToken)
      .send({ outcome: 'RESOLVE', note: 'Verified delivery OK' });
    expect(res.status).toBe(403);
  });

  it('returns 422 for invalid outcome', async () => {
    const res = await request(app)
      .post('/api/v1/orders/o1/resolve-dispute')
      .set(adminToken)
      .send({ outcome: 'IGNORE', note: 'Verified delivery OK' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when note is too short', async () => {
    const res = await request(app)
      .post('/api/v1/orders/o1/resolve-dispute')
      .set(adminToken)
      .send({ outcome: 'RESOLVE', note: 'OK' });
    expect(res.status).toBe(422);
  });

  it('returns 404 when order not found', async () => {
    mockOrder.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/v1/orders/o1/resolve-dispute')
      .set(adminToken)
      .send({ outcome: 'RESOLVE', note: 'Verified delivery OK' });
    expect(res.status).toBe(404);
  });

  it('returns 409 when order is not DISPUTED', async () => {
    mockOrder.findUnique.mockResolvedValue({ id: 'o1', status: 'DELIVERED', notes: null, payouts: [], payment: null } as any);
    const res = await request(app)
      .post('/api/v1/orders/o1/resolve-dispute')
      .set(adminToken)
      .send({ outcome: 'RESOLVE', note: 'Verified delivery OK' });
    expect(res.status).toBe(409);
  });

  it('REFUND path — updates order to REFUNDED, does not re-queue payouts', async () => {
    mockOrder.findUnique.mockResolvedValue({ id: 'o1', status: 'DISPUTED', notes: '[DISPUTE] bad produce', payouts: [], payment: null } as any);
    mockOrder.update.mockResolvedValue({ id: 'o1', status: 'REFUNDED' } as any);
    const res = await request(app)
      .post('/api/v1/orders/o1/resolve-dispute')
      .set(adminToken)
      .send({ outcome: 'REFUND', note: 'Quality photos confirmed spoilage' });
    expect(res.status).toBe(200);
    expect(mockOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'REFUNDED' }) })
    );
    expect(mockPayout.updateMany).not.toHaveBeenCalled();
  });

  it('RESOLVE path — updates order to DELIVERED and re-enables cancelled payouts', async () => {
    mockOrder.findUnique.mockResolvedValue({
      id: 'o1', status: 'DISPUTED', notes: '[DISPUTE] wrong grade', payouts: [{ id: 'pay-1' }], payment: { status: 'PAID' },
    } as any);
    mockOrder.update.mockResolvedValue({ id: 'o1', status: 'DELIVERED' } as any);
    mockPayout.updateMany.mockResolvedValue({ count: 1 } as any);
    const res = await request(app)
      .post('/api/v1/orders/o1/resolve-dispute')
      .set(adminToken)
      .send({ outcome: 'RESOLVE', note: 'Grade confirmed by field agent photos' });
    expect(res.status).toBe(200);
    expect(mockOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DELIVERED' }) })
    );
    expect(mockPayout.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'PENDING' } })
    );
  });
});

describe('PATCH /api/v1/orders/:id/status', () => {
  it('requires ADMIN role', async () => {
    const res = await request(app)
      .patch('/api/v1/orders/o1/status')
      .set(buyerToken)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(403);
  });

  it('returns 422 for invalid status', async () => {
    const res = await request(app)
      .patch('/api/v1/orders/o1/status')
      .set(adminToken)
      .send({ status: 'FLYING' });
    expect(res.status).toBe(422);
  });

  it('updates order status as ADMIN', async () => {
    mockOrder.update.mockResolvedValue({ id: 'o1', status: 'CONFIRMED' } as any);
    const res = await request(app)
      .patch('/api/v1/orders/o1/status')
      .set(adminToken)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(200);
    expect(mockOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CONFIRMED' } })
    );
  });
});
