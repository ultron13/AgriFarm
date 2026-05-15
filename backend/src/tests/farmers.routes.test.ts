import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { authHeader } from './helpers';

const app = createApp();
const adminToken = authHeader('admin-user', 'ADMIN');
const salesToken = authHeader('sales-user', 'SALES_REP');
const farmerToken = authHeader('farmer-user', 'FARMER');
const buyerToken = authHeader('buyer-user', 'BUYER');

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/farmers', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/farmers');
    expect(res.status).toBe(401);
  });

  it('requires ADMIN or SALES_REP role', async () => {
    const res = await request(app).get('/api/v1/farmers').set(buyerToken);
    expect(res.status).toBe(403);
  });

  it('returns farmer list for ADMIN', async () => {
    vi.mocked(prisma.farmer.findMany).mockResolvedValue([{ id: 'f1', displayName: 'Jan Botha' }] as any);
    vi.mocked(prisma.farmer.count).mockResolvedValue(1 as any);
    const res = await request(app).get('/api/v1/farmers').set(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('supports province filter', async () => {
    vi.mocked(prisma.farmer.findMany).mockResolvedValue([]);
    vi.mocked(prisma.farmer.count).mockResolvedValue(0 as any);
    const res = await request(app).get('/api/v1/farmers?province=LIMPOPO').set(adminToken);
    expect(res.status).toBe(200);
    expect(prisma.farmer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ province: 'LIMPOPO' }) })
    );
  });
});

describe('GET /api/v1/farmers/me/listings', () => {
  it('requires FARMER role', async () => {
    const res = await request(app).get('/api/v1/farmers/me/listings').set(adminToken);
    expect(res.status).toBe(403);
  });

  it('returns 404 when farmer profile not found', async () => {
    vi.mocked(prisma.farmer.findUnique).mockResolvedValue(null);
    const res = await request(app).get('/api/v1/farmers/me/listings').set(farmerToken);
    expect(res.status).toBe(404);
  });

  it('returns own listings for FARMER', async () => {
    vi.mocked(prisma.farmer.findUnique).mockResolvedValue({ id: 'f1' } as any);
    vi.mocked(prisma.produceListing.findMany).mockResolvedValue([{ id: 'l1' }] as any);
    vi.mocked(prisma.produceListing.count).mockResolvedValue(1);
    const res = await request(app).get('/api/v1/farmers/me/listings').set(farmerToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/farmers/:id', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/farmers/f1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when farmer not found', async () => {
    vi.mocked(prisma.farmer.findUnique).mockResolvedValue(null);
    const res = await request(app).get('/api/v1/farmers/f1').set(adminToken);
    expect(res.status).toBe(404);
  });

  it('returns farmer profile', async () => {
    vi.mocked(prisma.farmer.findUnique).mockResolvedValue({ id: 'f1', displayName: 'Jan Botha' } as any);
    const res = await request(app).get('/api/v1/farmers/f1').set(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('f1');
  });
});

describe('POST /api/v1/farmers/onboard', () => {
  const validBody = {
    email: 'jan@botha.co.za',
    password: 'password123',
    displayName: 'Jan Botha',
    province: 'LIMPOPO',
    district: 'Capricorn',
  };

  it('requires SALES_REP or ADMIN role', async () => {
    const res = await request(app).post('/api/v1/farmers/onboard').set(buyerToken).send(validBody);
    expect(res.status).toBe(403);
  });

  it('creates farmer profile for SALES_REP', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'user-new', email: validBody.email } as any);
    vi.mocked(prisma.farmer.create).mockResolvedValue({ id: 'f-new', displayName: validBody.displayName } as any);
    const res = await request(app).post('/api/v1/farmers/onboard').set(salesToken).send(validBody);
    expect(res.status).toBe(201);
  });
});

describe('POST /api/v1/farmers', () => {
  const validBody = {
    displayName: 'Jan Botha',
    province: 'LIMPOPO',
    district: 'Capricorn',
  };

  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/farmers').send(validBody);
    expect(res.status).toBe(401);
  });

  it('creates farmer profile for FARMER role', async () => {
    vi.mocked(prisma.farmer.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.farmer.create).mockResolvedValue({ id: 'f-new', ...validBody } as any);
    const res = await request(app).post('/api/v1/farmers').set(farmerToken).send(validBody);
    expect(res.status).toBe(201);
  });
});
