import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';

async function getUserContactId(user: any): Promise<string | null> {
  if (user.role !== 'user') return null;
  const contact = await prisma.contact.findFirst({ where: { email: user.email } });
  return contact?.id ?? null;
}

export async function listInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.customerId) where.customerId = req.query.customerId;

    if (req.user!.role === 'user') {
      const contactId = await getUserContactId(req.user);
      if (!contactId) {
        return res.json({ data: [], total: 0, page, limit });
      }
      where.customerId = contactId;
    }

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

    const dataWithAmountPaid = data.map((inv) => ({
      ...inv,
      amountPaid: Number(inv.total) - Number(inv.amountDue),
    }));

    res.json({ data: dataWithAmountPaid, total, page, limit });
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
    if (req.user!.role === 'user') {
      const contactId = await getUserContactId(req.user);
      if (!contactId || invoice.customerId !== contactId) {
        throw new AppError('FORBIDDEN', 'You do not have access to this invoice', 403);
      }
    }
    res.json({ data: { ...invoice, amountPaid: Number(invoice.total) - Number(invoice.amountDue) } });
  } catch (err) { next(err); }
}

export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, salesOrderId, date, invoiceDate, dueDate, paymentType, partnerId, paymentVia, lines } = req.body;

    if (!lines || lines.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Invoice must have at least one line', 400);
    }

    const invoiceReference = await generateSequence('INV');
    const invoiceNumber = await generateSequence('INVOICE_NUMBER');
    const total = lines.reduce((sum: number, l: any) => {
      const qty = parseFloat(l.qty || l.quantity);
      const price = parseFloat(l.unitPrice || l.unit_price);
      return sum + qty * price;
    }, 0);

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
        partnerId: partnerId || customerId,
        paymentVia: paymentVia || 'bank',
        total,
        amountDue: total,
        status: 'draft',
        createdBy: req.user!.id,
        invoiceLines: {
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
      include: { invoiceLines: true },
    });

    res.status(201).json({ data: { ...invoice, amountPaid: 0 } });
  } catch (err) { next(err); }
}

export async function updateInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.customerInvoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
    if (invoice.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft invoices can be updated', 400);

    const { customerId, invoiceDate, dueDate, paymentType, partnerId, paymentVia, lines } = req.body;
    const updateData: any = {};
    if (customerId !== undefined) updateData.customerId = customerId;
    if (invoiceDate !== undefined) updateData.invoiceDate = new Date(invoiceDate);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (paymentType !== undefined) updateData.paymentType = paymentType;
    if (partnerId !== undefined) updateData.partnerId = partnerId;
    if (paymentVia !== undefined) updateData.paymentVia = paymentVia;

    if (lines !== undefined) {
      if (!Array.isArray(lines) || lines.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'Invoice must have at least one line', 400);
      }
      const total = lines.reduce((sum: number, l: any) => {
        const qty = parseFloat(l.qty || l.quantity);
        const price = parseFloat(l.unitPrice || l.unit_price);
        return sum + qty * price;
      }, 0);
      updateData.total = total;
      updateData.amountDue = total;
      await prisma.customerInvoiceLine.deleteMany({ where: { invoiceId: req.params.id } });
      await prisma.customerInvoiceLine.createMany({
        data: lines.map((line: any, index: number) => ({
          invoiceId: req.params.id,
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

    const updated = await prisma.customerInvoice.update({
      where: { id: req.params.id },
      data: updateData,
      include: { invoiceLines: true },
    });

    res.json({ data: { ...updated, amountPaid: Number(updated.total) - Number(updated.amountDue) } });
  } catch (err) { next(err); }
}

export async function confirmInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.customerInvoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
    if (invoice.status === 'confirmed') throw new AppError('ALREADY_CONFIRMED', 'Invoice is already confirmed', 400);
    if (invoice.status === 'paid') throw new AppError('ALREADY_PAID', 'Invoice is already paid', 400);
    if (invoice.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft invoices can be confirmed', 400);

    const salesJournal = await prisma.journal.findFirst({ where: { journalType: 'sale' } });
    if (!salesJournal) throw new AppError('CONFIG_ERROR', 'Sale journal not found', 500);
    const arAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Accounts Receivable' } });
    if (!arAccount) throw new AppError('CONFIG_ERROR', 'Accounts Receivable account not found', 500);
    const salesRevenue = await prisma.chartOfAccount.findFirst({ where: { name: 'Sales Revenue' } });
    if (!salesRevenue) throw new AppError('CONFIG_ERROR', 'Sales Revenue account not found', 500);

    const entryNumber = await generateSequence('JE');

    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          entryNumber,
          accountingDate: invoice.invoiceDate,
          journalId: salesJournal.id,
          sourceDocumentType: 'customer_invoice',
          sourceDocumentId: invoice.id,
          status: 'posted',
          createdBy: req.user!.id,
          lines: {
            create: [
              { srNo: 1, accountId: arAccount.id, partnerId: invoice.customerId, debit: Number(invoice.total), credit: 0 },
              { srNo: 2, accountId: salesRevenue.id, partnerId: invoice.customerId, debit: 0, credit: Number(invoice.total) },
            ],
          },
        },
      });

      const updated = await tx.customerInvoice.update({
        where: { id: req.params.id },
        data: { status: 'confirmed', journalEntryId: entry.id },
        include: { invoiceLines: true },
      });

      return updated;
    }, { isolationLevel: 'Serializable' });

    res.json({ data: { ...result, amountPaid: Number(result.total) - Number(result.amountDue) } });
  } catch (err) { next(err); }
}

export async function payInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount, paymentVia, paymentDate } = req.body;

    if (amount === undefined) throw new AppError('INVALID_AMOUNT', 'Amount is required', 400);
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new AppError('INVALID_AMOUNT', 'Amount must be greater than 0', 400);
    }

    const invoice = await prisma.customerInvoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
    if (invoice.status !== 'confirmed') {
      throw new AppError('INVALID_STATUS', 'Only confirmed invoices can be paid', 400);
    }

    if (req.user!.role === 'user') {
      const contactId = await getUserContactId(req.user);
      if (!contactId || invoice.customerId !== contactId) {
        throw new AppError('FORBIDDEN', 'You do not have access to this invoice', 403);
      }
    }

    if (payAmount > Number(invoice.amountDue)) {
      throw new AppError('OVERPAYMENT_NOT_ALLOWED', 'Payment amount cannot exceed amount due', 400);
    }

    const cashAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Cash' } });
    if (!cashAccount) throw new AppError('CONFIG_ERROR', 'Cash account not found', 500);
    const bankAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Bank' } });
    if (!bankAccount) throw new AppError('CONFIG_ERROR', 'Bank account not found', 500);
    const arAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Accounts Receivable' } });
    if (!arAccount) throw new AppError('CONFIG_ERROR', 'Accounts Receivable account not found', 500);

    const targetAccount = paymentVia === 'cash' ? cashAccount : bankAccount;
    const journalType = paymentVia === 'cash' ? 'cash' : 'bank';
    const journal = await prisma.journal.findFirst({ where: { journalType: journalType as any } });
    if (!journal) throw new AppError('CONFIG_ERROR', `Journal not found for type: ${journalType}`, 500);

    const paymentNumber = await generateSequence('PAY');
    const entryNumber = await generateSequence('JE');

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          amount: payAmount,
          paymentVia: (paymentVia || 'bank') as any,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          status: 'successful',
          createdBy: req.user!.id,
        },
      });

      const entry = await tx.journalEntry.create({
        data: {
          entryNumber,
          accountingDate: paymentDate ? new Date(paymentDate) : new Date(),
          journalId: journal.id,
          sourceDocumentType: 'payment',
          sourceDocumentId: payment.id,
          status: 'posted',
          createdBy: req.user!.id,
          lines: {
            create: [
              { srNo: 1, accountId: targetAccount.id, partnerId: invoice.customerId, debit: payAmount, credit: 0 },
              { srNo: 2, accountId: arAccount.id, partnerId: invoice.customerId, debit: 0, credit: payAmount },
            ],
          },
        },
      });

      const newAmountDue = Number(invoice.amountDue) - payAmount;
      await tx.customerInvoice.update({
        where: { id: invoice.id },
        data: { amountDue: newAmountDue, status: newAmountDue <= 0 ? 'paid' : 'confirmed' },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { journalEntryId: entry.id },
      });

      return payment;
    }, { isolationLevel: 'Serializable' });

    res.json({ data: result });
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

export async function printInvoice(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ message: 'Invoice print requested (stub)' });
  } catch (err) { next(err); }
}

export async function sendInvoice(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ message: 'Invoice email sent (stub)' });
  } catch (err) { next(err); }
}