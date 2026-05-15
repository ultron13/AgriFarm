import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { verifyWebhookSignature as verifyOzow } from '../lib/ozow';
import { verifyWebhookSignature as verifyStitch } from '../lib/stitch';
import { WhatsAppService } from '../services/whatsapp.service';
import { logger } from '../lib/logger';
import { audit } from '../lib/audit';
import { payoutsQueue } from '../jobs/queues';

export const webhooksRouter = Router();

// Note: body is raw Buffer (set in app.ts before express.json())

webhooksRouter.post('/ozow', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['hash'] as string ?? '';
    const payload = (req.body as Buffer).toString();

    if (!verifyOzow(payload, signature)) {
      logger.warn('Ozow webhook signature verification failed');
      res.sendStatus(400);
      return;
    }

    const data = JSON.parse(payload) as { TransactionReference: string; Status: string; TransactionId: string };

    // Idempotency: SET NX gives us exactly-once processing; a replayed event
    // (same TransactionId) hits the early return and never touches the DB.
    const idempotencyKey = `webhook:ozow:${data.TransactionId}`;
    const isNew = await redis.set(idempotencyKey, '1', 'EX', 86400, 'NX');
    if (!isNew) {
      logger.info({ transactionId: data.TransactionId }, 'Ozow webhook duplicate — skipping');
      res.sendStatus(200);
      return;
    }

    const orderId = data.TransactionReference;
    const isPaid = data.Status === 'Complete';

    await prisma.payment.updateMany({
      where: { orderId },
      data: { status: isPaid ? 'PAID' : 'FAILED', pspReference: data.TransactionId, ...(isPaid && { paidAt: new Date() }) },
    });

    if (isPaid) {
      await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } });

      // If the order was already delivered before payment arrived, schedule any
      // payout jobs that confirmDelivery held back pending payment.
      const pendingPayouts = await prisma.payout.findMany({ where: { orderId, status: 'PENDING' } });
      if (pendingPayouts.length > 0) {
        const IS_MOCK = process.env.NODE_ENV !== 'production';
        const delay = IS_MOCK ? 5_000 : 48 * 60 * 60 * 1000;
        await Promise.all(pendingPayouts.map(p => payoutsQueue.add('process_payout', { payoutId: p.id }, { delay })));
      }

      await audit({ userId: 'webhook:ozow', action: 'PAYMENT_CONFIRMED', resourceType: 'Payment', resourceId: data.TransactionId, after: { orderId, pspReference: data.TransactionId } });
    }

    res.sendStatus(200);
  } catch (e) {
    logger.error({ err: e }, 'Ozow webhook processing error');
    res.sendStatus(500);
  }
});

webhooksRouter.post('/stitch', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-stitch-signature'] as string ?? '';
    const payload = (req.body as Buffer).toString();

    if (!verifyStitch(payload, signature)) {
      logger.warn('Stitch webhook signature verification failed');
      res.sendStatus(400);
      return;
    }

    const data = JSON.parse(payload) as { type: string; data: { payoutId: string; status: string } };

    // Idempotency: one payout event type per payoutId is processed exactly once.
    const idempotencyKey = `webhook:stitch:${data.data.payoutId}:${data.type}`;
    const isNew = await redis.set(idempotencyKey, '1', 'EX', 86400, 'NX');
    if (!isNew) {
      logger.info({ payoutId: data.data.payoutId }, 'Stitch webhook duplicate — skipping');
      res.sendStatus(200);
      return;
    }

    if (data.type === 'payout.completed') {
      await prisma.payout.updateMany({
        where: { pspReference: data.data.payoutId },
        data: { status: 'PAID', paidAt: new Date() },
      });
      await audit({ userId: 'webhook:stitch', action: 'PAYOUT_COMPLETED', resourceType: 'Payout', resourceId: data.data.payoutId });
    } else if (data.type === 'payout.failed') {
      await prisma.payout.updateMany({
        where: { pspReference: data.data.payoutId },
        data: { status: 'FAILED' },
      });
      await audit({ userId: 'webhook:stitch', action: 'PAYOUT_FAILED', resourceType: 'Payout', resourceId: data.data.payoutId });
    }

    res.sendStatus(200);
  } catch (e) {
    logger.error({ err: e }, 'Stitch webhook processing error');
    res.sendStatus(500);
  }
});

// Clickatell inbound MO webhook — Clickatell sends { moMessage: { from, content, ... } }
webhooksRouter.post('/whatsapp', async (req: Request, res: Response) => {
  // Verify shared secret when configured (set WHATSAPP_WEBHOOK_TOKEN in prod).
  // Clickatell passes the token in the x-clickatell-token header or as ?token= query param.
  const WHATSAPP_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN;
  if (WHATSAPP_TOKEN) {
    const provided = (req.headers['x-clickatell-token'] as string | undefined) ?? (req.query.token as string | undefined);
    if (!provided || provided !== WHATSAPP_TOKEN) {
      logger.warn('WhatsApp webhook token verification failed');
      res.sendStatus(401);
      return;
    }
  }

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
