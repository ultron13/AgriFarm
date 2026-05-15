import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { authHeader } from './helpers';

vi.mock('../lib/r2', () => ({
  buildKey: vi.fn(() => 'listings/l1/uuid.jpg'),
  getUploadUrl: vi.fn().mockResolvedValue('http://mock-upload-url'),
  publicUrl: vi.fn((k: string) => `http://r2/${k}`),
}));

vi.mock('file-type', () => ({
  fromBuffer: vi.fn().mockResolvedValue({ mime: 'image/jpeg', ext: 'jpg' }),
}));

const app = createApp();
const mockListing = vi.mocked(prisma.produceListing);
const mockFarmer = vi.mocked(prisma.farmer);

const farmerToken = authHeader('farmer-user', 'FARMER');
const buyerToken = authHeader('buyer-user', 'BUYER');
const adminToken = authHeader('admin-user', 'ADMIN');

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/listings', () => {
  it('returns listings without authentication', async () => {
    mockListing.findMany.mockResolvedValue([]);
    mockListing.count.mockResolvedValue(0);
    const res = await request(app).get('/api/v1/listings');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('passes productId filter to Prisma', async () => {
    mockListing.findMany.mockResolvedValue([]);
    mockListing.count.mockResolvedValue(0);
    await request(app).get('/api/v1/listings?productId=p1');
    expect(mockListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ productId: 'p1' }) })
    );
  });
});

describe('POST /api/v1/listings', () => {
  const validListing = {
    productId: 'prod-1',
    farmGatePrice: 15.5,
    availableKg: 500,
    minimumOrderKg: 50,
    availableFrom: new Date(Date.now() + 1000).toISOString(),
    availableUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
  };

  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/listings').send(validListing);
    expect(res.status).toBe(401);
  });

  it('requires FARMER or ADMIN role', async () => {
    const res = await request(app).post('/api/v1/listings').set(buyerToken).send(validListing);
    expect(res.status).toBe(403);
  });

  it('returns 404 if farmer profile does not exist', async () => {
    mockFarmer.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/api/v1/listings').set(farmerToken).send(validListing);
    expect(res.status).toBe(404);
  });

  it('creates listing for FARMER', async () => {
    mockFarmer.findUnique.mockResolvedValue({ id: 'f1' } as any);
    mockListing.create.mockResolvedValue({ id: 'l1', ...validListing, farmerId: 'f1' } as any);
    const res = await request(app).post('/api/v1/listings').set(farmerToken).send(validListing);
    expect(res.status).toBe(201);
    expect(mockListing.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ farmerId: 'f1' }) })
    );
  });

  it('returns 404 when farmer profile is missing', async () => {
    mockFarmer.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/api/v1/listings').set(farmerToken).send(validListing);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/listings/:id', () => {
  it('requires authentication', async () => {
    const res = await request(app).patch('/api/v1/listings/l1').send({ farmGatePrice: 20 });
    expect(res.status).toBe(401);
  });

  it('returns 404 if listing not found', async () => {
    mockListing.findUnique.mockResolvedValue(null);
    const res = await request(app).patch('/api/v1/listings/l1').set(farmerToken).send({ farmGatePrice: 20 });
    expect(res.status).toBe(404);
  });

  it('returns 403 if FARMER does not own the listing', async () => {
    mockListing.findUnique.mockResolvedValue({ id: 'l1', farmerId: 'other-farmer', deletedAt: null } as any);
    mockFarmer.findUnique.mockResolvedValue({ id: 'f1' } as any);
    const res = await request(app).patch('/api/v1/listings/l1').set(farmerToken).send({ farmGatePrice: 20 });
    expect(res.status).toBe(403);
  });

  it('allows owner FARMER to update', async () => {
    mockListing.findUnique.mockResolvedValue({ id: 'l1', farmerId: 'f1', deletedAt: null } as any);
    mockFarmer.findUnique.mockResolvedValue({ id: 'f1' } as any);
    mockListing.update.mockResolvedValue({ id: 'l1', farmGatePrice: 20 } as any);
    const res = await request(app).patch('/api/v1/listings/l1').set(farmerToken).send({ farmGatePrice: 20 });
    expect(res.status).toBe(200);
  });

  it('allows ADMIN to update any listing', async () => {
    mockListing.findUnique.mockResolvedValue({ id: 'l1', farmerId: 'other-farmer', deletedAt: null } as any);
    mockFarmer.findUnique.mockResolvedValue(null);
    mockListing.update.mockResolvedValue({ id: 'l1' } as any);
    const res = await request(app).patch('/api/v1/listings/l1').set(adminToken).send({ farmGatePrice: 20 });
    expect(res.status).toBe(200);
  });

  it('rejects unknown fields (.strict schema)', async () => {
    const res = await request(app)
      .patch('/api/v1/listings/l1')
      .set(farmerToken)
      .send({ farmGatePrice: 20, farmerId: 'injected' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/listings/:id/photos', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/listings/l1/photos');
    expect(res.status).toBe(401);
  });

  it('returns 400 when no file is uploaded', async () => {
    const res = await request(app)
      .post('/api/v1/listings/l1/photos')
      .set(farmerToken)
      .field('description', 'no-photo');
    expect(res.status).toBe(400);
  });

  it('returns 400 when file type is not an image', async () => {
    const { fromBuffer } = await import('file-type');
    vi.mocked(fromBuffer).mockResolvedValueOnce({ mime: 'application/pdf', ext: 'pdf' } as any);
    const res = await request(app)
      .post('/api/v1/listings/l1/photos')
      .set(farmerToken)
      .attach('photo', Buffer.from('fake pdf'), { filename: 'doc.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when listing not found', async () => {
    mockListing.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/v1/listings/l1/photos')
      .set(farmerToken)
      .attach('photo', Buffer.from('fake jpeg'), { filename: 'photo.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(404);
  });

  it('returns 403 when farmer does not own the listing', async () => {
    mockListing.findUnique.mockResolvedValue({ id: 'l1', farmerId: 'other-farmer', deletedAt: null } as any);
    mockFarmer.findUnique.mockResolvedValue({ id: 'f1' } as any);
    const res = await request(app)
      .post('/api/v1/listings/l1/photos')
      .set(farmerToken)
      .attach('photo', Buffer.from('fake jpeg'), { filename: 'photo.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(403);
  });

  it('uploads photo for listing owner', async () => {
    mockListing.findUnique.mockResolvedValue({ id: 'l1', farmerId: 'f1', deletedAt: null } as any);
    mockFarmer.findUnique.mockResolvedValue({ id: 'f1' } as any);
    vi.mocked(prisma.listingPhoto.count).mockResolvedValue(0 as any);
    vi.mocked(prisma.listingPhoto.create).mockResolvedValue({ id: 'ph1', url: 'data:image/jpeg;base64,...' } as any);
    const res = await request(app)
      .post('/api/v1/listings/l1/photos')
      .set(farmerToken)
      .attach('photo', Buffer.from('fake jpeg'), { filename: 'photo.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(201);
  });
});

describe('DELETE /api/v1/listings/:id/photos/:photoId', () => {
  it('requires authentication', async () => {
    const res = await request(app).delete('/api/v1/listings/l1/photos/ph1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when photo not found', async () => {
    vi.mocked(prisma.listingPhoto.findUnique).mockResolvedValue(null);
    const res = await request(app).delete('/api/v1/listings/l1/photos/ph1').set(farmerToken);
    expect(res.status).toBe(404);
  });

  it('returns 404 when photo belongs to different listing', async () => {
    vi.mocked(prisma.listingPhoto.findUnique).mockResolvedValue({ id: 'ph1', listingId: 'other-listing' } as any);
    const res = await request(app).delete('/api/v1/listings/l1/photos/ph1').set(farmerToken);
    expect(res.status).toBe(404);
  });

  it('deletes photo successfully', async () => {
    vi.mocked(prisma.listingPhoto.findUnique).mockResolvedValue({ id: 'ph1', listingId: 'l1' } as any);
    vi.mocked(prisma.listingPhoto.delete).mockResolvedValue({} as any);
    const res = await request(app).delete('/api/v1/listings/l1/photos/ph1').set(farmerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });
});
