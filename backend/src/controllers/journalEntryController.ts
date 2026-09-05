import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';

export async function listJournalEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.journalId) where.journalId = req.query.journalId;
    if (req.query.from) where.accountingDate = { gte: new Date(req.query.from as string) };
    if (req.query.to) {
      where.accountingDate = where.accountingDate || {};
      where.accountingDate.lte = new Date(req.query.to as string);
    }

    const [data, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { accountingDate: 'desc' },
        include: { lines: true, journal: true },
      }),
      prisma.journalEntry.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) { next(err); }
}

export async function getJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: req.params.id },
      include: { lines: { include: { account: true, partner: true } }, journal: true },
    });
    if (!entry) throw new AppError('NOT_FOUND', 'Journal entry not found', 404);
    res.json({ data: entry });
  } catch (err) { next(err); }
}

export async function createJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountingDate, journalId, sourceDocumentType, sourceDocumentId, lines } = req.body;

    if (!lines || lines.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Journal entry must have at least one line', 400);
    }

    const entryNumber = await generateSequence('JE');

    const entry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        accountingDate: new Date(accountingDate),
        journalId,
        sourceDocumentType: sourceDocumentType || null,
        sourceDocumentId: sourceDocumentId || null,
        status: 'draft',
        createdBy: req.user!.id,
        lines: {
          create: lines.map((line: any, index: number) => ({
            srNo: index + 1,
            accountId: line.accountId,
            partnerId: line.partnerId || null,
            debit: parseFloat(line.debit) || 0,
            credit: parseFloat(line.credit) || 0,
          })),
        },
      },
      include: { lines: true },
    });

    res.status(201).json({ data: entry });
  } catch (err) { next(err); }
}

export async function postJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const entry = await prisma.journalEntry.findUnique({ where: { id: req.params.id }, include: { lines: true } });
    if (!entry) throw new AppError('NOT_FOUND', 'Journal entry not found', 404);
    if (entry.status === 'posted') throw new AppError('ALREADY_POSTED', 'Journal entry is already posted', 400);

    const totalDebit = entry.lines.reduce((sum, l) => sum + Number(l.debit), 0);
    const totalCredit = entry.lines.reduce((sum, l) => sum + Number(l.credit), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new AppError('IMBALANCED_ENTRY', 'Total debit must equal total credit', 400);
    }

    const updated = await prisma.journalEntry.update({
      where: { id: req.params.id },
      data: { status: 'posted' },
      include: { lines: true },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
}
