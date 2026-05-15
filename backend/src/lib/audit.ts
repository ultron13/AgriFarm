import { prisma } from './prisma';

interface AuditEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({ data: entry as never });
  } catch {
    // audit failures must never break the main flow
  }
}
