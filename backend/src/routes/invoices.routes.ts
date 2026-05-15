import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { prisma } from '../lib/prisma';
import { ok, err, AuthenticatedRequest } from '../types';

export const invoicesRouter = Router();

invoicesRouter.get('/:orderId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { orderId: req.params.orderId } });
    if (!invoice) { res.status(404).json(err('NOT_FOUND', 'Invoice not found')); return; }

    const { role } = req.user;
    if (role === 'BUYER') {
      const buyer = await prisma.buyer.findUnique({ where: { userId: req.user.sub } });
      const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, select: { buyerId: true } });
      if (!buyer || order?.buyerId !== buyer.id) { res.status(403).json(err('FORBIDDEN', 'Access denied')); return; }
    } else if (role === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
      const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, include: { items: { select: { listing: { select: { farmerId: true } } } } } });
      if (!farmer || !order?.items.some(i => i.listing.farmerId === farmer.id)) { res.status(403).json(err('FORBIDDEN', 'Access denied')); return; }
    }

    res.json(ok(invoice));
  } catch (e) { next(e); }
});

// Return the PDF — if pdfUrl is a data URL (mock mode), stream the decoded bytes
invoicesRouter.get('/:orderId/pdf', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { orderId: req.params.orderId },
      select: { invoiceNumber: true, pdfUrl: true, status: true },
    });
    if (!invoice) { res.status(404).json(err('NOT_FOUND', 'Invoice not found')); return; }

    const { role } = req.user;
    if (role === 'BUYER') {
      const buyer = await prisma.buyer.findUnique({ where: { userId: req.user.sub } });
      const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, select: { buyerId: true } });
      if (!buyer || order?.buyerId !== buyer.id) { res.status(403).json(err('FORBIDDEN', 'Access denied')); return; }
    } else if (role === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({ where: { userId: req.user.sub } });
      const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, include: { items: { select: { listing: { select: { farmerId: true } } } } } });
      if (!farmer || !order?.items.some(i => i.listing.farmerId === farmer.id)) { res.status(403).json(err('FORBIDDEN', 'Access denied')); return; }
    }

    if (!invoice.pdfUrl) { res.status(202).json(err('NOT_READY', 'Invoice PDF is still being generated')); return; }

    if (invoice.pdfUrl.startsWith('data:')) {
      const base64 = invoice.pdfUrl.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
      res.end(buffer);
    } else {
      res.redirect(invoice.pdfUrl);
    }
  } catch (e) { next(e); }
});
