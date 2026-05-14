import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { WhatsAppService } from '../services/whatsapp.service';
import { ok, err, AuthenticatedRequest } from '../types';

export const whatsappRouter = Router();

// Simulate an inbound WhatsApp message — for the admin/sales simulator UI
whatsappRouter.post(
  '/simulate',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_REP']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { phone, message } = req.body as { phone?: string; message?: string };
      if (!phone || !message) {
        res.status(400).json(err('MISSING_FIELDS', 'phone and message are required'));
        return;
      }
      const reply = await WhatsAppService.handleIncoming(phone.trim(), message.trim());
      res.json(ok({ reply }));
    } catch (e) {
      next(e);
    }
  }
);

// List active WhatsApp sessions (in-progress conversations)
whatsappRouter.get(
  '/sessions',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = await WhatsAppService.getActiveSessions();
      res.json(ok(sessions));
    } catch (e) {
      next(e);
    }
  }
);

// Session message history for a given phone number
whatsappRouter.get(
  '/sessions/:phone',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_REP']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const phone = decodeURIComponent(req.params.phone);
      const data = await WhatsAppService.getSessionHistory(phone);
      if (!data) {
        res.status(404).json(err('NOT_FOUND', 'No active session for this number'));
        return;
      }
      res.json(ok(data));
    } catch (e) {
      next(e);
    }
  }
);
