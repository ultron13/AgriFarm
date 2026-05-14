import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { prisma } from '../lib/prisma';
import { ok, err } from '../types';

export const logisticsRouter = Router();

logisticsRouter.get('/routes', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN', 'LOGISTICS_COORDINATOR', 'FIELD_AGENT']), async (_req, res: Response, next: NextFunction) => {
  try {
    const routes = await prisma.logisticsRoute.findMany({ where: { isActive: true }, include: { _count: { select: { deliveries: true } } } });
    res.json(ok(routes));
  } catch (e) { next(e); }
});

logisticsRouter.get('/routes/:id/deliveries', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN', 'LOGISTICS_COORDINATOR']), async (req, res: Response, next: NextFunction) => {
  try {
    const dateFilter = req.query.date ? (() => {
      const d = new Date(req.query.date as string);
      const s = new Date(d); s.setHours(0, 0, 0, 0);
      const e = new Date(d); e.setHours(23, 59, 59, 999);
      return { deliveryDate: { gte: s, lte: e } };
    })() : undefined;

    const deliveries = await prisma.delivery.findMany({
      where: { routeId: req.params.id, ...(dateFilter && { order: dateFilter }) },
      include: { order: { include: { buyer: true, items: { include: { listing: { include: { product: true } } } } } } },
      orderBy: { order: { deliveryDate: 'asc' } },
    });
    res.json(ok(deliveries));
  } catch (e) { next(e); }
});

logisticsRouter.post('/deliveries', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN', 'LOGISTICS_COORDINATOR']), async (req, res: Response, next: NextFunction) => {
  try {
    const delivery = await prisma.delivery.create({ data: req.body });
    res.status(201).json(ok(delivery));
  } catch (e) { next(e); }
});

logisticsRouter.patch('/deliveries/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN', 'LOGISTICS_COORDINATOR']), async (req, res: Response, next: NextFunction) => {
  try {
    const delivery = await prisma.delivery.update({ where: { id: req.params.id }, data: req.body });

    if (req.body.status === 'DELIVERED') {
      await prisma.order.update({ where: { id: delivery.orderId }, data: { status: 'DELIVERED' } });
    }

    res.json(ok(delivery));
  } catch (e) { next(e); }
});
