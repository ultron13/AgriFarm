import { UserRole } from '@prisma/client';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export type AuthenticatedRequest = Request;

export interface ApiResponse<T> {
  data: T | null;
  meta?: PaginationMeta;
  error: ApiError | null;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationQuery {
  page?: string;
  perPage?: string;
}

export function paginate(query: PaginationQuery): { skip: number; take: number; page: number; perPage: number } {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(query.perPage ?? '20', 10) || 20));
  return { skip: (page - 1) * perPage, take: perPage, page, perPage };
}

export function ok<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  return { data, meta: meta ?? undefined, error: null };
}

export function err(code: string, message: string, details?: unknown): ApiResponse<null> {
  return { data: null, error: { code, message, details } };
}
