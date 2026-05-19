import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validateBody } from '../middleware/validate';
import { errorHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { ZodError, z } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};
const mockNext = () => vi.fn() as unknown as NextFunction;

describe('authenticate middleware', () => {
  it('rejects missing Authorization header', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    authenticate(req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects invalid token', () => {
    const req = { headers: { authorization: 'Bearer badtoken' } } as Request;
    const res = mockRes();
    authenticate(req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('attaches user and calls next with valid token', async () => {
    const token = jwt.sign({ sub: 'user-1', role: 'FARMER' }, 'test-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = mockNext();
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as AuthenticatedRequest).user.sub).toBe('user-1');
    expect((req as AuthenticatedRequest).user.role).toBe('FARMER');
  });
});

describe('requireRole middleware', () => {
  it('allows matching role', () => {
    const req = { user: { sub: 'u1', role: 'FARMER' } } as AuthenticatedRequest;
    const res = mockRes();
    const next = mockNext();
    requireRole(['FARMER'])(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks mismatched role', () => {
    const req = { user: { sub: 'u1', role: 'BUYER' } } as AuthenticatedRequest;
    const res = mockRes();
    requireRole(['FARMER'])(req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('validateBody middleware', () => {
  const schema = z.object({ name: z.string().min(1) });

  it('passes valid body and calls next', () => {
    const req = { body: { name: 'Alice' } } as Request;
    const res = mockRes();
    const next = mockNext();
    validateBody(schema)(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'Alice' });
  });

  it('throws ZodError for invalid body', () => {
    const req = { body: { name: '' } } as Request;
    expect(() => validateBody(schema)(req, mockRes(), mockNext())).toThrow(ZodError);
  });
});

describe('errorHandler middleware', () => {
  it('returns 422 for ZodError', () => {
    const schema = z.object({ x: z.string() });
    let zodErr: ZodError | null = null;
    try { schema.parse({ x: 123 }); } catch (e) { zodErr = e as ZodError; }

    const req = { path: '/', method: 'POST' } as Request;
    const res = mockRes();
    errorHandler(zodErr, req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('returns 404 for Prisma P2025 (record not found)', () => {
    const prismaErr = new PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: '5.0.0' });
    const req = { path: '/', method: 'GET' } as Request;
    const res = mockRes();
    errorHandler(prismaErr, req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 409 for Prisma P2002 (unique constraint)', () => {
    const prismaErr = new PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '5.0.0' });
    const req = { path: '/', method: 'POST' } as Request;
    const res = mockRes();
    errorHandler(prismaErr, req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns custom statusCode for errors with statusCode property', () => {
    const customErr = Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    const req = { path: '/', method: 'GET' } as Request;
    const res = mockRes();
    errorHandler(customErr, req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 500 for unknown errors', () => {
    const req = { path: '/', method: 'GET' } as Request;
    const res = mockRes();
    errorHandler(new Error('boom'), req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
