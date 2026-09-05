import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';
import { serializeJournalEntryDetail, serializeJournalEntryRow } from '../utils/serializers';

export async function listJournalEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.journal_id) where.journalId = req.query.journal_id;
    if (req.query.date_from) where.accountingDate = { gte: new Date(req.query.date_from as string) };
    if (req.query.date_to) {
      where.accountingDate = where.accountingDate || {};
      where.accountingDate.lte = new Date(req.query.date_to as string);
    }

    const [data, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { accountingDate: 'desc' },
        include: { journal: true },
      }),
      prisma.journalEntry.count({ where }),
    ]);

    res.json({ journal_entries: data.map(serializeJournalEntryRow), total, page, limit });
  } catch (err) { next(err); }
}

export async function getJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: req.params.id },
      include: { journal: true, lines: true },
    });
    if (!entry) throw new AppError('NOT_FOUND', 'Journal entry not found', 404);
    res.json(serializeJournalEntryDetail(entry));
  } catch (err) { next(err); }
}

export async function createJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const journalId = req.body.journal_id ?? req.body.journalId;
    const accountingDate = req.body.accounting_date ?? req.body.accountingDate;
    const lines = req.body.lines;

    if (!lines || lines.length === 0) {
      throw new AppError('LINES_REQUIRED', 'Journal entry must have at least one line', 400, 'lines');
    }

    const totalDebit = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.debit) || 0), 0);
    const totalCredit = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.credit) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new AppError('UNBALANCED_JOURNAL', 'Debit and credit totals do not match', 400, 'lines');
    }

    for (const line of lines) {
      if (parseFloat(line.debit) < 0 || parseFloat(line.credit) < 0) {
        throw new AppError('NEGATIVE_AMOUNT', 'Debit and credit must be non-negative', 400);
      }
      if ((parseFloat(line.debit) || 0) <= 0 && (parseFloat(line.credit) || 0) <= 0) {
        throw new AppError('ZERO_AMOUNT', 'Each line must have a non-zero debit or credit', 400);
      }
    }

    const entryNumber = await generateSequence('JE');

    const entry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        accountingDate: new Date(accountingDate),
        journalId,
        sourceDocumentType: req.body.reference ? 'manual' : null,
        sourceDocumentId: req.body.reference ? null : null,
        status: 'posted',
        createdBy: req.user!.id,
        lines: {
          create: lines.map((line: any, index: number) => ({
            srNo: index + 1,
            accountId: line.account_id ?? line.accountId,
            partnerId: line.partner_id ?? line.partnerId ?? null,
            debit: parseFloat(line.debit) || 0,
            credit: parseFloat(line.credit) || 0,
          })),
        },
      },
      include: { journal: true, lines: true },
    });

    res.status(201).json(serializeJournalEntryDetail(entry));
  } catch (err) { next(err); }
}

export async function postJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const entry = await prisma.journalEntry.findUnique({ where: { id: req.params.id }, include: { journal: true, lines: true } });
    if (!entry) throw new AppError('NOT_FOUND', 'Journal entry not found', 404);
    if (entry.status === 'posted') throw new AppError('ALREADY_POSTED', 'Journal entry is already posted', 400);

    const totalDebit = entry.lines.reduce((sum, l) => sum + Number(l.debit), 0);
    const totalCredit = entry.lines.reduce((sum, l) => sum + Number(l.credit), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new AppError('UNBALANCED_JOURNAL', 'Debit and credit totals do not match', 400);
    }

    const updated = await prisma.journalEntry.update({
      where: { id: req.params.id },
      data: { status: 'posted' },
      include: { journal: true, lines: true },
    });

    res.json(serializeJournalEntryDetail(updated));
  } catch (err) { next(err); }
}