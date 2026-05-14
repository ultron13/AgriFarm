import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validateBody } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { ok, err, paginate, AuthenticatedRequest } from '../types';

export const farmersRouter = Router();

const createFarmerSchema = z.object({
  displayName: z.string().min(2),
  province: z.enum(['LIMPOPO', 'MPUMALANGA', 'GAUTENG', 'NORTH_WEST', 'FREE_STATE', 'KWAZULU_NATAL', 'WESTERN_CAPE', 'EASTERN_CAPE', 'NORTHERN_CAPE']),
  district: z.string(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  organizationId: z.string().uuid().optional(),
  isSmallholder: z.boolean().default(false),
});

farmersRouter.get('/', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_REP', 'FIELD_AGENT', 'LOGISTICS_COORDINATOR']), async (req, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, perPage } = paginate(req.query);
    const province = req.query.province as string | undefined;
    const isSmallholder = req.query.isSmallholder === 'true' ? true : undefined;

    const where = { deletedAt: null, ...(province && { province: province as never }), ...(isSmallholder !== undefined && { isSmallholder }) };
    const [farmers, total] = await Promise.all([
      prisma.farmer.findMany({ where, skip, take, include: { organization: true, user: { select: { email: true, phone: true } } } }),
      prisma.farmer.count({ where }),
    ]);
    res.json(ok(farmers, { page, perPage, total }));
  } catch (e) {
    next(e);
  }
});

farmersRouter.get('/me/listings', authenticate, requireRole(['FARMER']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
    if (!farmer) { res.status(404).json(err('NOT_FOUND', 'Farmer profile not found')); return; }

    const { skip, take, page, perPage } = paginate(req.query);
    const [listings, total] = await Promise.all([
      prisma.produceListing.findMany({
        where: { farmerId: farmer.id, deletedAt: null },
        skip,
        take,
        include: { product: true, grade: true, photos: { take: 1 } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.produceListing.count({ where: { farmerId: farmer.id, deletedAt: null } }),
    ]);
    res.json(ok(listings, { page, perPage, total }));
  } catch (e) {
    next(e);
  }
});

farmersRouter.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { id: req.params.id },
      include: { organization: true, listings: { where: { status: 'ACTIVE', deletedAt: null }, include: { product: true } } },
    });
    if (!farmer) { res.status(404).json(err('NOT_FOUND', 'Farmer not found')); return; }
    res.json(ok(farmer));
  } catch (e) {
    next(e);
  }
});

farmersRouter.post('/', authenticate, requireRole(['FARMER', 'ADMIN', 'SUPER_ADMIN']), validateBody(createFarmerSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
    if (existing) { res.status(409).json(err('CONFLICT', 'Farmer profile already exists')); return; }

    const farmer = await prisma.farmer.create({ data: { ...req.body, userId: req.user.sub } });
    res.status(201).json(ok(farmer));
  } catch (e) {
    next(e);
  }
});
