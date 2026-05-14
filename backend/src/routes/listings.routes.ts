import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validateBody, validateQuery } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { ok, err, paginate, AuthenticatedRequest } from '../types';

export const listingsRouter = Router();

const listingQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  province: z.string().optional(),
  minKg: z.coerce.number().optional(),
  page: z.string().optional(),
  perPage: z.string().optional(),
});

const createListingSchema = z.object({
  productId: z.string().uuid(),
  gradeId: z.string().uuid().optional(),
  farmGatePrice: z.number().positive(),
  availableKg: z.number().positive(),
  minimumOrderKg: z.number().positive().default(50),
  availableFrom: z.string().datetime(),
  availableUntil: z.string().datetime(),
});

listingsRouter.get('/', validateQuery(listingQuerySchema), async (req, res: Response, next: NextFunction) => {
  try {
    const q = req.query as z.infer<typeof listingQuerySchema>;
    const { skip, take, page, perPage } = paginate(q);

    const where = {
      status: 'ACTIVE' as const,
      ...(q.productId && { productId: q.productId }),
      ...(q.province && { farmer: { province: q.province as never } }),
      ...(q.minKg && { availableKg: { gte: q.minKg } }),
      availableFrom: { lte: new Date() },
      availableUntil: { gte: new Date() },
      deletedAt: null,
    };

    const [listings, total] = await Promise.all([
      prisma.produceListing.findMany({
        where,
        skip,
        take,
        include: { product: true, farmer: { select: { displayName: true, province: true } }, grade: true, photos: { take: 1 } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.produceListing.count({ where }),
    ]);

    res.json(ok(listings, { page, perPage, total }));
  } catch (e) {
    next(e);
  }
});

listingsRouter.post(
  '/',
  authenticate,
  requireRole(['FARMER', 'ADMIN', 'SUPER_ADMIN']),
  validateBody(createListingSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof createListingSchema>;

      const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
      if (!farmer) {
        res.status(404).json(err('NOT_FOUND', 'Farmer profile not found'));
        return;
      }

      const listing = await prisma.produceListing.create({
        data: { ...body, farmerId: farmer.id },
        include: { product: true },
      });

      res.status(201).json(ok(listing));
    } catch (e) {
      next(e);
    }
  }
);

listingsRouter.patch(
  '/:id',
  authenticate,
  requireRole(['FARMER', 'ADMIN', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const listing = await prisma.produceListing.findUnique({ where: { id: req.params.id } });
      if (!listing || listing.deletedAt) {
        res.status(404).json(err('NOT_FOUND', 'Listing not found'));
        return;
      }

      const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
      const isOwner = farmer?.id === listing.farmerId;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

      if (!isOwner && !isAdmin) {
        res.status(403).json(err('FORBIDDEN', 'You do not own this listing'));
        return;
      }

      const updated = await prisma.produceListing.update({ where: { id: req.params.id }, data: req.body });
      res.json(ok(updated));
    } catch (e) {
      next(e);
    }
  }
);
