import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { prisma } from '../lib/prisma';
import { ok, err } from '../types';
import { OrderService } from '../services/order.service';

export const logisticsRouter = Router();

logisticsRouter.get('/routes', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN', 'LOGISTICS_COORDINATOR', 'FIELD_AGENT']), async (_req, res: Response, next: NextFunction) => {
  try {
    const routes = await prisma.logisticsRoute.findMany({ where: { isActive: true }, include: { _count: { select: { deliveries: true } } } });
    res.json(ok(routes));
  } catch (e) { next(e); }
});

logisticsRouter.get('/routes/:id/deliveries', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN', 'LOGISTICS_COORDINATOR']), async (req, res: Response, next: NextFunction) => {
  try {
    let orderFilter: { deliveryDate: { gte: Date; lte: Date } } | undefined;
    if (req.query.date) {
      const day = new Date(req.query.date as string);
      const gte = new Date(day); gte.setHours(0, 0, 0, 0);
      const lte = new Date(day); lte.setHours(23, 59, 59, 999);
      orderFilter = { deliveryDate: { gte, lte } };
    }

    const deliveries = await prisma.delivery.findMany({
      where: { routeId: req.params.id, ...(orderFilter && { order: orderFilter }) },
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
      await OrderService.confirmDelivery(delivery.orderId);
    }

    res.json(ok(delivery));
  } catch (e) { next(e); }
});
