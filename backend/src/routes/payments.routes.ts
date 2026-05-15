import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validateBody } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { createPaymentUrl, verifyWebhookSignature as verifyOzow } from '../lib/ozow';
import { ok, err, AuthenticatedRequest } from '../types';

export const paymentsRouter = Router();

const initiateSchema = z.object({
  orderId: z.string().min(1),
  method: z.enum(['INSTANT_EFT', 'ACCOUNT_TO_ACCOUNT']),
});

paymentsRouter.post(
  '/initiate',
  authenticate,
  requireRole(['BUYER', 'ADMIN', 'SUPER_ADMIN']),
  validateBody(initiateSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId, method } = req.body as z.infer<typeof initiateSchema>;

      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

      const payment = await prisma.payment.upsert({
        where: { orderId },
        update: {},
        create: {
          orderId,
          amount: order.deliveredPrice,
          method,
          dueDate: order.paymentDueDate ?? new Date(),
        },
      });

      if (method === 'INSTANT_EFT') {
        const BASE = process.env.FRONTEND_URL ?? 'http://localhost:5173';
        const { url } = await createPaymentUrl({
          orderId,
          amount: Number(order.deliveredPrice),
          successUrl: `${BASE}/orders/${orderId}?payment=success`,
          cancelUrl: `${BASE}/orders/${orderId}?payment=cancelled`,
          errorUrl: `${BASE}/orders/${orderId}?payment=error`,
          notifyUrl: `${process.env.API_URL ?? 'http://localhost:3000'}/api/v1/webhooks/ozow`,
        });
        res.json(ok({ paymentId: payment.id, redirectUrl: url }));
      } else {
        res.json(ok({ paymentId: payment.id, instructions: 'Payment will be collected on due date via Stitch debit' }));
      }
    } catch (e) {
      next(e);
    }
  }
);

paymentsRouter.get('/:orderId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { orderId: req.params.orderId } });
    if (!payment) { res.status(404).json(err('NOT_FOUND', 'Payment not found')); return; }

    const { role } = req.user;
    if (role === 'BUYER') {
      const buyer = await prisma.buyer.findUnique({ where: { userId: req.user.sub } });
      const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, select: { buyerId: true } });
      if (!buyer || order?.buyerId !== buyer.id) { res.status(403).json(err('FORBIDDEN', 'Access denied')); return; }
    } else if (role === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
      const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, include: { items: { select: { listing: { select: { farmerId: true } } } } } });
      if (!farmer || !order?.items.some(i => i.listing.farmerId === farmer.id)) { res.status(403).json(err('FORBIDDEN', 'Access denied')); return; }
    }

    res.json(ok(payment));
  } catch (e) {
    next(e);
  }
});

