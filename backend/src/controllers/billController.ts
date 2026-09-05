import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';

export async function listBills(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.vendorId) where.vendorId = req.query.vendorId;

    const [data, total] = await Promise.all([
      prisma.vendorBill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vendor: true, purchaseOrder: true, billLines: { include: { product: true } } },
      }),
      prisma.vendorBill.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) { next(err); }
}

export async function getBill(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await prisma.vendorBill.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true, partner: true, purchaseOrder: true,
        billLines: { include: { product: true, chartOfAccount: true } },
        payments: true,
      },
    });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    res.json({ data: bill });
  } catch (err) { next(err); }
}

export async function createBill(req: Request, res: Response, next: NextFunction) {
  try {
    const { vendorId, purchaseOrderId, date, billDate, dueDate, paymentType, partnerId, paymentVia, vendorBillNo, lines } = req.body;

    if (!lines || lines.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Bill must have at least one line', 400);
    }

    const billReference = await generateSequence('BILL');
    const total = lines.reduce((sum: number, l: any) => sum + parseFloat(l.qty) * parseFloat(l.unitPrice), 0);

    const bill = await prisma.vendorBill.create({
      data: {
        billReference,
        vendorBillNo: vendorBillNo || null,
        purchaseOrderId: purchaseOrderId || null,
        vendorId,
        date: new Date(date),
        billDate: new Date(billDate),
        dueDate: new Date(dueDate),
        paymentType: paymentType || 'send',
        partnerId,
        paymentVia: paymentVia || 'bank',
        total,
        amountDue: total,
        status: 'draft',
        createdBy: req.user!.id,
        billLines: {
          create: lines.map((line: any, index: number) => ({
            srNo: index + 1,
            productId: line.productId,
            chartOfAccountId: line.accountId,
            budgetAnalyticId: line.analyticId || null,
            qty: parseFloat(line.qty),
            unitPrice: parseFloat(line.unitPrice),
            total: parseFloat(line.qty) * parseFloat(line.unitPrice),
          })),
        },
      },
      include: { billLines: true },
    });

    res.status(201).json({ data: bill });
  } catch (err) { next(err); }
}

export async function confirmBill(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await prisma.vendorBill.findUnique({ where: { id: req.params.id } });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    if (bill.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft bills can be confirmed', 400);

    const purchaseJournal = await prisma.journal.findFirst({ where: { journalType: 'purchase' } });
    const apAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Accounts Payable' } });
    const purchaseExpense = await prisma.chartOfAccount.findFirst({ where: { name: 'Purchase Expense' } });

    let journalEntryId = null;
    if (purchaseJournal && apAccount && purchaseExpense) {
      const entryNumber = await generateSequence('JE');
      const entry = await prisma.journalEntry.create({
        data: {
          entryNumber,
          accountingDate: new Date(),
          journalId: purchaseJournal.id,
          sourceDocumentType: 'vendor_bill',
          sourceDocumentId: bill.id,
          status: 'posted',
          createdBy: req.user!.id,
          lines: {
            create: [
              { accountId: purchaseExpense.id, debit: Number(bill.total), credit: 0, srNo: 1 },
              { accountId: apAccount.id, debit: 0, credit: Number(bill.total), srNo: 2 },
            ],
          },
        },
      });
      journalEntryId = entry.id;
    }

    const updated = await prisma.vendorBill.update({
      where: { id: req.params.id },
      data: { status: 'confirmed', journalEntryId },
      include: { billLines: true },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
}

export async function cancelBill(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await prisma.vendorBill.findUnique({ where: { id: req.params.id } });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    if (bill.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft bills can be cancelled', 400);

    await prisma.vendorBill.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}
