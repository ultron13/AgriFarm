import 'dotenv/config';
import { logger } from './lib/logger';
import { registerCapture } from './lib/sentry';
import { startPayoutWorker } from './jobs/payout.job';
import { startNotificationWorker } from './jobs/notification.job';
import { startInvoiceWorker } from './jobs/invoice.job';

if (process.env.SENTRY_DSN) {
  import('@sentry/node').then(({ init, captureException }) => {
    init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV ?? 'development' });
    registerCapture(captureException);
    logger.info('Sentry initialised (worker)');
  });
}

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
