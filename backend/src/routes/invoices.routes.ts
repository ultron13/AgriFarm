import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { prisma } from '../lib/prisma';
import { ok, err } from '../types';

export const invoicesRouter = Router();

invoicesRouter.get('/:orderId', authenticate, async (req, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { orderId: req.params.orderId } });
    if (!invoice) { res.status(404).json(err('NOT_FOUND', 'Invoice not found')); return; }
    res.json(ok(invoice));
  } catch (e) { next(e); }
});
