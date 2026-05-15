import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validateBody, validateQuery } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import { buildKey, getUploadUrl, publicUrl } from '../lib/r2';
import { ok, err, paginate, AuthenticatedRequest } from '../types';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const listingsRouter = Router();

const listingQuerySchema = z.object({
  productId: z.string().optional(),
  province: z.string().optional(),
  minKg: z.coerce.number().optional(),
  page: z.string().optional(),
  perPage: z.string().optional(),
});

const createListingSchema = z.object({
  productId: z.string().min(1),
  gradeId: z.string().optional(),
  farmGatePrice: z.number().positive(),
  availableKg: z.number().positive(),
  minimumOrderKg: z.number().positive().default(50),
  availableFrom: z.string().datetime(),
  availableUntil: z.string().datetime(),
});

// Strict schema for updates — unknown keys (farmerId, deletedAt, status, …)
// are rejected with a 422 before they reach Prisma.
const updateListingSchema = z.object({
  farmGatePrice: z.number().positive().optional(),
  availableKg: z.number().positive().optional(),
  minimumOrderKg: z.number().positive().optional(),
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
}).strict();

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
  validateBody(updateListingSchema),
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

      const body = req.body as z.infer<typeof updateListingSchema>;
      const updated = await prisma.produceListing.update({ where: { id: req.params.id }, data: body });
      res.json(ok(updated));
    } catch (e) {
      next(e);
    }
  }
);

// Upload a photo to a listing (multipart/form-data, field "photo")
listingsRouter.post(
  '/:id/photos',
  authenticate,
  requireRole(['FARMER', 'ADMIN', 'SUPER_ADMIN']),
  upload.single('photo'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) { res.status(400).json(err('MISSING_FILE', 'No photo file uploaded')); return; }

      const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const detected = await fileTypeFromBuffer(file.buffer);
      if (!detected || !ALLOWED_PHOTO_TYPES.includes(detected.mime)) {
        res.status(400).json(err('INVALID_FILE_TYPE', 'Photo must be a JPEG, PNG, WebP, or GIF'));
        return;
      }

      const listing = await prisma.produceListing.findUnique({ where: { id: req.params.id } });
      if (!listing || listing.deletedAt) { res.status(404).json(err('NOT_FOUND', 'Listing not found')); return; }

      const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
      if (!isAdmin && farmer?.id !== listing.farmerId) {
        res.status(403).json(err('FORBIDDEN', 'Not authorized')); return;
      }

      const ext = (file.originalname.split('.').pop() ?? 'jpg').toLowerCase();
      const key = buildKey(`listings/${req.params.id}`, ext);
      let photoUrl: string;

      if (process.env.R2_ACCOUNT_ID) {
        const uploadUrl = await getUploadUrl(key, file.mimetype);
        await fetch(uploadUrl, { method: 'PUT', body: file.buffer, headers: { 'Content-Type': file.mimetype } });
        photoUrl = publicUrl(key);
      } else {
        // Mock: store inline as data URL (demo only — fine for images up to 5 MB)
        photoUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }

      const sortOrder = await prisma.listingPhoto.count({ where: { listingId: req.params.id } });
      const photo = await prisma.listingPhoto.create({
        data: { listingId: req.params.id, r2Key: key, url: photoUrl, sortOrder },
      });

      res.status(201).json(ok(photo));
    } catch (e) {
      next(e);
    }
  }
);

listingsRouter.delete(
  '/:id/photos/:photoId',
  authenticate,
  requireRole(['FARMER', 'ADMIN', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const photo = await prisma.listingPhoto.findUnique({ where: { id: req.params.photoId } });
      if (!photo || photo.listingId !== req.params.id) {
        res.status(404).json(err('NOT_FOUND', 'Photo not found')); return;
      }
      await prisma.listingPhoto.delete({ where: { id: req.params.photoId } });
      res.json(ok({ deleted: true }));
    } catch (e) {
      next(e);
    }
  }
);
