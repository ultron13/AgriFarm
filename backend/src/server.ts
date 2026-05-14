import 'dotenv/config';
import { createApp } from './app';
import { logger } from './lib/logger';
import { startPayoutWorker } from './jobs/payout.job';
import { startNotificationWorker } from './jobs/notification.job';
import { startInvoiceWorker } from './jobs/invoice.job';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = createApp();

startPayoutWorker();
startNotificationWorker();
startInvoiceWorker();

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'FarmConnect API started');
});
