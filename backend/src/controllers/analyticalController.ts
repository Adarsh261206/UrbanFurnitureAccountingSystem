import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { serializeAnalytical } from '../utils/serializers';

export async function listAnalytics(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await prisma.analytical.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data.map(serializeAnalytical));
  } catch (err) { next(err); }
}

export async function getAnalytical(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.analytical.findUnique({ where: { id: req.params.id } });
    if (!item) throw new AppError('NOT_FOUND', 'Analytical account not found', 404);
    res.json(serializeAnalytical(item));
  } catch (err) { next(err); }
}

export async function createAnalytical(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.analytical.create({
      data: {
        name: req.body.name,
        responsibleId: req.body.responsible_id,
        startDate: new Date(req.body.start_date),
        toDate: new Date(req.body.to_date),
        endDate: new Date(req.body.end_date),
        analyticAccount: req.body.analytic_account,
      },
    });
    res.status(201).json(serializeAnalytical(item));
  } catch (err) { next(err); }
}

export async function updateAnalytical(req: Request, res: Response, next: NextFunction) {
  try {
    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.responsible_id !== undefined) data.responsibleId = req.body.responsible_id;
    if (req.body.start_date !== undefined) data.startDate = new Date(req.body.start_date);
    if (req.body.to_date !== undefined) data.toDate = new Date(req.body.to_date);
    if (req.body.end_date !== undefined) data.endDate = new Date(req.body.end_date);
    if (req.body.analytic_account !== undefined) data.analyticAccount = req.body.analytic_account;

    const item = await prisma.analytical.update({ where: { id: req.params.id }, data });
    res.json(serializeAnalytical(item));
  } catch (err) { next(err); }
}

export async function deleteAnalytical(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.analytical.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}