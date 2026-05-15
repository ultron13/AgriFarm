import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { authHeader } from './helpers';

vi.mock('../lib/ozow', () => ({
  createPaymentUrl: vi.fn().mockResolvedValue({ url: 'https://pay.ozow.com/mock' }),
  verifyWebhookSignature: vi.fn().mockReturnValue(true),
}));

const app = createApp();
const mockOrder = vi.mocked(prisma.order);
const mockBuyer = vi.mocked(prisma.buyer);
const mockFarmer = vi.mocked(prisma.farmer);
const mockPayment = vi.mocked(prisma.payment);

const buyerToken = authHeader('buyer-user', 'BUYER');
const farmerToken = authHeader('farmer-user', 'FARMER');
const adminToken = authHeader('admin-user', 'ADMIN');

beforeEach(() => vi.clearAllMocks());

describe('POST /api/v1/payments/initiate', () => {
  const body = { orderId: 'order-1', method: 'INSTANT_EFT' };

  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/payments/initiate').send(body);
    expect(res.status).toBe(401);
  });

  it('requires BUYER or ADMIN role', async () => {
    const res = await request(app).post('/api/v1/payments/initiate').set(farmerToken).send(body);
    expect(res.status).toBe(403);
  });

  it('rejects invalid method', async () => {
    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .set(buyerToken)
      .send({ orderId: 'order-1', method: 'WIRE_TRANSFER' });
    expect(res.status).toBe(422);
  });

  it('returns 403 when BUYER tries to pay for another buyer order (BOLA)', async () => {
    mockOrder.findUniqueOrThrow.mockResolvedValue({ id: 'order-1', buyerId: 'other-buyer', deliveredPrice: 1000, paymentDueDate: null } as any);
    mockBuyer.findUnique.mockResolvedValue({ id: 'my-buyer' } as any);
    const res = await request(app).post('/api/v1/payments/initiate').set(buyerToken).send(body);
    expect(res.status).toBe(403);
  });

  it('initiates INSTANT_EFT payment and returns redirect URL', async () => {
    mockOrder.findUniqueOrThrow.mockResolvedValue({ id: 'order-1', buyerId: 'b1', deliveredPrice: 5000, paymentDueDate: null } as any);
    mockBuyer.findUnique.mockResolvedValue({ id: 'b1' } as any);
    mockPayment.upsert.mockResolvedValue({ id: 'pay-1' } as any);
    const res = await request(app).post('/api/v1/payments/initiate').set(buyerToken).send(body);
    expect(res.status).toBe(200);
    expect(res.body.data.redirectUrl).toBe('https://pay.ozow.com/mock');
  });

  it('initiates ACCOUNT_TO_ACCOUNT payment for ADMIN without redirect', async () => {
    mockOrder.findUniqueOrThrow.mockResolvedValue({ id: 'order-1', buyerId: 'b1', deliveredPrice: 5000, paymentDueDate: null } as any);
    mockPayment.upsert.mockResolvedValue({ id: 'pay-1' } as any);
    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .set(adminToken)
      .send({ orderId: 'order-1', method: 'ACCOUNT_TO_ACCOUNT' });
    expect(res.status).toBe(200);
    expect(res.body.data.instructions).toBeDefined();
    expect(res.body.data.redirectUrl).toBeUndefined();
  });
});

describe('GET /api/v1/payments/:orderId', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/payments/order-1');
    expect(res.status).toBe(401);
  });

  it('returns 404 if payment not found', async () => {
    mockPayment.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/payments/order-1').set(adminToken);
    expect(res.status).toBe(404);
  });

  it('returns 403 when BUYER requests payment for another order (BOLA)', async () => {
    mockPayment.findUnique.mockResolvedValue({ id: 'pay-1', orderId: 'order-1' } as any);
    mockBuyer.findUnique.mockResolvedValue({ id: 'b1' } as any);
    mockOrder.findUnique.mockResolvedValue({ buyerId: 'other-buyer' } as any);
    const res = await request(app).get('/api/v1/payments/order-1').set(buyerToken);
    expect(res.status).toBe(403);
  });

  it('returns payment for owning BUYER', async () => {
    mockPayment.findUnique.mockResolvedValue({ id: 'pay-1', orderId: 'order-1', amount: 5000 } as any);
    mockBuyer.findUnique.mockResolvedValue({ id: 'b1' } as any);
    mockOrder.findUnique.mockResolvedValue({ buyerId: 'b1' } as any);
    const res = await request(app).get('/api/v1/payments/order-1').set(buyerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('pay-1');
  });

  it('returns 403 when FARMER requests payment not linked to their listings', async () => {
    mockPayment.findUnique.mockResolvedValue({ id: 'pay-1' } as any);
    mockFarmer.findUnique.mockResolvedValue({ id: 'f1' } as any);
    mockOrder.findUnique.mockResolvedValue({ items: [] } as any);
    const res = await request(app).get('/api/v1/payments/order-1').set(farmerToken);
    expect(res.status).toBe(403);
  });
});
