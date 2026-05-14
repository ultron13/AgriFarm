import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { prisma } from '../lib/prisma';
import { ok } from '../types';

export const reportsRouter = Router();

const adminOnly = requireRole(['ADMIN', 'SUPER_ADMIN']);

reportsRouter.get('/gmv', authenticate, adminOnly, async (req, res: Response, next: NextFunction) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(new Date().setDate(1));
    const to = req.query.to ? new Date(req.query.to as string) : new Date();

    const orders = await prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: from, lte: to }, status: { in: ['DELIVERED', 'IN_TRANSIT', 'AT_HUB', 'OUT_FOR_DELIVERY'] } },
      _sum: { deliveredPrice: true },
      _count: { id: true },
    });

    const totalGmv = orders.reduce((sum, g) => sum + Number(g._sum.deliveredPrice ?? 0), 0);
    const totalOrders = orders.reduce((sum, g) => sum + g._count.id, 0);

    res.json(ok({ from, to, totalGmv, totalOrders, breakdown: orders }));
  } catch (e) { next(e); }
});

reportsRouter.get('/unit-economics', authenticate, adminOnly, async (req, res: Response, next: NextFunction) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(new Date().setDate(1));
    const to = req.query.to ? new Date(req.query.to as string) : new Date();

    const [orders, payouts] = await Promise.all([
      prisma.order.aggregate({
        where: { status: 'DELIVERED', createdAt: { gte: from, lte: to } },
        _sum: { deliveredPrice: true, totalFarmGateValue: true, logisticsCharge: true },
        _count: { id: true },
      }),
      prisma.payout.aggregate({
        where: { status: 'PAID', createdAt: { gte: from, lte: to } },
        _sum: { commission: true },
      }),
    ]);

    const revenue = Number(orders._sum.deliveredPrice ?? 0) - Number(orders._sum.totalFarmGateValue ?? 0);
    const logisticsCost = Number(orders._sum.logisticsCharge ?? 0);
    const sellerCommissions = Number(payouts._sum.commission ?? 0);
    const netMargin = revenue - logisticsCost;

    res.json(ok({ from, to, revenue, logisticsCost, sellerCommissions, netMargin, orderCount: orders._count.id }));
  } catch (e) { next(e); }
});

reportsRouter.get('/bbbee', authenticate, adminOnly, async (req, res: Response, next: NextFunction) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(new Date().setDate(1));
    const to = req.query.to ? new Date(req.query.to as string) : new Date();

    const smallholderPayouts = await prisma.payout.aggregate({
      where: { status: 'PAID', createdAt: { gte: from, lte: to }, farmer: { isSmallholder: true } },
      _sum: { grossAmount: true },
      _count: { id: true },
    });

    const totalPayouts = await prisma.payout.aggregate({
      where: { status: 'PAID', createdAt: { gte: from, lte: to } },
      _sum: { grossAmount: true },
    });

    const smallholderPct = Number(totalPayouts._sum.grossAmount ?? 0) > 0
      ? (Number(smallholderPayouts._sum.grossAmount ?? 0) / Number(totalPayouts._sum.grossAmount)) * 100
      : 0;

    res.json(ok({ from, to, smallholderPayoutTotal: smallholderPayouts._sum.grossAmount, totalPayoutTotal: totalPayouts._sum.grossAmount, smallholderPct: smallholderPct.toFixed(2) }));
  } catch (e) { next(e); }
});
