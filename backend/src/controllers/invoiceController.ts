import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';
import { serializeInvoiceDetail, serializeInvoiceListRow } from '../utils/serializers';

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
    if (req.query.customer_id) where.customerId = req.query.customer_id;

    if (req.user!.role === 'user') {
      const contactId = await getUserContactId(req.user);
      if (!contactId) {
        return res.json({ invoices: [], total: 0, page, limit });
      }
      where.customerId = contactId;
    }

    const [data, total] = await Promise.all([
      prisma.customerInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
      prisma.customerInvoice.count({ where }),
    ]);

    res.json({ invoices: data.map(serializeInvoiceListRow), total, page, limit });
  } catch (err) { next(err); }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true, partner: true,
        invoiceLines: { include: { product: true } },
      },
    });
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
    if (req.user!.role === 'user') {
      const contactId = await getUserContactId(req.user);
      if (!contactId || invoice.customerId !== contactId) {
        throw new AppError('FORBIDDEN', 'You do not have access to this invoice', 403);
      }
    }
    res.json(serializeInvoiceDetail(invoice));
  } catch (err) { next(err); }
}

export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.body.customer_id ?? req.body.customerId;
    const salesOrderId = req.body.sales_order_id ?? req.body.salesOrderId ?? null;
    const invoiceDate = req.body.invoice_date ?? req.body.invoiceDate;
    const dueDate = req.body.due_date ?? req.body.dueDate;
    const date = req.body.date ?? invoiceDate;
    const lines = req.body.lines;

    if (!lines || lines.length === 0) {
      throw new AppError('LINES_REQUIRED', 'Invoice must have at least one line', 400, 'lines');
    }

    const invoiceReference = await generateSequence('INV');
    const invoiceNumber = await generateSequence('INVOICE_NUMBER');
    const total = lines.reduce((sum: number, l: any) => {
      const qty = parseFloat(l.quantity ?? l.qty);
      const price = parseFloat(l.unit_price ?? l.unitPrice);
      return sum + qty * price;
    }, 0);

    const invoice = await prisma.customerInvoice.create({
      data: {
        invoiceReference,
        invoiceNumber,
        salesOrderId,
        customerId,
        date: new Date(date),
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        paymentType: req.body.payment_type ?? 'receive',
        partnerId: req.body.partner_id ?? customerId,
        paymentVia: req.body.payment_via ?? 'bank',
        total,
        amountDue: total,
        status: 'draft',
        createdBy: req.user!.id,
        invoiceLines: {
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
      include: { customer: true, partner: true, invoiceLines: { include: { product: true } } },
    });

    res.status(201).json(serializeInvoiceDetail(invoice));
  } catch (err) { next(err); }
}

export async function updateInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.customerInvoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
    if (invoice.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft invoices can be updated', 400);

    const updateData: any = {};
    if (req.body.customer_id !== undefined) updateData.customerId = req.body.customer_id;
    if (req.body.invoice_date !== undefined) updateData.invoiceDate = new Date(req.body.invoice_date);
    if (req.body.due_date !== undefined) updateData.dueDate = new Date(req.body.due_date);
    if (req.body.payment_type !== undefined) updateData.paymentType = req.body.payment_type;
    if (req.body.partner_id !== undefined) updateData.partnerId = req.body.partner_id;
    if (req.body.payment_via !== undefined) updateData.paymentVia = req.body.payment_via;

    if (req.body.lines !== undefined) {
      const lines = req.body.lines;
      if (!Array.isArray(lines) || lines.length === 0) {
        throw new AppError('LINES_REQUIRED', 'Invoice must have at least one line', 400, 'lines');
      }
      const total = lines.reduce((sum: number, l: any) => {
        const qty = parseFloat(l.quantity ?? l.qty);
        const price = parseFloat(l.unit_price ?? l.unitPrice);
        return sum + qty * price;
      }, 0);
      updateData.total = total;
      updateData.amountDue = total;
      await prisma.customerInvoiceLine.deleteMany({ where: { invoiceId: req.params.id } });
      await prisma.customerInvoiceLine.createMany({
        data: lines.map((line: any, index: number) => ({
          invoiceId: req.params.id,
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

    const updated = await prisma.customerInvoice.update({
      where: { id: req.params.id },
      data: updateData,
      include: { customer: true, partner: true, invoiceLines: { include: { product: true } } },
    });

    res.json(serializeInvoiceDetail(updated));
  } catch (err) { next(err); }
}

export async function confirmInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.customerInvoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
    if (invoice.status === 'confirmed') throw new AppError('ALREADY_CONFIRMED', 'Invoice is already confirmed', 400);
    if (invoice.status === 'paid') throw new AppError('ALREADY_PAID', 'Invoice is already paid', 400);
    if (invoice.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft invoices can be confirmed', 400);

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
        include: { customer: true, partner: true, invoiceLines: { include: { product: true } } },
      });

      return updated;
    }, { isolationLevel: 'Serializable' });

    res.json(serializeInvoiceDetail(result));
  } catch (err) { next(err); }
}

export async function payInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const amount = req.body.amount;
    const paymentVia = req.body.payment_via ?? req.body.paymentVia ?? 'bank';
    const paymentDate = req.body.payment_date ?? req.body.paymentDate;

    if (amount === undefined) throw new AppError('INVALID_AMOUNT', 'Amount is required', 400, 'amount');
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new AppError('INVALID_AMOUNT', 'Amount must be greater than 0', 400, 'amount');
    }

    const invoice = await prisma.customerInvoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
    if (invoice.status === 'paid') throw new AppError('ALREADY_PAID', 'Invoice is already paid', 400);
    if (invoice.status !== 'confirmed') {
      throw new AppError('CONFIRMED_REQUIRED', 'Only confirmed invoices can be paid', 400);
    }

    if (req.user!.role === 'user') {
      const contactId = await getUserContactId(req.user);
      if (!contactId || invoice.customerId !== contactId) {
        throw new AppError('OWNERSHIP_REQUIRED', 'You do not have access to this invoice', 403);
      }
    }

    if (payAmount > Number(invoice.amountDue)) {
      throw new AppError('OVERPAYMENT_NOT_ALLOWED', 'Payment amount exceeds the amount due', 400, 'amount');
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

    const updated = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          amount: payAmount,
          paymentVia: paymentVia as any,
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
      const inv = await tx.customerInvoice.update({
        where: { id: invoice.id },
        data: { amountDue: newAmountDue, status: newAmountDue <= 0 ? 'paid' : 'confirmed' },
        include: { customer: true, partner: true, invoiceLines: { include: { product: true } } },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { journalEntryId: entry.id },
      });

      return inv;
    }, { isolationLevel: 'Serializable' });

    res.json(serializeInvoiceDetail(updated));
  } catch (err) { next(err); }
}

export async function cancelInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: req.params.id },
      include: { customer: true, partner: true, invoiceLines: { include: { product: true } } },
    });
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
    if (invoice.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft invoices can be cancelled', 400);

    await prisma.customerInvoice.delete({ where: { id: req.params.id } });
    res.json(serializeInvoiceDetail(invoice));
  } catch (err) { next(err); }
}

export async function printInvoice(_req: Request, res: Response, next: NextFunction) {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.send(Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF\n'));
  } catch (err) { next(err); }
}

export async function sendInvoice(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ message: 'Invoice email sent (stub)' });
  } catch (err) { next(err); }
}