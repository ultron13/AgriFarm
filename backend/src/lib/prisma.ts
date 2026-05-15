import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { logger } from './logger';

// CF Workers: module init runs before the fetch handler, so process.env secrets are not yet
// populated when this module loads. Use a lazy Proxy: the PrismaClient is created on the
// first actual DB call, which happens after the fetch handler has synced process.env.
let _cfInstance: PrismaClient | undefined;
function getCFInstance(): PrismaClient {
  if (!_cfInstance) {
    neonConfig.poolQueryViaFetch = true;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const adapter = new PrismaNeon(pool);
    _cfInstance = new PrismaClient({ adapter });
  }
  return _cfInstance;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createLocalClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  client.$connect().catch((err: Error) => {
    logger.error({ err }, 'Failed to connect to database');
    process.exit(1);
  });
  return client;
}

export const prisma: PrismaClient = process.env.CF_WORKER === 'true'
  ? new Proxy({} as PrismaClient, {
      get(_, prop) {
        return (getCFInstance() as unknown as Record<string | symbol, unknown>)[prop];
      },
    })
  : (globalForPrisma.prisma ?? (globalForPrisma.prisma = createLocalClient()));
