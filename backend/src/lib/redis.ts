import IORedis from 'ioredis';
import { logger } from './logger';

export const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
  // CF Workers: don't open the TCP connection at module init — connect on first command.
  lazyConnect: true,
});

redis.on('error', (err) => logger.error({ err }, 'Redis error'));
redis.on('connect', () => logger.info('Redis connected'));
