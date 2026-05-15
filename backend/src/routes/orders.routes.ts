import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validateBody } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { ok, err, paginate, AuthenticatedRequest } from '../types';
import { OrderService } from '../services/order.service';
import { audit } from '../lib/audit';

export const ordersRouter = Router();

const orderItemSchema = z.object({
  listingId: z.string().min(1),
  quantityKg: z.number().positive(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  deliveryDate: z.string().datetime().refine((d) => new Date(d) > new Date(), 'Delivery date must be in the future'),
  notes: z.string().optional(),
  source: z.enum(['WEB', 'WHATSAPP', 'FIELD_AGENT', 'API']).default('WEB'),
  buyerId: z.string().optional(), // ADMIN/SUPER_ADMIN only — create on behalf of a buyer
});

ordersRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, perPage } = paginate(req.query);
    const role = req.user.role;
    const statusFilter = req.query.status as string | undefined;
    const sourceFilter = req.query.source as string | undefined;

    const where: Record<string, unknown> = { deletedAt: null };

    if (role === 'BUYER') {
      const buyer = await prisma.buyer.findUnique({ where: { userId: req.user.sub } });
      if (!buyer) { res.status(404).json(err('NOT_FOUND', 'Buyer profile not found')); return; }
      where['buyerId'] = buyer.id;
    } else if (role === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
      if (!farmer) { res.status(404).json(err('NOT_FOUND', 'Farmer profile not found')); return; }
      where['items'] = { some: { listing: { farmerId: farmer.id } } };
    }

    if (statusFilter) where['status'] = statusFilter;
    if (sourceFilter) where['source'] = sourceFilter;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        include: {
          buyer: { select: { displayName: true, buyerType: true } },
          items: { include: { listing: { include: { product: true } } } },
          delivery: { select: { status: true, driverName: true, vehicleRef: true } },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    res.json(ok(orders, { page, perPage, total }));
  } catch (e) {
    next(e);
  }
});

ordersRouter.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { listing: { include: { product: true, farmer: true } } } }, delivery: true, payment: true, invoice: true, qualityChecks: { include: { photos: true } } },
    });

    if (!order) { res.status(404).json(err('NOT_FOUND', 'Order not found')); return; }

    const { role } = req.user;
    if (role === 'BUYER') {
      const buyer = await prisma.buyer.findUnique({ where: { userId: req.user.sub } });
      if (!buyer || order.buyerId !== buyer.id) { res.status(403).json(err('FORBIDDEN', 'Access denied')); return; }
    } else if (role === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
      if (!farmer || !order.items.some(i => i.listing.farmerId === farmer.id)) {
        res.status(403).json(err('FORBIDDEN', 'Access denied')); return;
      }
    }

    res.json(ok(order));
  } catch (e) {
    next(e);
  }
});

ordersRouter.post(
  '/',
  authenticate,
  requireRole(['BUYER', 'ADMIN', 'SUPER_ADMIN']),
  validateBody(createOrderSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof createOrderSchema>;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

      let buyerId: string;
      if (isAdmin && body.buyerId) {
        buyerId = body.buyerId;
      } else {
        const buyer = await prisma.buyer.findUnique({ where: { userId: req.user.sub } });
        if (!buyer) {
          res.status(404).json(err('NOT_FOUND', 'Buyer profile not found'));
          return;
        }
        buyerId = buyer.id;
      }

      const order = await OrderService.createOrder(buyerId, body, req.user.sub);
      res.status(201).json(ok(order));
    } catch (e) {
      next(e);
    }
  }
);

ordersRouter.post(
  '/:id/confirm-delivery',
  authenticate,
  requireRole(['BUYER', 'LOGISTICS_COORDINATOR', 'ADMIN', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role === 'BUYER') {
        const buyer = await prisma.buyer.findUnique({ where: { userId: req.user.sub } });
        const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { buyerId: true } });
        if (!buyer || !order || order.buyerId !== buyer.id) {
          res.status(403).json(err('FORBIDDEN', 'You can only confirm delivery of your own orders'));
          return;
        }
      }
      const order = await OrderService.confirmDelivery(req.params.id, req.user.sub);
      res.json(ok(order));
    } catch (e) {
      next(e);
    }
  }
);

const disputeSchema = z.object({
  reason: z.string().min(10),
});

const DISPUTABLE_STATUSES = ['DELIVERED', 'IN_TRANSIT', 'AT_HUB', 'OUT_FOR_DELIVERY'];

ordersRouter.post(
  '/:id/dispute',
  authenticate,
  requireRole(['BUYER', 'ADMIN', 'SUPER_ADMIN']),
  validateBody(disputeSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body as z.infer<typeof disputeSchema>;

      const order = await prisma.order.findUnique({ where: { id: req.params.id } });
      if (!order) { res.status(404).json(err('NOT_FOUND', 'Order not found')); return; }

      if (req.user.role === 'BUYER') {
        const buyer = await prisma.buyer.findUnique({ where: { userId: req.user.sub } });
        if (!buyer || order.buyerId !== buyer.id) {
          res.status(403).json(err('FORBIDDEN', 'You can only dispute your own orders'));
          return;
        }
      }

      if (!DISPUTABLE_STATUSES.includes(order.status)) {
        res.status(409).json(err('INVALID_STATE', `Cannot dispute an order with status ${order.status}`));
        return;
      }

      // Atomically mark order DISPUTED and cancel any pending payouts so
      // the payout job (which skips non-PENDING records) cannot pay out
      // while the dispute is open.
      const [updated] = await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'DISPUTED',
            notes: order.notes ? `${order.notes}\n[DISPUTE] ${reason}` : `[DISPUTE] ${reason}`,
          },
        }),
        prisma.payout.updateMany({
          where: { orderId: order.id, status: 'PENDING' },
          data: { status: 'CANCELLED' },
        }),
      ]);

      await audit({ userId: req.user.sub, action: 'ORDER_DISPUTED', resourceType: 'Order', resourceId: order.id, after: { reason }, ip: req.ip });

      res.json(ok(updated));
    } catch (e) { next(e); }
  }
);

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'QUALITY_CHECKED', 'IN_TRANSIT', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
});

ordersRouter.patch(
  '/:id/status',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validateBody(updateStatusSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body as z.infer<typeof updateStatusSchema>;
      const order = await prisma.order.update({
        where: { id: req.params.id },
        data: { status },
        include: { buyer: { select: { displayName: true, buyerType: true } }, items: { include: { listing: { include: { product: true } } } }, delivery: true, payment: true },
      });

      await audit({ userId: req.user.sub, action: 'ORDER_STATUS_CHANGED', resourceType: 'Order', resourceId: order.id, after: { status }, ip: req.ip });

      res.json(ok(order));
    } catch (e) {
      next(e);
    }
  }
);
