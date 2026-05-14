import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { authHeader } from './helpers';

const app = createApp();
const mockTender = vi.mocked(prisma.tender);
const mockBid = vi.mocked(prisma.tenderBid);
const mockBuyer = vi.mocked(prisma.buyer);
const mockFarmer = vi.mocked(prisma.farmer);

const govToken = authHeader('gov-user', 'GOV_BUYER');
const farmerToken = authHeader('farmer-user', 'FARMER');
const buyerToken = authHeader('buyer-user', 'BUYER');

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/tenders', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/tenders');
    expect(res.status).toBe(401);
  });

  it('returns tenders for FARMER (open/evaluation/awarded filter)', async () => {
    mockTender.findMany.mockResolvedValue([]);
    mockTender.count.mockResolvedValue(0);
    const res = await request(app).get('/api/v1/tenders').set(farmerToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns only own tenders for GOV_BUYER', async () => {
    mockBuyer.findUnique.mockResolvedValue({ id: 'buyer-1' } as any);
    mockTender.findMany.mockResolvedValue([]);
    mockTender.count.mockResolvedValue(0);
    const res = await request(app).get('/api/v1/tenders').set(govToken);
    expect(res.status).toBe(200);
    expect(mockTender.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ buyerId: 'buyer-1' }) })
    );
  });
});

describe('POST /api/v1/tenders', () => {
  const validTender = {
    title: 'Supply Fresh Tomatoes',
    description: 'We need fresh tomatoes for school feeding scheme',
    department: 'DeptOfEducation',
    productCategory: 'Vegetables',
    quantityKg: 5000,
    deliveryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    deliveryProvince: 'Gauteng',
    deliveryAddress: '123 Main St, Johannesburg, 2000',
    closingDate: new Date(Date.now() + 86400000 * 14).toISOString(),
  };

  it('requires GOV_BUYER role', async () => {
    const res = await request(app).post('/api/v1/tenders').set(farmerToken).send(validTender);
    expect(res.status).toBe(403);
  });

  it('returns 404 if buyer profile missing', async () => {
    mockBuyer.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/api/v1/tenders').set(govToken).send(validTender);
    expect(res.status).toBe(404);
  });

  it('creates tender with reference number', async () => {
    mockBuyer.findUnique.mockResolvedValue({ id: 'b1' } as any);
    mockTender.count.mockResolvedValue(5);
    mockTender.create.mockResolvedValue({ id: 't1', referenceNumber: 'TND-2026-0006' } as any);
    const res = await request(app).post('/api/v1/tenders').set(govToken).send(validTender);
    expect(res.status).toBe(201);
    expect(mockTender.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ referenceNumber: 'TND-2026-0006' }) })
    );
  });
});

describe('POST /api/v1/tenders/:id/bids', () => {
  const validBid = { pricePerKg: 12.5, quantityKg: 1000, complianceDocs: [] };

  it('requires FARMER role', async () => {
    const res = await request(app).post('/api/v1/tenders/t1/bids').set(buyerToken).send(validBid);
    expect(res.status).toBe(403);
  });

  it('returns 404 for missing tender', async () => {
    mockTender.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/api/v1/tenders/t1/bids').set(farmerToken).send(validBid);
    expect(res.status).toBe(404);
  });

  it('returns 409 for closed tender', async () => {
    mockTender.findUnique.mockResolvedValue({ id: 't1', status: 'CLOSED' } as any);
    const res = await request(app).post('/api/v1/tenders/t1/bids').set(farmerToken).send(validBid);
    expect(res.status).toBe(409);
  });

  it('creates bid for open tender', async () => {
    mockTender.findUnique.mockResolvedValue({ id: 't1', status: 'OPEN' } as any);
    mockFarmer.findUnique.mockResolvedValue({ id: 'f1' } as any);
    mockBid.create.mockResolvedValue({ id: 'bid-1' } as any);
    const res = await request(app).post('/api/v1/tenders/t1/bids').set(farmerToken).send(validBid);
    expect(res.status).toBe(201);
  });
});

describe('PATCH /api/v1/tenders/:id/bids/:bidId', () => {
  it('rejects invalid status', async () => {
    const res = await request(app)
      .patch('/api/v1/tenders/t1/bids/b1')
      .set(govToken)
      .send({ status: 'INVALID' });
    expect(res.status).toBe(400);
  });

  it('awards bid and updates tender', async () => {
    mockBid.update.mockResolvedValue({ id: 'b1', status: 'AWARDED' } as any);
    mockTender.update.mockResolvedValue({} as any);
    const res = await request(app)
      .patch('/api/v1/tenders/t1/bids/b1')
      .set(govToken)
      .send({ status: 'AWARDED' });
    expect(res.status).toBe(200);
    expect(mockTender.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'AWARDED', awardedBidId: 'b1' }) })
    );
  });
});
