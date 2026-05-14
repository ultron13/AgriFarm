import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { verifyWebhookSignature as verifyOzow } from '../lib/ozow';
import { verifyWebhookSignature as verifyStitch } from '../lib/stitch';
import { WhatsAppService } from '../services/whatsapp.service';
import { logger } from '../lib/logger';

export const webhooksRouter = Router();

// Note: body is raw Buffer (set in app.ts before express.json())

webhooksRouter.post('/ozow', async (req: Request, res: Response) => {
  res.sendStatus(200); // acknowledge immediately

  const signature = req.headers['hash'] as string ?? '';
  const payload = (req.body as Buffer).toString();

  if (!verifyOzow(payload, signature)) {
    logger.warn('Ozow webhook signature verification failed');
    return;
  }

  const data = JSON.parse(payload) as { TransactionReference: string; Status: string; TransactionId: string };
  const orderId = data.TransactionReference;
  const isPaid = data.Status === 'Complete';

  await prisma.payment.updateMany({
    where: { orderId },
    data: { status: isPaid ? 'PAID' : 'FAILED', pspReference: data.TransactionId, ...(isPaid && { paidAt: new Date() }) },
  });

  if (isPaid) {
    await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } });
  }
});

webhooksRouter.post('/stitch', async (req: Request, res: Response) => {
  res.sendStatus(200);

  const signature = req.headers['x-stitch-signature'] as string ?? '';
  const payload = (req.body as Buffer).toString();

  if (!verifyStitch(payload, signature)) {
    logger.warn('Stitch webhook signature verification failed');
    return;
  }

  const data = JSON.parse(payload) as { type: string; data: { payoutId: string; status: string } };

  if (data.type === 'payout.completed') {
    await prisma.payout.updateMany({
      where: { pspReference: data.data.payoutId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  } else if (data.type === 'payout.failed') {
    await prisma.payout.updateMany({
      where: { pspReference: data.data.payoutId },
      data: { status: 'FAILED' },
    });
  }
});

// Clickatell inbound MO webhook — Clickatell sends { moMessage: { from, content, ... } }
webhooksRouter.post('/whatsapp', async (req: Request, res: Response) => {
  res.sendStatus(200); // Acknowledge immediately

  try {
    const payload = typeof req.body === 'string' || Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString())
      : req.body;

    const mo = payload?.moMessage ?? payload?.data;
    const phone: string = mo?.from ?? payload?.from ?? '';
    const text: string = mo?.content ?? mo?.text ?? payload?.text ?? '';

    if (!phone || !text) {
      logger.warn({ payload }, 'WhatsApp webhook missing phone or text');
      return;
    }

    const reply = await WhatsAppService.handleIncoming(phone, text);
    logger.info({ phone, text, reply }, 'WhatsApp message processed');
  } catch (e) {
    logger.error({ err: e }, 'WhatsApp webhook processing error');
  }
});
