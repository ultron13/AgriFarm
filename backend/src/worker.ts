import 'dotenv/config';
import { logger } from './lib/logger';
import { startPayoutWorker } from './jobs/payout.job';
import { startNotificationWorker } from './jobs/notification.job';
import { startInvoiceWorker } from './jobs/invoice.job';

logger.info('Starting FarmConnect background workers');

const workers = [
  startPayoutWorker(),
  startNotificationWorker(),
  startInvoiceWorker(),
];

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — closing workers');
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
});
