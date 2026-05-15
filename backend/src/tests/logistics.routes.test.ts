import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { authHeader } from './helpers';

const app = createApp();
const adminToken = authHeader('admin-user', 'ADMIN');
const logisticsToken = authHeader('lc-user', 'LOGISTICS_COORDINATOR');
const buyerToken = authHeader('buyer-user', 'BUYER');

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/logistics/routes', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/logistics/routes');
    expect(res.status).toBe(401);
  });

  it('requires ADMIN or LOGISTICS_COORDINATOR role', async () => {
    const res = await request(app).get('/api/v1/logistics/routes').set(buyerToken);
    expect(res.status).toBe(403);
  });

  it('returns active routes', async () => {
    vi.mocked(prisma.logisticsRoute.findMany).mockResolvedValue([{ id: 'r1', name: 'JHB-LIM' }] as any);
    const res = await request(app).get('/api/v1/logistics/routes').set(logisticsToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/logistics/routes/:id/deliveries', () => {
  it('requires LOGISTICS_COORDINATOR role', async () => {
    const res = await request(app).get('/api/v1/logistics/routes/r1/deliveries').set(buyerToken);
    expect(res.status).toBe(403);
  });

  it('returns deliveries for a route', async () => {
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([{ id: 'd1' }] as any);
    const res = await request(app).get('/api/v1/logistics/routes/r1/deliveries').set(logisticsToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('accepts date filter', async () => {
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([]);
    const res = await request(app)
      .get('/api/v1/logistics/routes/r1/deliveries?date=2026-05-15')
      .set(logisticsToken);
    expect(res.status).toBe(200);
    expect(prisma.delivery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ order: expect.anything() }) })
    );
  });
});

describe('POST /api/v1/logistics/deliveries', () => {
  const validDelivery = { orderId: 'order-1' };

  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/logistics/deliveries').send(validDelivery);
    expect(res.status).toBe(401);
  });

  it('requires LOGISTICS_COORDINATOR role', async () => {
    const res = await request(app).post('/api/v1/logistics/deliveries').set(buyerToken).send(validDelivery);
    expect(res.status).toBe(403);
  });

  it('creates delivery', async () => {
    vi.mocked(prisma.delivery.create).mockResolvedValue({ id: 'd1', orderId: 'order-1' } as any);
    const res = await request(app).post('/api/v1/logistics/deliveries').set(logisticsToken).send(validDelivery);
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('d1');
  });

  it('rejects unknown fields (strict schema)', async () => {
    const res = await request(app)
      .post('/api/v1/logistics/deliveries')
      .set(adminToken)
      .send({ orderId: 'order-1', unknownField: 'x' });
    expect(res.status).toBe(422);
  });
});

describe('PATCH /api/v1/logistics/deliveries/:id', () => {
  it('requires authentication', async () => {
    const res = await request(app).patch('/api/v1/logistics/deliveries/d1').send({ status: 'COLLECTED' });
    expect(res.status).toBe(401);
  });

  it('updates delivery status', async () => {
    vi.mocked(prisma.delivery.update).mockResolvedValue({ id: 'd1', orderId: 'order-1', status: 'COLLECTED' } as any);
    const res = await request(app)
      .patch('/api/v1/logistics/deliveries/d1')
      .set(logisticsToken)
      .send({ status: 'COLLECTED' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COLLECTED');
  });
});
