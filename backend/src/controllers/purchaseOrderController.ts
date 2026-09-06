import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';
import { serializePurchaseOrderRow, serializePurchaseOrderDetail } from '../utils/serializers';

export async function listPurchaseOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.vendor_id) where.vendorId = req.query.vendor_id;
    if (req.query.search) {
      where.OR = [
        { poNumber: { contains: req.query.search, mode: 'insensitive' } },
        { vendor: { is: { name: { contains: req.query.search, mode: 'insensitive' } } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vendor: true },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({ purchase_orders: data.map(serializePurchaseOrderRow), total, page, limit });
  } catch (err) { next(err); }
}

export async function getPurchaseOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        purchaseOrderLines: { include: { product: true } },
      },
    });
    if (!order) throw new AppError('NOT_FOUND', 'Purchase order not found', 404);
    res.json(serializePurchaseOrderDetail(order));
  } catch (err) { next(err); }
}

export async function createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.body.vendor_id ?? req.body.vendorId;
    const orderDate = req.body.order_date ?? req.body.date;
    const lines = req.body.lines;

    if (!lines || lines.length === 0) {
      throw new AppError('LINES_REQUIRED', 'Purchase order must have at least one line', 400, 'lines');
    }

    const poNumber = await generateSequence('PO');
    const total = lines.reduce((sum: number, l: any) => {
      const qty = parseFloat(l.quantity ?? l.qty);
      const price = parseFloat(l.unit_price ?? l.unitPrice);
      return sum + qty * price;
    }, 0);

    const order = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId,
        date: new Date(orderDate),
        billDate: new Date(orderDate),
        dueDate: new Date(orderDate),
        total,
        purchaseOrderLines: {
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
      include: { vendor: true },
    });

    res.status(201).json(serializePurchaseOrderRow(order));
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
        include: { vendor: true },
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

    res.json(serializePurchaseOrderRow(result));
  } catch (err) { next(err); }
}

export async function updatePurchaseOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('NOT_FOUND', 'Purchase order not found', 404);
    if (order.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft purchase orders can be updated', 400);

    const vendorId = req.body.vendor_id ?? req.body.vendorId;
    const orderDate = req.body.order_date ?? req.body.date;
    const lines = req.body.lines;
    const updateData: any = {};
    if (vendorId !== undefined) updateData.vendorId = vendorId;
    if (orderDate !== undefined) updateData.date = new Date(orderDate);

    if (lines !== undefined) {
      if (!Array.isArray(lines) || lines.length === 0) {
        throw new AppError('LINES_REQUIRED', 'Purchase order must have at least one line', 400, 'lines');
      }
      const total = lines.reduce((sum: number, l: any) => {
        const qty = parseFloat(l.quantity ?? l.qty);
        const price = parseFloat(l.unit_price ?? l.unitPrice);
        return sum + qty * price;
      }, 0);
      updateData.total = total;
      await prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: req.params.id } });
      await prisma.purchaseOrderLine.createMany({
        data: lines.map((line: any, index: number) => ({
          purchaseOrderId: req.params.id,
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

    const updated = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: updateData,
      include: { vendor: true },
    });

    res.json(serializePurchaseOrderRow(updated));
  } catch (err) { next(err); }
}