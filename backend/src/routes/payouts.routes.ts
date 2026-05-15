import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { prisma } from '../lib/prisma';
import { payoutsQueue } from '../jobs/queues';
import { ok, err, paginate, AuthenticatedRequest } from '../types';

export const payoutsRouter = Router();

payoutsRouter.get('/', authenticate, requireRole(['FARMER', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, perPage } = paginate(req.query);
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    let farmerId: string | undefined;
    if (!isAdmin) {
      const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
      farmerId = farmer?.id;
      if (!farmerId) {
        res.json(ok([], { page, perPage, total: 0 }));
        return;
      }
    }

    const where = { ...(farmerId && { farmerId }), ...(req.query.status && { status: req.query.status as never }) };
    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where, skip, take,
        orderBy: { scheduledFor: 'desc' },
        include: {
          order: { select: { orderNumber: true, buyer: { select: { displayName: true } } } },
        },
      }),
      prisma.payout.count({ where }),
    ]);
    res.json(ok(payouts, { page, perPage, total }));
  } catch (e) { next(e); }
});

payoutsRouter.post('/:id/retry', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res: Response, next: NextFunction) => {
  try {
    const payout = await prisma.payout.findUnique({ where: { id: req.params.id } });
    if (!payout) { res.status(404).json(err('NOT_FOUND', 'Payout not found')); return; }
    if (payout.status !== 'FAILED') { res.status(400).json(err('INVALID_STATE', 'Only failed payouts can be retried')); return; }

    await prisma.payout.update({ where: { id: payout.id }, data: { status: 'PENDING' } });
    await payoutsQueue.add('retry_payout', { payoutId: payout.id });

    res.json(ok({ message: 'Payout retry queued' }));
  } catch (e) { next(e); }
});
