import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ok } from '../types';

export const productsRouter = Router();

productsRouter.get('/', async (_req, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      include: { grades: { orderBy: { grade: 'asc' } } },
      orderBy: { name: 'asc' },
    });
    res.json(ok(products));
  } catch (e) {
    next(e);
  }
});
