import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';

async function getRequiredAccounts(journalType: string, documentType: string) {
  const journal = await prisma.journal.findFirst({ where: { journalType: journalType as any } });
  if (!journal) throw new AppError('CONFIG_ERROR', `Journal not found for type: ${journalType}`, 500);

  let debitAccountName: string;
  let creditAccountName: string;

  if (documentType === 'so') {
    debitAccountName = 'Accounts Receivable';
    creditAccountName = 'Sales Revenue';
  } else {
    throw new AppError('CONFIG_ERROR', `Unknown document type: ${documentType}`, 500);
  }

  const debitAccount = await prisma.chartOfAccount.findFirst({ where: { name: debitAccountName } });
  if (!debitAccount) throw new AppError('CONFIG_ERROR', `Account not found: ${debitAccountName}`, 500);

  const creditAccount = await prisma.chartOfAccount.findFirst({ where: { name: creditAccountName } });
  if (!creditAccount) throw new AppError('CONFIG_ERROR', `Account not found: ${creditAccountName}`, 500);

  return { journal, debitAccount, creditAccount };
}

export async function listSalesOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.customerId) where.customerId = req.query.customerId;

    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, salesOrderLines: { include: { product: true } } },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) { next(err); }
}

export async function getSalesOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        salesOrderLines: { include: { product: true, chartOfAccount: true, budgetAnalytic: true } },
      },
    });
    if (!order) throw new AppError('NOT_FOUND', 'Sales order not found', 404);
    res.json({ data: order });
  } catch (err) { next(err); }
}

export async function createSalesOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, date, invoiceDate, dueDate, lines } = req.body;

    if (!lines || lines.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Sales order must have at least one line', 400);
    }

    const soNumber = await generateSequence('SO');
    const total = lines.reduce((sum: number, l: any) => {
      const qty = parseFloat(l.qty || l.quantity);
      const price = parseFloat(l.unitPrice || l.unit_price);
      return sum + qty * price;
    }, 0);

    const order = await prisma.salesOrder.create({
      data: {
        soNumber,
        customerId,
        date: new Date(date),
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        total,
        salesOrderLines: {
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
      include: { salesOrderLines: true },
    });

    res.status(201).json({ data: order });
  } catch (err) { next(err); }
}

export async function confirmSalesOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('NOT_FOUND', 'Sales order not found', 404);
    if (order.status === 'confirmed') throw new AppError('ALREADY_CONFIRMED', 'Sales order is already confirmed', 400);

    const { journal, debitAccount, creditAccount } = await getRequiredAccounts('sale', 'so');

    const entryNumber = await generateSequence('JE');

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.salesOrder.update({
        where: { id: req.params.id },
        data: { status: 'confirmed' },
        include: { salesOrderLines: true },
      });

      const entry = await tx.journalEntry.create({
        data: {
          entryNumber,
          accountingDate: new Date(),
          journalId: journal.id,
          sourceDocumentType: 'sales_order',
          sourceDocumentId: order.id,
          status: 'posted',
          createdBy: req.user!.id,
          lines: {
            create: [
              { srNo: 1, accountId: debitAccount.id, partnerId: order.customerId, debit: Number(order.total), credit: 0 },
              { srNo: 2, accountId: creditAccount.id, partnerId: order.customerId, debit: 0, credit: Number(order.total) },
            ],
          },
        },
      });

      return { updated, entry };
    }, { isolationLevel: 'Serializable' });

    res.json({ data: result.updated });
  } catch (err) { next(err); }
}

export async function updateSalesOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('NOT_FOUND', 'Sales order not found', 404);
    if (order.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft sales orders can be updated', 400);

    const { customerId, date, invoiceDate, dueDate, lines } = req.body;
    const updateData: any = {};
    if (customerId !== undefined) updateData.customerId = customerId;
    if (date !== undefined) updateData.date = new Date(date);
    if (invoiceDate !== undefined) updateData.invoiceDate = new Date(invoiceDate);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    if (lines !== undefined) {
      if (!Array.isArray(lines) || lines.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'Sales order must have at least one line', 400);
      }
      const total = lines.reduce((sum: number, l: any) => {
        const qty = parseFloat(l.qty || l.quantity);
        const price = parseFloat(l.unitPrice || l.unit_price);
        return sum + qty * price;
      }, 0);
      updateData.total = total;
      await prisma.salesOrderLine.deleteMany({ where: { salesOrderId: req.params.id } });
      await prisma.salesOrderLine.createMany({
        data: lines.map((line: any, index: number) => ({
          salesOrderId: req.params.id,
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

    const updated = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: updateData,
      include: { salesOrderLines: true },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
}