import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validateBody } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import { uploadFile, deleteFile, getSignedReadUrl } from '../lib/r2';
import { ok, err, AuthenticatedRequest } from '../types';
import { ComplianceDocType } from '@prisma/client';

export const complianceRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

const verifySchema = z.object({
  expiresAt: z.string().datetime().optional(),
});

const rejectSchema = z.object({
  rejectionNote: z.string().min(5),
});

// GET /compliance — farmer sees own; admin/field-agent sees all (with ?farmerId=)
complianceRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const role = req.user.role;
    let farmerId: string | undefined;

    if (role === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
      if (!farmer) { res.status(404).json(err('NOT_FOUND', 'Farmer profile not found')); return; }
      farmerId = farmer.id;
    } else if (['ADMIN', 'SUPER_ADMIN', 'FIELD_AGENT'].includes(role)) {
      farmerId = req.query.farmerId as string | undefined;
    } else {
      res.status(403).json(err('FORBIDDEN', 'Access denied'));
      return;
    }

    const docs = await prisma.complianceDoc.findMany({
      where: farmerId ? { farmerId } : {},
      include: { farmer: { select: { displayName: true, province: true } } },
      orderBy: { uploadedAt: 'desc' },
    });

    // Auto-expire docs past their expiry date
    const now = new Date();
    const toExpire = docs.filter(d => d.expiresAt && d.expiresAt < now && d.status === 'VERIFIED');
    if (toExpire.length) {
      await prisma.complianceDoc.updateMany({
        where: { id: { in: toExpire.map(d => d.id) } },
        data: { status: 'EXPIRED' },
      });
      toExpire.forEach(d => { d.status = 'EXPIRED'; });
    }

    // Replace stored fileUrl with a short-lived presigned URL so compliance
    // documents are never served from a guessable public path (POPIA).
    const signedDocs = await Promise.all(
      docs.map(async (doc) => ({ ...doc, fileUrl: await getSignedReadUrl(doc.fileKey) }))
    );

    res.json(ok(signedDocs));
  } catch (e) { next(e); }
});

// POST /compliance/upload — farmer uploads a compliance document
complianceRouter.post('/upload', authenticate, requireRole(['FARMER']), upload.single('file'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json(err('NO_FILE', 'No file uploaded')); return; }

    const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
    const detected = await fileTypeFromBuffer(req.file.buffer);
    if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
      res.status(400).json(err('INVALID_FILE_TYPE', 'File must be a PDF, JPEG, or PNG'));
      return;
    }

    const { type, label, expiresAt } = req.body as { type: string; label: string; expiresAt?: string };
    if (!Object.values(ComplianceDocType).includes(type as ComplianceDocType)) {
      res.status(400).json(err('INVALID_TYPE', `type must be one of: ${Object.values(ComplianceDocType).join(', ')}`));
      return;
    }

    const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
    if (!farmer) { res.status(404).json(err('NOT_FOUND', 'Farmer profile not found')); return; }

    // Delete old file from R2 if doc already exists
    const existing = await prisma.complianceDoc.findUnique({ where: { farmerId_type: { farmerId: farmer.id, type: type as ComplianceDocType } } });
    if (existing) await deleteFile(existing.fileKey).catch(() => null);

    const fileKey = `compliance/${farmer.id}/${type.toLowerCase()}-${Date.now()}${path.extname(req.file.originalname)}`;
    const fileUrl = await uploadFile(fileKey, req.file.buffer, req.file.mimetype);

    const doc = await prisma.complianceDoc.upsert({
      where: { farmerId_type: { farmerId: farmer.id, type: type as ComplianceDocType } },
      create: {
        farmerId: farmer.id,
        type: type as ComplianceDocType,
        label: label || type.replace(/_/g, ' '),
        fileUrl,
        fileKey,
        status: 'PENDING',
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
      update: {
        label: label || type.replace(/_/g, ' '),
        fileUrl,
        fileKey,
        status: 'PENDING',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        verifiedAt: null,
        verifiedById: null,
        rejectionNote: null,
      },
    });

    res.status(201).json(ok(doc));
  } catch (e) { next(e); }
});

// PATCH /compliance/:id/verify — admin/field-agent verifies a document
complianceRouter.patch('/:id/verify', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN', 'FIELD_AGENT']), validateBody(verifySchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await prisma.complianceDoc.update({
      where: { id: req.params.id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: req.user.sub,
        rejectionNote: null,
        ...(req.body.expiresAt ? { expiresAt: new Date(req.body.expiresAt) } : {}),
      },
    });
    res.json(ok(doc));
  } catch (e) { next(e); }
});

// PATCH /compliance/:id/reject — admin/field-agent rejects a document
complianceRouter.patch('/:id/reject', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN', 'FIELD_AGENT']), validateBody(rejectSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await prisma.complianceDoc.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectionNote: req.body.rejectionNote, verifiedAt: null },
    });
    res.json(ok(doc));
  } catch (e) { next(e); }
});

// DELETE /compliance/:id — farmer deletes own doc
complianceRouter.delete('/:id', authenticate, requireRole(['FARMER']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
    if (!farmer) { res.status(404).json(err('NOT_FOUND', 'Farmer profile not found')); return; }

    const doc = await prisma.complianceDoc.findUnique({ where: { id: req.params.id } });
    if (!doc || doc.farmerId !== farmer.id) { res.status(404).json(err('NOT_FOUND', 'Document not found')); return; }

    await deleteFile(doc.fileKey).catch(() => null);
    await prisma.complianceDoc.delete({ where: { id: req.params.id } });
    res.json(ok({ deleted: true }));
  } catch (e) { next(e); }
});
