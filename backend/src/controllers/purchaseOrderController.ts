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
    const total = lines.reduce((sum: number, l: any) => {
      const qty = parseFloat(l.qty || l.quantity);
      const price = parseFloat(l.unitPrice || l.unit_price);
      return sum + qty * price;
    }, 0);

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
            productId: line.productId || line.product_id,
            chartOfAccountId: line.accountId || line.chart_of_account_id,
            budgetAnalyticId: line.analyticId || line.budget_analytic_id || null,
            qty: parseFloat(line.qty || line.quantity),
            unitPrice: parseFloat(line.unitPrice || line.unit_price),
            total: parseFloat(line.qty || line.quantity) * parseFloat(line.unitPrice || line.unit_price),
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

    const journal = await prisma.journal.findFirst({ where: { journalType: 'purchase' } });
    if (!journal) throw new AppError('CONFIG_ERROR', 'Purchase journal not found', 500);
    const apAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Accounts Payable' } });
    if (!apAccount) throw new AppError('CONFIG_ERROR', 'Accounts Payable account not found', 500);
    const purchaseExpense = await prisma.chartOfAccount.findFirst({ where: { name: 'Purchase Expense' } });
    if (!purchaseExpense) throw new AppError('CONFIG_ERROR', 'Purchase Expense account not found', 500);

    const entryNumber = await generateSequence('JE');

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({
        where: { id: req.params.id },
        data: { status: 'confirmed' },
        include: { purchaseOrderLines: true },
      });

      await tx.journalEntry.create({
        data: {
          entryNumber,
          accountingDate: new Date(),
          journalId: journal.id,
          sourceDocumentType: 'purchase_order',
          sourceDocumentId: order.id,
          status: 'posted',
          createdBy: req.user!.id,
          lines: {
            create: [
              { srNo: 1, accountId: purchaseExpense.id, partnerId: order.vendorId, debit: Number(order.total), credit: 0 },
              { srNo: 2, accountId: apAccount.id, partnerId: order.vendorId, debit: 0, credit: Number(order.total) },
            ],
          },
        },
      });

      return updated;
    }, { isolationLevel: 'Serializable' });

    res.json({ data: result });
  } catch (err) { next(err); }
}

export async function updatePurchaseOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('NOT_FOUND', 'Purchase order not found', 404);
    if (order.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft purchase orders can be updated', 400);

    const { vendorId, date, billDate, dueDate, lines } = req.body;
    const updateData: any = {};
    if (vendorId !== undefined) updateData.vendorId = vendorId;
    if (date !== undefined) updateData.date = new Date(date);
    if (billDate !== undefined) updateData.billDate = new Date(billDate);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    if (lines !== undefined) {
      if (!Array.isArray(lines) || lines.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'Purchase order must have at least one line', 400);
      }
      const total = lines.reduce((sum: number, l: any) => {
        const qty = parseFloat(l.qty || l.quantity);
        const price = parseFloat(l.unitPrice || l.unit_price);
        return sum + qty * price;
      }, 0);
      updateData.total = total;
      await prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: req.params.id } });
      await prisma.purchaseOrderLine.createMany({
        data: lines.map((line: any, index: number) => ({
          purchaseOrderId: req.params.id,
          srNo: index + 1,
          productId: line.productId || line.product_id,
          chartOfAccountId: line.accountId || line.chart_of_account_id,
          budgetAnalyticId: line.analyticId || line.budget_analytic_id || null,
          qty: parseFloat(line.qty || line.quantity),
          unitPrice: parseFloat(line.unitPrice || line.unit_price),
          total: parseFloat(line.qty || line.quantity) * parseFloat(line.unitPrice || line.unit_price),
        })),
      });
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: updateData,
      include: { purchaseOrderLines: true },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
}