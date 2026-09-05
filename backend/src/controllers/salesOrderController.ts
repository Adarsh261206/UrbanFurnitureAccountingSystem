import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';
import { serializeSalesOrderRow } from '../utils/serializers';

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
    if (req.query.customer_id) where.customerId = req.query.customer_id;

    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    res.json({ sales_orders: data.map(serializeSalesOrderRow), total, page, limit });
  } catch (err) { next(err); }
}

export async function getSalesOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: { customer: true },
    });
    if (!order) throw new AppError('NOT_FOUND', 'Sales order not found', 404);
    res.json(serializeSalesOrderRow(order));
  } catch (err) { next(err); }
}

export async function createSalesOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.body.customer_id ?? req.body.customerId;
    const orderDate = req.body.order_date ?? req.body.date;
    const lines = req.body.lines;

    if (!lines || lines.length === 0) {
      throw new AppError('LINES_REQUIRED', 'Sales order must have at least one line', 400, 'lines');
    }

    const soNumber = await generateSequence('SO');
    const total = lines.reduce((sum: number, l: any) => {
      const qty = parseFloat(l.quantity ?? l.qty);
      const price = parseFloat(l.unit_price ?? l.unitPrice);
      return sum + qty * price;
    }, 0);

    const order = await prisma.salesOrder.create({
      data: {
        soNumber,
        customerId,
        date: new Date(orderDate),
        invoiceDate: new Date(orderDate),
        dueDate: new Date(orderDate),
        total,
        salesOrderLines: {
          create: lines.map((line: any, index: number) => ({
            srNo: index + 1,
            productId: line.product_id ?? line.productId,
            chartOfAccountId: line.account_id ?? line.accountId ?? line.chart_of_account_id,
            budgetAnalyticId: line.analytical_id ?? line.analyticId ?? line.budget_analytic_id ?? null,
            qty: parseFloat(line.quantity ?? line.qty),
            unitPrice: parseFloat(line.unit_price ?? line.unitPrice),
            total: parseFloat(line.quantity ?? line.qty) * parseFloat(line.unit_price ?? line.unitPrice),
          })),
        },
      },
      include: { customer: true },
    });

    res.status(201).json(serializeSalesOrderRow(order));
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
        include: { customer: true },
      });

      await tx.journalEntry.create({
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

      return updated;
    }, { isolationLevel: 'Serializable' });

    res.json(serializeSalesOrderRow(result));
  } catch (err) { next(err); }
}

export async function updateSalesOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('NOT_FOUND', 'Sales order not found', 404);
    if (order.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft sales orders can be updated', 400);

    const customerId = req.body.customer_id ?? req.body.customerId;
    const orderDate = req.body.order_date ?? req.body.date;
    const lines = req.body.lines;
    const updateData: any = {};
    if (customerId !== undefined) updateData.customerId = customerId;
    if (orderDate !== undefined) updateData.date = new Date(orderDate);

    if (lines !== undefined) {
      if (!Array.isArray(lines) || lines.length === 0) {
        throw new AppError('LINES_REQUIRED', 'Sales order must have at least one line', 400, 'lines');
      }
      const total = lines.reduce((sum: number, l: any) => {
        const qty = parseFloat(l.quantity ?? l.qty);
        const price = parseFloat(l.unit_price ?? l.unitPrice);
        return sum + qty * price;
      }, 0);
      updateData.total = total;
      await prisma.salesOrderLine.deleteMany({ where: { salesOrderId: req.params.id } });
      await prisma.salesOrderLine.createMany({
        data: lines.map((line: any, index: number) => ({
          salesOrderId: req.params.id,
          srNo: index + 1,
          productId: line.product_id ?? line.productId,
          chartOfAccountId: line.account_id ?? line.accountId ?? line.chart_of_account_id,
          budgetAnalyticId: line.analytical_id ?? line.analyticId ?? line.budget_analytic_id ?? null,
          qty: parseFloat(line.quantity ?? line.qty),
          unitPrice: parseFloat(line.unit_price ?? line.unitPrice),
          total: parseFloat(line.quantity ?? line.qty) * parseFloat(line.unit_price ?? line.unitPrice),
        })),
      });
    }

    const updated = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: updateData,
      include: { customer: true },
    });

    res.json(serializeSalesOrderRow(updated));
  } catch (err) { next(err); }
}