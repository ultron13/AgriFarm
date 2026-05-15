import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { authHeader } from './helpers';

const app = createApp();
const buyerToken = authHeader('buyer-user', 'BUYER');
const farmerToken = authHeader('farmer-user', 'FARMER');
const adminToken = authHeader('admin-user', 'ADMIN');

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/invoices/:orderId', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/invoices/order-1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when invoice not found', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null);
    const res = await request(app).get('/api/v1/invoices/order-1').set(adminToken);
    expect(res.status).toBe(404);
  });

  it('returns invoice for ADMIN', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({ id: 'inv-1', orderId: 'order-1' } as any);
    const res = await request(app).get('/api/v1/invoices/order-1').set(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('inv-1');
  });

  it('returns 403 for BUYER accessing another buyer invoice', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({ id: 'inv-1', orderId: 'order-1' } as any);
    vi.mocked(prisma.buyer.findUnique).mockResolvedValue({ id: 'b1' } as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ buyerId: 'b2' } as any);
    const res = await request(app).get('/api/v1/invoices/order-1').set(buyerToken);
    expect(res.status).toBe(403);
  });

  it('returns invoice for owning BUYER', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({ id: 'inv-1', orderId: 'order-1' } as any);
    vi.mocked(prisma.buyer.findUnique).mockResolvedValue({ id: 'b1' } as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ buyerId: 'b1' } as any);
    const res = await request(app).get('/api/v1/invoices/order-1').set(buyerToken);
    expect(res.status).toBe(200);
  });

  it('returns 403 for FARMER with no link to the order', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({ id: 'inv-1', orderId: 'order-1' } as any);
    vi.mocked(prisma.farmer.findUnique).mockResolvedValue({ id: 'f1' } as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ items: [{ listing: { farmerId: 'f2' } }] } as any);
    const res = await request(app).get('/api/v1/invoices/order-1').set(farmerToken);
    expect(res.status).toBe(403);
  });

  it('returns invoice for owning FARMER', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({ id: 'inv-1', orderId: 'order-1' } as any);
    vi.mocked(prisma.farmer.findUnique).mockResolvedValue({ id: 'f1' } as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ items: [{ listing: { farmerId: 'f1' } }] } as any);
    const res = await request(app).get('/api/v1/invoices/order-1').set(farmerToken);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/invoices/:orderId/pdf', () => {
  it('returns 404 when invoice not found', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null);
    const res = await request(app).get('/api/v1/invoices/order-1/pdf').set(adminToken);
    expect(res.status).toBe(404);
  });

  it('returns 202 when pdf not yet generated', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({ invoiceNumber: 'INV-001', pdfUrl: null, status: 'PENDING' } as any);
    const res = await request(app).get('/api/v1/invoices/order-1/pdf').set(adminToken);
    expect(res.status).toBe(202);
  });

  it('streams PDF when pdfUrl is a data URL', async () => {
    const fakeBase64 = Buffer.from('PDF-CONTENT').toString('base64');
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
      invoiceNumber: 'INV-001',
      pdfUrl: `data:application/pdf;base64,${fakeBase64}`,
      status: 'ISSUED',
    } as any);
    const res = await request(app).get('/api/v1/invoices/order-1/pdf').set(adminToken);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('returns 403 for BUYER accessing another buyer pdf', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({ invoiceNumber: 'INV-001', pdfUrl: 'http://r2/file.pdf', status: 'ISSUED' } as any);
    vi.mocked(prisma.buyer.findUnique).mockResolvedValue({ id: 'b1' } as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ buyerId: 'b2' } as any);
    const res = await request(app).get('/api/v1/invoices/order-1/pdf').set(buyerToken);
    expect(res.status).toBe(403);
  });
});
