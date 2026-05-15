/**
 * Cloudflare Workers entry point.
 *
 * Handles two exports:
 *   fetch  — HTTP requests via Express (adapted by @whatwg-node/server)
 *   queue  — CF Queue batch consumer for payouts, notifications, invoices
 *
 * Local development still uses src/server.ts + src/worker.ts with BullMQ.
 */
import { createServerAdapter } from '@whatwg-node/server';
import { createApp } from './app';
import { initCFQueues } from './jobs/queues';
import { processPayoutJob } from './jobs/payout.job';
import { processNotificationJob } from './jobs/notification.job';
import { processInvoiceJob } from './jobs/invoice.job';
import type { PayoutJobData, NotificationJobData, InvoiceJobData } from './jobs/queues';

interface CFEnv {
  PAYOUTS_QUEUE: { send(body: unknown, opts?: { delaySeconds?: number }): Promise<void> };
  NOTIFICATIONS_QUEUE: { send(body: unknown): Promise<void> };
  INVOICES_QUEUE: { send(body: unknown): Promise<void> };
  [key: string]: unknown;
}

const app = createApp();
const handler = createServerAdapter(app as any);

export default {
  fetch(request: Request, env: CFEnv, ctx: ExecutionContext): Promise<Response> {
    initCFQueues(env);
    return handler.fetch(request, env, ctx);
  },

  async queue(batch: MessageBatch<unknown>, env: CFEnv): Promise<void> {
    initCFQueues(env);
    for (const msg of batch.messages) {
      try {
        const body = msg.body as Record<string, unknown>;
        if (batch.queue === 'farmconnect-payouts') {
          await processPayoutJob(body as unknown as PayoutJobData);
        } else if (batch.queue === 'farmconnect-notifications') {
          await processNotificationJob(body as unknown as NotificationJobData);
        } else if (batch.queue === 'farmconnect-invoices') {
          await processInvoiceJob(body as unknown as InvoiceJobData);
        }
        msg.ack();
      } catch (err) {
        console.error('Queue job failed, retrying', { queue: batch.queue, err });
        msg.retry();
      }
    }
  },
};
