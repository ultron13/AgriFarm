import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { sendWhatsapp, sendSms } from '../lib/clickatell';
import { logger } from '../lib/logger';
import type { NotificationJobData } from './queues';

export async function processNotificationJob(data: NotificationJobData): Promise<void> {
  if (data.channel === 'whatsapp') {
    await sendWhatsapp({ to: data.to, templateId: data.templateId, variables: data.variables });
  } else if (data.channel === 'sms') {
    await sendSms({ to: data.to, text: data.text });
  } else if (data.channel === 'email') {
    // SendGrid email handled here in Phase 2
    logger.info({ to: data.to, subject: data.subject }, 'Email notification (not yet implemented)');
  }
}

export function startNotificationWorker() {
  const worker = new Worker<NotificationJobData>(
    'notifications',
    (job: Job<NotificationJobData>) => processNotificationJob(job.data),
    { connection: redis, concurrency: 20 }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobName: job?.name, err }, 'Notification job failed');
  });

  return worker;
}
