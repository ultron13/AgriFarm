import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { authHeader } from './helpers';

const app = createApp();
const mockPayout = vi.mocked(prisma.payout);
const mockFarmer = vi.mocked(prisma.farmer);

const farmerToken = authHeader('farmer-user', 'FARMER');
const adminToken = authHeader('admin-user', 'ADMIN');

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/payouts', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/payouts');
    expect(res.status).toBe(401);
  });

  it('scopes results to FARMER own payouts', async () => {
    mockFarmer.findUnique.mockResolvedValue({ id: 'f1' } as any);
    mockPayout.findMany.mockResolvedValue([]);
    mockPayout.count.mockResolvedValue(0);
    const res = await request(app).get('/api/v1/payouts').set(farmerToken);
    expect(res.status).toBe(200);
    expect(mockPayout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ farmerId: 'f1' }) })
    );
  });

  it('returns all payouts for ADMIN', async () => {
    mockPayout.findMany.mockResolvedValue([]);
    mockPayout.count.mockResolvedValue(0);
    const res = await request(app).get('/api/v1/payouts').set(adminToken);
    expect(res.status).toBe(200);
    expect(mockPayout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });
});

describe('POST /api/v1/payouts/:id/retry', () => {
  it('requires ADMIN role', async () => {
    const res = await request(app).post('/api/v1/payouts/pay-1/retry').set(farmerToken);
    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown payout', async () => {
    mockPayout.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/api/v1/payouts/pay-1/retry').set(adminToken);
    expect(res.status).toBe(404);
  });

  it('returns 400 if payout is not FAILED', async () => {
    mockPayout.findUnique.mockResolvedValue({ id: 'pay-1', status: 'PENDING' } as any);
    const res = await request(app).post('/api/v1/payouts/pay-1/retry').set(adminToken);
    expect(res.status).toBe(400);
  });

  it('queues retry for FAILED payout', async () => {
    mockPayout.findUnique.mockResolvedValue({ id: 'pay-1', status: 'FAILED' } as any);
    mockPayout.update.mockResolvedValue({ id: 'pay-1', status: 'PENDING' } as any);
    const res = await request(app).post('/api/v1/payouts/pay-1/retry').set(adminToken);
    expect(res.status).toBe(200);
    expect(mockPayout.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'PENDING' } })
    );
  });
});
