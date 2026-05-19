import 'dotenv/config';
import { createApp } from './app';
import { logger } from './lib/logger';
import { registerCapture } from './lib/sentry';

if (process.env.SENTRY_DSN) {
  import('@sentry/node').then(({ init, captureException }) => {
    init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV ?? 'development' });
    registerCapture(captureException);
    logger.info('Sentry initialised');
  });
}

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = createApp();

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'FarmConnect API started');
});
