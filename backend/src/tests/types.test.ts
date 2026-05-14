import { describe, it, expect } from 'vitest';
import { ok, err, paginate } from '../types';

describe('ok()', () => {
  it('wraps data with null error', () => {
    const result = ok({ id: 1 });
    expect(result.data).toEqual({ id: 1 });
    expect(result.error).toBeNull();
  });

  it('includes meta when provided', () => {
    const meta = { page: 1, perPage: 20, total: 100 };
    const result = ok([], meta);
    expect(result.meta).toEqual(meta);
  });
});

describe('err()', () => {
  it('wraps error with null data', () => {
    const result = err('NOT_FOUND', 'Item not found');
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('NOT_FOUND');
    expect(result.error?.message).toBe('Item not found');
  });
});

describe('paginate()', () => {
  it('defaults to page=1 perPage=20', () => {
    const p = paginate({});
    expect(p.page).toBe(1);
    expect(p.perPage).toBe(20);
    expect(p.skip).toBe(0);
    expect(p.take).toBe(20);
  });

  it('computes correct skip for page 3', () => {
    const p = paginate({ page: '3', perPage: '10' });
    expect(p.skip).toBe(20);
    expect(p.take).toBe(10);
  });

  it('clamps perPage to 100 max', () => {
    const p = paginate({ perPage: '999' });
    expect(p.perPage).toBe(100);
  });

  it('clamps page to 1 min', () => {
    const p = paginate({ page: '-5' });
    expect(p.page).toBe(1);
  });
});
