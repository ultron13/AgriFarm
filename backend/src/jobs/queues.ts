import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

export type PayoutJobData = { payoutId: string };

export type NotificationJobData =
  | { channel: 'whatsapp'; to: string; templateId: string; variables: Record<string, string> }
  | { channel: 'email'; to: string; subject: string; templateId: string; variables: Record<string, string> }
  | { channel: 'sms'; to: string; text: string };

export type InvoiceJobData = { invoiceId: string; orderId: string };

interface CFQueueSender {
  send(body: unknown, opts?: { delaySeconds?: number }): Promise<void>;
}

interface CFQueues {
  PAYOUTS_QUEUE: CFQueueSender;
  NOTIFICATIONS_QUEUE: CFQueueSender;
  INVOICES_QUEUE: CFQueueSender;
}

export interface QueueAdapter {
  add(name: string, data: unknown, opts?: { delay?: number }): Promise<void>;
}

// Set once from src/index.ts (CF Worker entry) before any request is handled.
// CF Worker env bindings are the same object for all requests in the same isolate,
// so a single assignment is safe across concurrent requests.
let _cf: CFQueues | null = null;

export function initCFQueues(env: CFQueues): void {
  _cf = env;
}

// Lazy BullMQ queues — only instantiated in local dev (when _cf is null).
let _bullPayouts: Queue | null = null;
let _bullNotifications: Queue | null = null;
let _bullInvoices: Queue | null = null;
let _bullReports: Queue | null = null;

function bullQueue(name: 'payouts' | 'notifications' | 'invoices' | 'reports'): Queue {
  if (name === 'payouts')       return (_bullPayouts       ??= new Queue('payouts',       { connection: redis }));
  if (name === 'notifications') return (_bullNotifications ??= new Queue('notifications', { connection: redis }));
  if (name === 'invoices')      return (_bullInvoices      ??= new Queue('invoices',      { connection: redis }));
  return                               (_bullReports       ??= new Queue('reports',       { connection: redis }));
}

export const payoutsQueue: QueueAdapter = {
  async add(name, data, opts) {
    if (_cf) {
      await _cf.PAYOUTS_QUEUE.send(data, opts?.delay ? { delaySeconds: Math.ceil(opts.delay / 1000) } : undefined);
    } else {
      await bullQueue('payouts').add(name, data as PayoutJobData, opts);
    }
  },
};

export const notificationsQueue: QueueAdapter = {
  async add(name, data, opts) {
    if (_cf) {
      await _cf.NOTIFICATIONS_QUEUE.send(data);
    } else {
      await bullQueue('notifications').add(name, data as NotificationJobData, opts);
    }
  },
};

export const invoicesQueue: QueueAdapter = {
  async add(name, data, opts) {
    if (_cf) {
      await _cf.INVOICES_QUEUE.send(data);
    } else {
      await bullQueue('invoices').add(name, data as InvoiceJobData, opts);
    }
  },
};

// Reports are generated synchronously on request — no async queue consumer needed.
export const reportsQueue: QueueAdapter = {
  async add(name, data, opts) {
    if (!_cf) {
      await bullQueue('reports').add(name, data as Record<string, unknown>, opts);
    }
  },
};
