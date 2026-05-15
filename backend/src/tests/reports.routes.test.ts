import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { authHeader } from './helpers';

const app = createApp();
const adminToken = authHeader('admin-user', 'ADMIN');
const buyerToken = authHeader('buyer-user', 'BUYER');

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/reports/gmv', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/reports/gmv');
    expect(res.status).toBe(401);
  });

  it('requires ADMIN role', async () => {
    const res = await request(app).get('/api/v1/reports/gmv').set(buyerToken);
    expect(res.status).toBe(403);
  });

  it('returns GMV breakdown for ADMIN', async () => {
    vi.mocked(prisma.order.groupBy).mockResolvedValue([
      { status: 'DELIVERED', _sum: { deliveredPrice: 10000 }, _count: { id: 5 } },
    ] as any);
    const res = await request(app).get('/api/v1/reports/gmv').set(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalGmv', 10000);
    expect(res.body.data).toHaveProperty('totalOrders', 5);
  });

  it('handles null deliveredPrice in GMV groupBy', async () => {
    vi.mocked(prisma.order.groupBy).mockResolvedValue([
      { status: 'IN_TRANSIT', _sum: { deliveredPrice: null }, _count: { id: 2 } },
    ] as any);
    const res = await request(app)
      .get('/api/v1/reports/gmv?from=2026-01-01&to=2026-12-31')
      .set(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.totalGmv).toBe(0);
  });

  it('accepts date range query params', async () => {
    vi.mocked(prisma.order.groupBy).mockResolvedValue([]);
    const res = await request(app)
      .get('/api/v1/reports/gmv?from=2026-01-01&to=2026-12-31')
      .set(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.totalGmv).toBe(0);
  });
});

describe('GET /api/v1/reports/unit-economics', () => {
  it('requires ADMIN role', async () => {
    const res = await request(app).get('/api/v1/reports/unit-economics').set(buyerToken);
    expect(res.status).toBe(403);
  });

  it('returns unit economics for ADMIN', async () => {
    vi.mocked(prisma.order.aggregate).mockResolvedValue({
      _sum: { deliveredPrice: 50000, totalFarmGateValue: 40000, logisticsCharge: 2000 },
      _count: { id: 10 },
    } as any);
    vi.mocked(prisma.payout.aggregate).mockResolvedValue({
      _sum: { commission: 2000 },
    } as any);
    const res = await request(app).get('/api/v1/reports/unit-economics').set(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('revenue');
    expect(res.body.data).toHaveProperty('netMargin');
    expect(res.body.data.orderCount).toBe(10);
  });

  it('handles null aggregate sums with date range', async () => {
    vi.mocked(prisma.order.aggregate).mockResolvedValue({
      _sum: { deliveredPrice: null, totalFarmGateValue: null, logisticsCharge: null },
      _count: { id: 0 },
    } as any);
    vi.mocked(prisma.payout.aggregate).mockResolvedValue({ _sum: { commission: null } } as any);
    const res = await request(app)
      .get('/api/v1/reports/unit-economics?from=2026-01-01&to=2026-06-30')
      .set(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.revenue).toBe(0);
  });
});

describe('GET /api/v1/reports/bbbee', () => {
  it('requires ADMIN role', async () => {
    const res = await request(app).get('/api/v1/reports/bbbee').set(buyerToken);
    expect(res.status).toBe(403);
  });

  it('returns bbbee report with zero pct when no payouts', async () => {
    vi.mocked(prisma.payout.aggregate)
      .mockResolvedValueOnce({ _sum: { grossAmount: 0 }, _count: { id: 0 } } as any)
      .mockResolvedValueOnce({ _sum: { grossAmount: 0 } } as any);
    const res = await request(app).get('/api/v1/reports/bbbee').set(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.smallholderPct).toBe('0.00');
  });

  it('computes smallholder pct correctly', async () => {
    vi.mocked(prisma.payout.aggregate)
      .mockResolvedValueOnce({ _sum: { grossAmount: 25000 }, _count: { id: 3 } } as any)
      .mockResolvedValueOnce({ _sum: { grossAmount: 100000 } } as any);
    const res = await request(app).get('/api/v1/reports/bbbee').set(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.smallholderPct).toBe('25.00');
  });
});
