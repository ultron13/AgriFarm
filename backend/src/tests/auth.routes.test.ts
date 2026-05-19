import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { authHeader } from './helpers';

vi.mock('../lib/r2', () => ({
  deleteFile: vi.fn().mockResolvedValue(undefined),
  uploadFile: vi.fn().mockResolvedValue('http://r2/mock'),
  getSignedReadUrl: vi.fn().mockResolvedValue('http://r2/signed'),
}));

const app = createApp();

const mockPrismaUser = vi.mocked(prisma.user);

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 for unknown email', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'x@x.com', password: 'pass' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for wrong password', async () => {
    const hash = await bcrypt.hash('correct-password', 4);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'u1', email: 'a@b.com', passwordHash: hash, isActive: true, role: 'FARMER',
    } as any);
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'a@b.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns token for valid credentials', async () => {
    const hash = await bcrypt.hash('secret123', 4);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'u1', email: 'a@b.com', passwordHash: hash, isActive: true, role: 'FARMER',
    } as any);
    mockPrismaUser.update.mockResolvedValue({} as any);
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'a@b.com', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.role).toBe('FARMER');
  });

  it('returns 422 for missing email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ password: 'pass' });
    expect(res.status).toBe(422);
  });
});

describe('DELETE /api/v1/auth/me (POPIA erasure)', () => {
  beforeEach(() => vi.clearAllMocks());

  const farmerToken = authHeader('farmer-u1', 'FARMER');
  const buyerToken = authHeader('buyer-u1', 'BUYER');

  it('requires authentication', async () => {
    const res = await request(app).delete('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('anonymises FARMER account and deletes compliance docs', async () => {
    vi.mocked(prisma.farmer).findUnique.mockResolvedValue({ id: 'f1' } as any);
    vi.mocked(prisma.complianceDoc).findMany.mockResolvedValue([
      { fileKey: 'compliance/f1/bbbee.pdf' },
    ] as any);
    vi.mocked(prisma.user).update.mockResolvedValue({} as any);
    vi.mocked(prisma.complianceDoc).deleteMany.mockResolvedValue({ count: 1 } as any);
    vi.mocked(prisma.farmer).update.mockResolvedValue({} as any);

    const res = await request(app).delete('/api/v1/auth/me').set(farmerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.erased).toBe(true);

    expect(vi.mocked(prisma.user).update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: expect.stringContaining('@deleted.farmconnect.co.za'),
          passwordHash: '[ERASED]',
          isActive: false,
        }),
      })
    );
    expect(vi.mocked(prisma.complianceDoc).deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { farmerId: 'f1' } })
    );
  });

  it('anonymises BUYER account', async () => {
    vi.mocked(prisma.farmer).findUnique.mockResolvedValue(null);
    vi.mocked(prisma.complianceDoc).findMany.mockResolvedValue([]);
    vi.mocked(prisma.user).update.mockResolvedValue({} as any);
    vi.mocked(prisma.buyer).updateMany.mockResolvedValue({ count: 1 } as any);

    const res = await request(app).delete('/api/v1/auth/me').set(buyerToken);
    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.buyer).updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ displayName: '[Deleted Buyer]' }),
      })
    );
  });
});

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 409 when email already exists', async () => {
    mockPrismaUser.findFirst.mockResolvedValue({ id: 'u1' } as any);
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'a@b.com', password: 'password123', role: 'FARMER', displayName: 'Alice',
    });
    expect(res.status).toBe(409);
  });

  it('creates user and returns token', async () => {
    mockPrismaUser.findFirst.mockResolvedValue(null);
    mockPrismaUser.create.mockResolvedValue({ id: 'u-new', role: 'FARMER' } as any);
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'new@b.com', password: 'password123', role: 'FARMER', displayName: 'New User',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeTruthy();
  });

  it('rejects invalid role', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'x@b.com', password: 'password123', role: 'ADMIN', displayName: 'Bob',
    });
    expect(res.status).toBe(422);
  });
});
