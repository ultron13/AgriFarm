import { vi } from 'vitest';

// Mock Prisma globally so tests don't hit the DB.
// `models` is defined first so $transaction can reference it via closure.
vi.mock('../lib/prisma', () => {
  const models = {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    farmer: { findUnique: vi.fn(), findMany: vi.fn() },
    buyer: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn() },
    tender: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    tenderBid: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    payout: { create: vi.fn(), updateMany: vi.fn(), findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn() },
    complianceDoc: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), upsert: vi.fn() },
    produceListing: { findMany: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn() },
    order: { findMany: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), create: vi.fn(), update: vi.fn(), aggregate: vi.fn() },
    invoice: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    product: { findMany: vi.fn(), findUnique: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  };
  const prisma = {
    ...models,
    // Executes callback with the same mock object, or runs array of promises in parallel
    $transaction: vi.fn((arg: unknown) =>
      Array.isArray(arg)
        ? Promise.all(arg as Promise<unknown>[])
        : (arg as (tx: typeof models) => Promise<unknown>)(models)
    ),
  };
  return { prisma };
});

// Mock BullMQ queues so tests don't need a running Redis instance
vi.mock('../jobs/queues', () => ({
  payoutsQueue: { add: vi.fn().mockResolvedValue({}) },
  notificationsQueue: { add: vi.fn().mockResolvedValue({}) },
  invoicesQueue: { add: vi.fn().mockResolvedValue({}) },
}));

// Silence pino logging in tests
vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), child: vi.fn(() => ({ info: vi.fn(), error: vi.fn() })) },
}));

// Mock pino-http so it doesn't fail with the mocked logger
vi.mock('pino-http', () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));
