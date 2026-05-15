import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { authHeader } from './helpers';

vi.mock('../lib/r2', () => ({
  uploadFile: vi.fn().mockResolvedValue('http://r2/compliance/f1/bbbee.pdf'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  getSignedReadUrl: vi.fn().mockResolvedValue('http://r2/signed/doc'),
}));

const app = createApp();
const mockCompliance = vi.mocked(prisma.complianceDoc);
const mockFarmer = vi.mocked(prisma.farmer);

const farmerToken = authHeader('farmer-user', 'FARMER');
const adminToken = authHeader('admin-user', 'ADMIN');
const fieldAgentToken = authHeader('agent-user', 'FIELD_AGENT');
const buyerToken = authHeader('buyer-user', 'BUYER');

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/compliance', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/compliance');
    expect(res.status).toBe(401);
  });

  it('returns 403 for BUYER role', async () => {
    const res = await request(app).get('/api/v1/compliance').set(buyerToken);
    expect(res.status).toBe(403);
  });

  it('returns own docs for FARMER', async () => {
    mockFarmer.findUnique.mockResolvedValue({ id: 'f1' } as any);
    mockCompliance.findMany.mockResolvedValue([]);
    mockCompliance.updateMany.mockResolvedValue({ count: 0 } as any);
    const res = await request(app).get('/api/v1/compliance').set(farmerToken);
    expect(res.status).toBe(200);
    expect(mockCompliance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { farmerId: 'f1' } })
    );
  });

  it('allows ADMIN to filter by farmerId', async () => {
    mockCompliance.findMany.mockResolvedValue([]);
    mockCompliance.updateMany.mockResolvedValue({ count: 0 } as any);
    const res = await request(app).get('/api/v1/compliance?farmerId=f2').set(adminToken);
    expect(res.status).toBe(200);
    expect(mockCompliance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { farmerId: 'f2' } })
    );
  });

  it('allows FIELD_AGENT to list all docs', async () => {
    mockCompliance.findMany.mockResolvedValue([]);
    mockCompliance.updateMany.mockResolvedValue({ count: 0 } as any);
    const res = await request(app).get('/api/v1/compliance').set(fieldAgentToken);
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/v1/compliance/:id/verify', () => {
  it('requires ADMIN or FIELD_AGENT role', async () => {
    const res = await request(app).patch('/api/v1/compliance/doc-1/verify').set(farmerToken).send({});
    expect(res.status).toBe(403);
  });

  it('verifies doc as ADMIN', async () => {
    mockCompliance.update.mockResolvedValue({ id: 'doc-1', status: 'VERIFIED' } as any);
    const res = await request(app).patch('/api/v1/compliance/doc-1/verify').set(adminToken).send({});
    expect(res.status).toBe(200);
    expect(mockCompliance.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'VERIFIED' }) })
    );
  });

  it('verifies doc with expiry date as FIELD_AGENT', async () => {
    const expiresAt = new Date(Date.now() + 86400000 * 365).toISOString();
    mockCompliance.update.mockResolvedValue({ id: 'doc-1', status: 'VERIFIED', expiresAt } as any);
    const res = await request(app)
      .patch('/api/v1/compliance/doc-1/verify')
      .set(fieldAgentToken)
      .send({ expiresAt });
    expect(res.status).toBe(200);
    expect(mockCompliance.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ expiresAt: new Date(expiresAt) }) })
    );
  });
});

describe('PATCH /api/v1/compliance/:id/reject', () => {
  it('requires ADMIN or FIELD_AGENT role', async () => {
    const res = await request(app)
      .patch('/api/v1/compliance/doc-1/reject')
      .set(farmerToken)
      .send({ rejectionNote: 'Document is expired and unreadable' });
    expect(res.status).toBe(403);
  });

  it('returns 422 if rejectionNote is too short', async () => {
    const res = await request(app)
      .patch('/api/v1/compliance/doc-1/reject')
      .set(adminToken)
      .send({ rejectionNote: 'bad' });
    expect(res.status).toBe(422);
  });

  it('rejects doc with reason', async () => {
    mockCompliance.update.mockResolvedValue({ id: 'doc-1', status: 'REJECTED' } as any);
    const res = await request(app)
      .patch('/api/v1/compliance/doc-1/reject')
      .set(adminToken)
      .send({ rejectionNote: 'Document is expired and illegible' });
    expect(res.status).toBe(200);
    expect(mockCompliance.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED' }) })
    );
  });
});

describe('DELETE /api/v1/compliance/:id', () => {
  it('requires FARMER role', async () => {
    const res = await request(app).delete('/api/v1/compliance/doc-1').set(adminToken);
    expect(res.status).toBe(403);
  });

  it('returns 404 if doc not owned by farmer', async () => {
    mockFarmer.findUnique.mockResolvedValue({ id: 'f1' } as any);
    mockCompliance.findUnique.mockResolvedValue({ id: 'doc-1', farmerId: 'other-farmer', fileKey: 'key' } as any);
    const res = await request(app).delete('/api/v1/compliance/doc-1').set(farmerToken);
    expect(res.status).toBe(404);
  });

  it('deletes own doc', async () => {
    mockFarmer.findUnique.mockResolvedValue({ id: 'f1' } as any);
    mockCompliance.findUnique.mockResolvedValue({ id: 'doc-1', farmerId: 'f1', fileKey: 'compliance/f1/bbbee.pdf' } as any);
    mockCompliance.delete.mockResolvedValue({} as any);
    const res = await request(app).delete('/api/v1/compliance/doc-1').set(farmerToken);
    expect(res.status).toBe(200);
    expect(mockCompliance.delete).toHaveBeenCalledWith({ where: { id: 'doc-1' } });
  });
});
