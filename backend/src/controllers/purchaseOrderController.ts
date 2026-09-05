import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';

export async function listPurchaseOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.vendorId) where.vendorId = req.query.vendorId;

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vendor: true, purchaseOrderLines: { include: { product: true } } },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) { next(err); }
}

export async function getPurchaseOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        purchaseOrderLines: { include: { product: true, chartOfAccount: true, budgetAnalytic: true } },
      },
    });
    if (!order) throw new AppError('NOT_FOUND', 'Purchase order not found', 404);
    res.json({ data: order });
  } catch (err) { next(err); }
}

export async function createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { vendorId, date, billDate, dueDate, lines } = req.body;

    if (!lines || lines.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Purchase order must have at least one line', 400);
    }

    const poNumber = await generateSequence('PO');
    const total = lines.reduce((sum: number, l: any) => sum + parseFloat(l.qty) * parseFloat(l.unitPrice), 0);

    const order = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId,
        date: new Date(date),
        billDate: new Date(billDate),
        dueDate: new Date(dueDate),
        total,
        purchaseOrderLines: {
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
      include: { purchaseOrderLines: true },
    });

    res.status(201).json({ data: order });
  } catch (err) { next(err); }
}

export async function confirmPurchaseOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('NOT_FOUND', 'Purchase order not found', 404);
    if (order.status === 'confirmed') throw new AppError('ALREADY_CONFIRMED', 'Purchase order is already confirmed', 400);

    const updated = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { status: 'confirmed' },
      include: { purchaseOrderLines: true },
    });

    const purchaseJournal = await prisma.journal.findFirst({ where: { journalType: 'purchase' } });
    const apAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Accounts Payable' } });
    const purchaseExpense = await prisma.chartOfAccount.findFirst({ where: { name: 'Purchase Expense' } });

    if (purchaseJournal && apAccount && purchaseExpense) {
      const entryNumber = await generateSequence('JE');
      await prisma.journalEntry.create({
        data: {
          entryNumber,
          accountingDate: new Date(),
          journalId: purchaseJournal.id,
          sourceDocumentType: 'purchase_order',
          sourceDocumentId: order.id,
          status: 'posted',
          createdBy: req.user!.id,
          lines: {
            create: [
              { accountId: purchaseExpense.id, debit: Number(order.total), credit: 0, srNo: 1 },
              { accountId: apAccount.id, debit: 0, credit: Number(order.total), srNo: 2 },
            ],
          },
        },
      });
    }

    res.json({ data: updated });
  } catch (err) { next(err); }
}
