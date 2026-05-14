import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from '../lib/logger';
import { err } from '../types';

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(422).json(err('VALIDATION_ERROR', 'Invalid request data', error.flatten()));
    return;
  }

  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      res.status(404).json(err('NOT_FOUND', 'Record not found'));
      return;
    }
    if (error.code === 'P2002') {
      res.status(409).json(err('CONFLICT', 'Already exists'));
      return;
    }
  }

  if (error instanceof Error && 'statusCode' in error) {
    const e = error as Error & { statusCode: number; code?: string };
    res.status(e.statusCode).json(err(e.code ?? 'ERROR', e.message));
    return;
  }

  logger.error({ err: error, path: req.path, method: req.method }, 'Unhandled error');
  res.status(500).json(err('INTERNAL_ERROR', 'An unexpected error occurred'));
}
