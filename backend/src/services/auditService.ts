import { Request } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';

export async function logAudit(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  entityName?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  req?: Request;
}): Promise<void> {
  try {
    const ipAddress = params.req
      ? (params.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        ?? params.req.ip
        ?? undefined
      : undefined;
    const userAgent = params.req?.headers['user-agent'] ?? undefined;

    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? undefined,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? undefined,
        entityName: params.entityName ?? undefined,
        oldValues: params.oldValues as unknown as Prisma.InputJsonValue ?? undefined,
        newValues: params.newValues as unknown as Prisma.InputJsonValue ?? undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
