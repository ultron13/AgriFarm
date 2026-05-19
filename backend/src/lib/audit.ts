import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

interface AuditEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ip?: string;
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch {
    // audit failures must never break the main flow
  }
}
