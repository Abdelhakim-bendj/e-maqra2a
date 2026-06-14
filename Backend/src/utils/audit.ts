import { Request } from 'express';
import prisma from './prisma';

const db = prisma as typeof prisma & {
  auditLog: {
    create: (args: unknown) => Promise<unknown>;
  };
};

export async function writeAuditLog(
  req: Request,
  action: string,
  options: {
    userId?: string;
    entity?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: options.userId,
        action,
        entity: options.entity,
        entityId: options.entityId,
        metadata: options.metadata,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
