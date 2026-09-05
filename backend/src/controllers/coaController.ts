import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { serializeChartOfAccount } from '../utils/serializers';

export async function listCOA(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await prisma.chartOfAccount.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
    res.json(data.map(serializeChartOfAccount));
  } catch (err) { next(err); }
}

export async function getCOA(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.chartOfAccount.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!item) throw new AppError('NOT_FOUND', 'Account not found', 404);
    res.json(serializeChartOfAccount(item));
  } catch (err) { next(err); }
}

export async function createCOA(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.chartOfAccount.create({
      data: {
        name: req.body.name,
        accountType: req.body.account_type,
        journalType: req.body.journal_type ?? null,
      },
    });
    res.status(201).json(serializeChartOfAccount(item));
  } catch (err) { next(err); }
}

export async function updateCOA(req: Request, res: Response, next: NextFunction) {
  try {
    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.account_type !== undefined) data.accountType = req.body.account_type;
    if (req.body.journal_type !== undefined) data.journalType = req.body.journal_type;
    const item = await prisma.chartOfAccount.update({ where: { id: req.params.id }, data });
    res.json(serializeChartOfAccount(item));
  } catch (err) { next(err); }
}

export async function deleteCOA(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.chartOfAccount.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.status(204).send();
  } catch (err) { next(err); }
}