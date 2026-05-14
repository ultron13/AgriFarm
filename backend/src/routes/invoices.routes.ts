import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { prisma } from '../lib/prisma';
import { ok, err } from '../types';

export const invoicesRouter = Router();

invoicesRouter.get('/:orderId', authenticate, async (req, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { orderId: req.params.orderId } });
    if (!invoice) { res.status(404).json(err('NOT_FOUND', 'Invoice not found')); return; }
    res.json(ok(invoice));
  } catch (e) { next(e); }
});

// Return the PDF — if pdfUrl is a data URL (mock mode), stream the decoded bytes
invoicesRouter.get('/:orderId/pdf', authenticate, async (req, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { orderId: req.params.orderId },
      select: { invoiceNumber: true, pdfUrl: true, status: true },
    });
    if (!invoice) { res.status(404).json(err('NOT_FOUND', 'Invoice not found')); return; }
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
