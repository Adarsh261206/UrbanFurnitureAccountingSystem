import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { serializeJournal } from '../utils/serializers';

export async function listJournals(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await prisma.journal.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
    res.json(data.map(serializeJournal));
  } catch (err) { next(err); }
}

export async function getJournal(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.journal.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!item) throw new AppError('NOT_FOUND', 'Journal not found', 404);
    res.json(serializeJournal(item));
  } catch (err) { next(err); }
}

export async function createJournal(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.journal.create({
      data: {
        name: req.body.name,
        journalType: req.body.journal_type,
        defaultAccountId: req.body.default_account_id,
      },
    });
    res.status(201).json(serializeJournal(item));
  } catch (err) { next(err); }
}

export async function updateJournal(req: Request, res: Response, next: NextFunction) {
  try {
    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.journal_type !== undefined) data.journalType = req.body.journal_type;
    if (req.body.default_account_id !== undefined) data.defaultAccountId = req.body.default_account_id;
    const item = await prisma.journal.update({ where: { id: req.params.id }, data });
    res.json(serializeJournal(item));
  } catch (err) { next(err); }
}

export async function deleteJournal(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.journal.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.status(204).send();
  } catch (err) { next(err); }
}