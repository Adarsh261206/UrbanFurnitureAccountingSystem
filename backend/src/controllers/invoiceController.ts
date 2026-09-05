import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';

export async function listInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.customerId) where.customerId = req.query.customerId;

    const [data, total] = await Promise.all([
      prisma.customerInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, salesOrder: true, invoiceLines: { include: { product: true } } },
      }),
      prisma.customerInvoice.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) { next(err); }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true, partner: true, salesOrder: true,
        invoiceLines: { include: { product: true, chartOfAccount: true } },
        payments: true,
      },
    });
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
    res.json({ data: invoice });
  } catch (err) { next(err); }
}

export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, salesOrderId, date, invoiceDate, dueDate, paymentType, partnerId, paymentVia, lines } = req.body;

    if (!lines || lines.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Invoice must have at least one line', 400);
    }

    const invoiceReference = await generateSequence('INV');
    const invoiceNumber = invoiceReference;
    const total = lines.reduce((sum: number, l: any) => sum + parseFloat(l.qty) * parseFloat(l.unitPrice), 0);

    const invoice = await prisma.customerInvoice.create({
      data: {
        invoiceReference,
        invoiceNumber,
        salesOrderId: salesOrderId || null,
        customerId,
        date: new Date(date),
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        paymentType: paymentType || 'receive',
        partnerId,
        paymentVia: paymentVia || 'bank',
        total,
        amountDue: total,
        status: 'draft',
        createdBy: req.user!.id,
        invoiceLines: {
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
      include: { invoiceLines: true },
    });

    res.status(201).json({ data: invoice });
  } catch (err) { next(err); }
}

export async function confirmInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.customerInvoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
    if (invoice.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft invoices can be confirmed', 400);

    const salesJournal = await prisma.journal.findFirst({ where: { journalType: 'sale' } });
    const arAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Accounts Receivable' } });
    const salesRevenue = await prisma.chartOfAccount.findFirst({ where: { name: 'Sales Revenue' } });

    let journalEntryId = null;
    if (salesJournal && arAccount && salesRevenue) {
      const entryNumber = await generateSequence('JE');
      const entry = await prisma.journalEntry.create({
        data: {
          entryNumber,
          accountingDate: new Date(),
          journalId: salesJournal.id,
          sourceDocumentType: 'customer_invoice',
          sourceDocumentId: invoice.id,
          status: 'posted',
          createdBy: req.user!.id,
          lines: {
            create: [
              { accountId: arAccount.id, debit: Number(invoice.total), credit: 0, srNo: 1 },
              { accountId: salesRevenue.id, debit: 0, credit: Number(invoice.total), srNo: 2 },
            ],
          },
        },
      });
      journalEntryId = entry.id;
    }

    const updated = await prisma.customerInvoice.update({
      where: { id: req.params.id },
      data: { status: 'confirmed', journalEntryId },
      include: { invoiceLines: true },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
}

export async function cancelInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.customerInvoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
    if (invoice.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft invoices can be cancelled', 400);

    await prisma.customerInvoice.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}
