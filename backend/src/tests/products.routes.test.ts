import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/products', () => {
  it('returns empty list when no products', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns all products', async () => {
    const products = [{ id: 'p1', name: 'Tomatoes', category: 'VEGETABLES' }];
    vi.mocked(prisma.product.findMany).mockResolvedValue(products as any);
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Tomatoes');
  });
});
