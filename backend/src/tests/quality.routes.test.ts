import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { authHeader } from './helpers';

const app = createApp();
const adminToken = authHeader('admin-user', 'ADMIN');
const fieldAgentToken = authHeader('agent-user', 'FIELD_AGENT');
const buyerToken = authHeader('buyer-user', 'BUYER');
const farmerToken = authHeader('farmer-user', 'FARMER');

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/quality-checks/pending', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/quality-checks/pending');
    expect(res.status).toBe(401);
  });

  it('requires FIELD_AGENT or ADMIN role', async () => {
    const res = await request(app).get('/api/v1/quality-checks/pending').set(buyerToken);
    expect(res.status).toBe(403);
  });

  it('returns pending orders for FIELD_AGENT', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([{ id: 'order-1', status: 'CONFIRMED' }] as any);
    const res = await request(app).get('/api/v1/quality-checks/pending').set(fieldAgentToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('POST /api/v1/quality-checks', () => {
  const validPayload = {
    orderId: 'order-1',
    farmerId: 'farmer-1',
    gradeAwarded: 'A',
    quantityKg: 100,
    rejectedKg: 0,
    photos: ['listings/o1/a.jpg', 'listings/o1/b.jpg', 'listings/o1/c.jpg'],
  };

  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/quality-checks').send(validPayload);
    expect(res.status).toBe(401);
  });

  it('requires FIELD_AGENT or ADMIN role', async () => {
    const res = await request(app).post('/api/v1/quality-checks').set(buyerToken).send(validPayload);
    expect(res.status).toBe(403);
  });

  it('rejects invalid photo keys', async () => {
    const res = await request(app)
      .post('/api/v1/quality-checks')
      .set(adminToken)
      .send({ ...validPayload, photos: ['../etc/passwd', 'b.jpg', 'c.jpg'] });
    expect(res.status).toBe(422);
  });

  it('rejects fewer than 3 photos', async () => {
    const res = await request(app)
      .post('/api/v1/quality-checks')
      .set(adminToken)
      .send({ ...validPayload, photos: ['a.jpg', 'b.jpg'] });
    expect(res.status).toBe(422);
  });

  it('creates quality check and updates order status', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) =>
      fn({
        qualityCheck: { create: vi.fn().mockResolvedValue({ id: 'qc-1', photos: [] }) },
        order: { update: vi.fn().mockResolvedValue({}) },
      })
    );
    const res = await request(app).post('/api/v1/quality-checks').set(fieldAgentToken).send(validPayload);
    expect(res.status).toBe(201);
  });
});

describe('GET /api/v1/quality-checks/:orderId', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/quality-checks/order-1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when check not found', async () => {
    vi.mocked(prisma.qualityCheck.findFirst).mockResolvedValue(null);
    const res = await request(app).get('/api/v1/quality-checks/order-1').set(adminToken);
    expect(res.status).toBe(404);
  });

  it('returns check for ADMIN', async () => {
    vi.mocked(prisma.qualityCheck.findFirst).mockResolvedValue({ id: 'qc-1' } as any);
    const res = await request(app).get('/api/v1/quality-checks/order-1').set(adminToken);
    expect(res.status).toBe(200);
  });

  it('returns 403 for BUYER accessing another buyer check', async () => {
    vi.mocked(prisma.buyer.findUnique).mockResolvedValue({ id: 'b1' } as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ buyerId: 'b2' } as any);
    const res = await request(app).get('/api/v1/quality-checks/order-1').set(buyerToken);
    expect(res.status).toBe(403);
  });

  it('returns check for owning BUYER', async () => {
    vi.mocked(prisma.buyer.findUnique).mockResolvedValue({ id: 'b1' } as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ buyerId: 'b1' } as any);
    vi.mocked(prisma.qualityCheck.findFirst).mockResolvedValue({ id: 'qc-1' } as any);
    const res = await request(app).get('/api/v1/quality-checks/order-1').set(buyerToken);
    expect(res.status).toBe(200);
  });

  it('returns 403 for FARMER not on the order', async () => {
    vi.mocked(prisma.farmer.findUnique).mockResolvedValue({ id: 'f1' } as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ items: [{ listing: { farmerId: 'f2' } }] } as any);
    const res = await request(app).get('/api/v1/quality-checks/order-1').set(farmerToken);
    expect(res.status).toBe(403);
  });

  it('returns check for owning FARMER', async () => {
    vi.mocked(prisma.farmer.findUnique).mockResolvedValue({ id: 'f1' } as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ items: [{ listing: { farmerId: 'f1' } }] } as any);
    vi.mocked(prisma.qualityCheck.findFirst).mockResolvedValue({ id: 'qc-1' } as any);
    const res = await request(app).get('/api/v1/quality-checks/order-1').set(farmerToken);
    expect(res.status).toBe(200);
  });
});
