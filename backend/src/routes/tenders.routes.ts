import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validateBody, validateQuery } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { ok, err, paginate, AuthenticatedRequest } from '../types';
import { audit } from '../lib/audit';

export const tendersRouter = Router();

const createTenderSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  department: z.string().min(3),
  productCategory: z.string().min(1),
  quantityKg: z.number().positive(),
  deliveryDate: z.string().datetime(),
  deliveryProvince: z.string().min(1),
  deliveryAddress: z.string().min(5),
  budgetPerKg: z.number().positive().optional(),
  closingDate: z.string().datetime(),
  requiresBbbee: z.boolean().default(true),
  requiresHaccp: z.boolean().default(false),
  requiresTaxClear: z.boolean().default(true),
  notes: z.string().optional(),
});

const submitBidSchema = z.object({
  pricePerKg: z.number().positive(),
  quantityKg: z.number().positive(),
  notes: z.string().optional(),
});

const tenderInclude = {
  buyer: { include: { organization: true } },
  bids: {
    include: {
      farmer: { include: { organization: true } },
    },
    orderBy: { submittedAt: 'desc' as const },
  },
  _count: { select: { bids: true } },
};

// GET /tenders — list tenders
tendersRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page, perPage } = paginate(req.query);
    const role = req.user.role;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    // Farmers see open + evaluation tenders from everyone
    // Gov buyers see only their own tenders
    if (role === 'GOV_BUYER') {
      const buyer = await prisma.buyer.findUnique({ where: { userId: req.user.sub } });
      if (!buyer) { res.status(404).json(err('NOT_FOUND', 'Buyer profile not found')); return; }
      where.buyerId = buyer.id;
    } else if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      // Farmers, sales reps etc. see all public tenders
      if (!status) where.status = { in: ['OPEN', 'EVALUATION', 'AWARDED'] };
    }

    const [items, total] = await Promise.all([
      prisma.tender.findMany({
        where,
        include: {
          buyer: { include: { organization: true } },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.tender.count({ where }),
    ]);

    res.json({ data: items, meta: { page, perPage, total } });
  } catch (e) { next(e); }
});

// POST /tenders — create (GOV_BUYER only)
tendersRouter.post('/', authenticate, requireRole(['GOV_BUYER']), validateBody(createTenderSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const buyer = await prisma.buyer.findUnique({ where: { userId: req.user.sub } });
    if (!buyer) { res.status(404).json(err('NOT_FOUND', 'Buyer profile not found')); return; }

    const seq = await prisma.tender.count();
    const refNum = `TND-${new Date().getFullYear()}-${String(seq + 1).padStart(4, '0')}`;

    const tender = await prisma.tender.create({
      data: {
        referenceNumber: refNum,
        buyerId: buyer.id,
        ...req.body,
        deliveryDate: new Date(req.body.deliveryDate),
        closingDate: new Date(req.body.closingDate),
      },
      include: tenderInclude,
    });
    res.status(201).json(ok(tender));
  } catch (e) { next(e); }
});

// GET /tenders/:id — detail
tendersRouter.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tender = await prisma.tender.findUnique({
      where: { id: req.params.id },
      include: tenderInclude,
    });
    if (!tender) { res.status(404).json(err('NOT_FOUND', 'Tender not found')); return; }
    res.json(ok(tender));
  } catch (e) { next(e); }
});

// PATCH /tenders/:id — update status (GOV_BUYER owner or ADMIN)
tendersRouter.patch('/:id', authenticate, requireRole(['GOV_BUYER', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!['EVALUATION', 'CANCELLED'].includes(status)) {
      res.status(400).json(err('INVALID_STATUS', 'Status must be EVALUATION or CANCELLED'));
      return;
    }

    const tender = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!tender) { res.status(404).json(err('NOT_FOUND', 'Tender not found')); return; }

    if (req.user.role === 'GOV_BUYER') {
      const buyer = await prisma.buyer.findUnique({ where: { userId: req.user.sub } });
      if (!buyer || tender.buyerId !== buyer.id) {
        res.status(403).json(err('FORBIDDEN', 'You can only update your own tenders'));
        return;
      }
    }

    const updated = await prisma.tender.update({
      where: { id: tender.id },
      data: { status },
      include: tenderInclude,
    });
    res.json(ok(updated));
  } catch (e) { next(e); }
});

// POST /tenders/:id/bids — farmer submits a bid
tendersRouter.post('/:id/bids', authenticate, requireRole(['FARMER']), validateBody(submitBidSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tender = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!tender) { res.status(404).json(err('NOT_FOUND', 'Tender not found')); return; }
    if (tender.status !== 'OPEN') { res.status(409).json(err('TENDER_CLOSED', 'This tender is no longer accepting bids')); return; }

    const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
    if (!farmer) { res.status(404).json(err('NOT_FOUND', 'Farmer profile not found')); return; }

    // Pull verified compliance docs from the farmer's vault
    const vaultDocs = await prisma.complianceDoc.findMany({
      where: { farmerId: farmer.id, status: 'VERIFIED' },
    });
    const complianceDocsSnapshot = vaultDocs.map(d => ({
      type: d.type,
      label: d.label,
      url: d.fileUrl,
      uploadedAt: d.uploadedAt.toISOString(),
      verified: true,
      verifiedAt: d.verifiedAt?.toISOString(),
    }));

    const { ...rest } = req.body;
    const bid = await prisma.tenderBid.create({
      data: {
        tenderId: tender.id,
        farmerId: farmer.id,
        pricePerKg: rest.pricePerKg,
        quantityKg: rest.quantityKg,
        notes: rest.notes,
        complianceDocs: complianceDocsSnapshot,
      },
      include: { farmer: { include: { organization: true } } },
    });
    res.status(201).json(ok(bid));
  } catch (e: any) {
    if (e.code === 'P2002') {
      res.status(409).json(err('ALREADY_BID', 'You have already submitted a bid for this tender'));
      return;
    }
    next(e);
  }
});

// PATCH /tenders/:id/bids/:bidId — update bid status (GOV_BUYER: shortlist/reject/award)
tendersRouter.patch('/:id/bids/:bidId', authenticate, requireRole(['GOV_BUYER', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!['SHORTLISTED', 'REJECTED', 'AWARDED'].includes(status)) {
      res.status(400).json(err('INVALID_STATUS', 'Status must be SHORTLISTED, REJECTED, or AWARDED'));
      return;
    }

    // Fetch first so we can verify the bid belongs to this tender (prevents BOLA)
    const bid = await prisma.tenderBid.findUnique({
      where: { id: req.params.bidId },
      include: { farmer: { include: { organization: true } } },
    });
    if (!bid) { res.status(404).json(err('NOT_FOUND', 'Bid not found')); return; }
    if (bid.tenderId !== req.params.id) {
      res.status(404).json(err('NOT_FOUND', 'Bid not found for this tender'));
      return;
    }

    const updated = await prisma.tenderBid.update({
      where: { id: bid.id },
      data: { status, evaluatedAt: new Date() },
      include: { farmer: { include: { organization: true } } },
    });

    if (status === 'AWARDED') {
      await prisma.tender.update({
        where: { id: req.params.id },
        data: { status: 'AWARDED', awardedBidId: bid.id },
      });
    }

    await audit({ userId: req.user.sub, action: status === 'AWARDED' ? 'BID_AWARDED' : 'BID_STATUS_CHANGED', resourceType: 'TenderBid', resourceId: bid.id, after: { status, tenderId: req.params.id }, ip: req.ip });

    res.json(ok(updated));
  } catch (e) { next(e); }
});
