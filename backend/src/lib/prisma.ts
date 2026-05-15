import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  if (process.env.CF_WORKER === 'true') {
    // Neon serverless HTTP driver — works in CF Workers without a persistent TCP connection.
    // These packages are optional deps; require() is used so the local dev build doesn't
    // fail if they're not installed.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Pool, neonConfig } = require('@neondatabase/serverless') as typeof import('@neondatabase/serverless');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaNeon } = require('@prisma/adapter-neon') as typeof import('@prisma/adapter-neon');
    neonConfig.fetchConnectionCache = true;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? '' });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter } as any);
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  client.$connect().catch((err: Error) => {
    logger.error({ err }, 'Failed to connect to database');
    process.exit(1);
  });
  return client;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
