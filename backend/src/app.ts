import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';

import { authRouter } from './routes/auth.routes';
import { farmersRouter } from './routes/farmers.routes';
import { listingsRouter } from './routes/listings.routes';
import { ordersRouter } from './routes/orders.routes';
import { qualityRouter } from './routes/quality.routes';
import { logisticsRouter } from './routes/logistics.routes';
import { paymentsRouter } from './routes/payments.routes';
import { payoutsRouter } from './routes/payouts.routes';
import { invoicesRouter } from './routes/invoices.routes';
import { reportsRouter } from './routes/reports.routes';
import { webhooksRouter } from './routes/webhooks.routes';
import { productsRouter } from './routes/products.routes';
import { whatsappRouter } from './routes/whatsapp.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }));
  app.use(pinoHttp({ logger }));

  // Raw body for webhook signature verification — must come before express.json()
  app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  app.use('/api/v1/products', productsRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/farmers', farmersRouter);
  app.use('/api/v1/listings', listingsRouter);
  app.use('/api/v1/orders', ordersRouter);
  app.use('/api/v1/quality-checks', qualityRouter);
  app.use('/api/v1/logistics', logisticsRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/payouts', payoutsRouter);
  app.use('/api/v1/invoices', invoicesRouter);
  app.use('/api/v1/reports', reportsRouter);
  app.use('/api/v1/webhooks', webhooksRouter);
  app.use('/api/v1/whatsapp', whatsappRouter);

  app.use(errorHandler);

  return app;
}
