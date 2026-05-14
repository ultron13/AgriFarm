import { vi } from 'vitest';

// Mock Prisma globally so tests don't hit the DB
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    farmer: { findUnique: vi.fn(), findMany: vi.fn() },
    buyer: { findUnique: vi.fn() },
    tender: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    tenderBid: { create: vi.fn(), update: vi.fn() },
    complianceDoc: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), upsert: vi.fn() },
    produceListing: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    order: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    invoice: { findUnique: vi.fn(), update: vi.fn() },
    product: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

// Silence pino logging in tests
vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), child: vi.fn(() => ({ info: vi.fn(), error: vi.fn() })) },
}));

// Mock pino-http so it doesn't fail with the mocked logger
vi.mock('pino-http', () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));
