import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.entity) where.entity = req.query.entity;
    if (req.query.action) where.action = req.query.action;
    if (req.query.user_id) where.userId = req.query.user_id;
    if (req.query.from_date || req.query.to_date) {
      where.createdAt = {};
      if (req.query.from_date) where.createdAt.gte = new Date(req.query.from_date as string);
      if (req.query.to_date) where.createdAt.lte = new Date(req.query.to_date as string);
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, loginId: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const logs = data.map((log) => ({
      id: log.id,
      user_name: log.user?.name ?? log.user?.loginId ?? 'System',
      action: log.action,
      entity: log.entity,
      entity_id: log.entityId,
      entity_name: log.entityName,
      ip_address: log.ipAddress,
      created_at: log.createdAt.toISOString(),
    }));

    res.json({ logs, total, page, limit });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('INVALID_ID', 'Invalid audit log ID', 400);

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: { user: { select: { name: true, loginId: true } } },
    });

    if (!log) throw new AppError('NOT_FOUND', 'Audit log not found', 404);

    res.json({
      id: log.id,
      user_name: log.user?.name ?? log.user?.loginId ?? 'System',
      user_id: log.userId,
      action: log.action,
      entity: log.entity,
      entity_id: log.entityId,
      entity_name: log.entityName,
      old_values: log.oldValues,
      new_values: log.newValues,
      ip_address: log.ipAddress,
      user_agent: log.userAgent,
      created_at: log.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
