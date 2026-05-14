import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

const connection = redis;

export const payoutsQueue = new Queue('payouts', { connection });
export const notificationsQueue = new Queue('notifications', { connection });
export const invoicesQueue = new Queue('invoices', { connection });
export const reportsQueue = new Queue('reports', { connection });

export type PayoutJobData = {
  payoutId: string;
};

export type NotificationJobData =
  | { channel: 'whatsapp'; to: string; templateId: string; variables: Record<string, string> }
  | { channel: 'email'; to: string; subject: string; templateId: string; variables: Record<string, string> }
  | { channel: 'sms'; to: string; text: string };

export type InvoiceJobData = {
  invoiceId: string;
  orderId: string;
};
