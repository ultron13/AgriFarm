import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validateBody } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { ok, err, AuthenticatedRequest } from '../types';

export const qualityRouter = Router();

const createCheckSchema = z.object({
  orderId: z.string().min(1),
  farmerId: z.string().min(1),
  gradeAwarded: z.enum(['A', 'B', 'C', 'REJECTED']),
  quantityKg: z.number().positive(),
  rejectedKg: z.number().min(0).default(0),
  notes: z.string().optional(),
  // Keys must be safe path segments: no traversal sequences, no leading slash,
  // only alphanumeric/hyphen/underscore/slash chars, must end with an extension.
  photos: z.array(
    z.string()
      .max(200)
      .regex(/^(?!.*\.\.)[a-zA-Z0-9_\-][a-zA-Z0-9_\-/]*\.[a-zA-Z0-9]{2,5}$/, 'Invalid R2 key')
  ).min(3, 'Minimum 3 photos required'),
});

qualityRouter.get(
  '/pending',
  authenticate,
  requireRole(['FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN']),
  async (_req, res: Response, next: NextFunction) => {
    try {
      const orders = await prisma.order.findMany({
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
        include: {
          buyer: { select: { displayName: true } },
          items: {
            include: {
              listing: {
                include: {
                  product: true,
                  farmer: { select: { id: true, displayName: true, province: true } },
                },
              },
            },
          },
          qualityChecks: { select: { id: true } },
        },
        orderBy: { deliveryDate: 'asc' },
        take: 30,
      });
      res.json(ok(orders));
    } catch (e) {
      next(e);
    }
  }
);

qualityRouter.post(
  '/',
  authenticate,
  requireRole(['FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN']),
  validateBody(createCheckSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof createCheckSchema>;

      const check = await prisma.$transaction(async (tx) => {
        const qc = await tx.qualityCheck.create({
          data: {
            orderId: body.orderId,
            farmerId: body.farmerId,
            fieldAgentId: req.user.sub,
            gradeAwarded: body.gradeAwarded,
            quantityKg: body.quantityKg,
            rejectedKg: body.rejectedKg,
            notes: body.notes,
            performedAt: new Date(),
            photos: { create: body.photos.map((r2Key) => ({ r2Key, url: `${process.env.R2_PUBLIC_URL}/${r2Key}` })) },
          },
          include: { photos: true },
        });

        await tx.order.update({ where: { id: body.orderId }, data: { status: 'QUALITY_CHECKED' } });

        return qc;
      });

      res.status(201).json(ok(check));
    } catch (e) {
      next(e);
    }
  }
);

qualityRouter.get('/:orderId', authenticate, async (req, res: Response, next: NextFunction) => {
  try {
    const check = await prisma.qualityCheck.findFirst({
      where: { orderId: req.params.orderId },
      include: { photos: true, fieldAgent: { select: { email: true } } },
    });
    if (!check) { res.status(404).json(err('NOT_FOUND', 'Quality check not found')); return; }
    res.json(ok(check));
  } catch (e) {
    next(e);
  }
});
