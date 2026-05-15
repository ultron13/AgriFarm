import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validateBody } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { ok, err, AuthenticatedRequest } from '../types';
import { OrderService } from '../services/order.service';

const createDeliverySchema = z.object({
  orderId: z.string().min(1),
  routeId: z.string().optional(),
  vehicleRef: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  collectionAt: z.string().datetime().optional(),
  trackingUrl: z.string().optional(),
  proofOfDelivery: z.string().optional(),
}).strict();

const updateDeliverySchema = z.object({
  status: z.enum(['SCHEDULED', 'COLLECTED', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED']).optional(),
  routeId: z.string().optional(),
  vehicleRef: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  collectionAt: z.string().datetime().optional(),
  hubArrivalAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  trackingUrl: z.string().optional(),
  proofOfDelivery: z.string().optional(),
}).strict();

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

logisticsRouter.post('/deliveries', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN', 'LOGISTICS_COORDINATOR']), validateBody(createDeliverySchema), async (req, res: Response, next: NextFunction) => {
  try {
    const delivery = await prisma.delivery.create({ data: req.body as z.infer<typeof createDeliverySchema> });
    res.status(201).json(ok(delivery));
  } catch (e) { next(e); }
});

logisticsRouter.patch('/deliveries/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN', 'LOGISTICS_COORDINATOR']), validateBody(updateDeliverySchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof updateDeliverySchema>;
    const delivery = await prisma.delivery.update({ where: { id: req.params.id }, data: body });

    if (body.status === 'DELIVERED') {
      await OrderService.confirmDelivery(delivery.orderId, req.user.sub);
    }

    res.json(ok(delivery));
  } catch (e) { next(e); }
});
