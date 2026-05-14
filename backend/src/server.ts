import 'dotenv/config';
import { createApp } from './app';
import { logger } from './lib/logger';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = createApp();

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'FarmConnect API started');
});
