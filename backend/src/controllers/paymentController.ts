import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';
import { serializePayment } from '../utils/serializers';
import { logAudit } from '../services/auditService';

export async function listPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.invoice_id) where.invoiceId = req.query.invoice_id;
    if (req.query.vendor_bill_id) where.vendorBillId = req.query.vendor_bill_id;
    if (req.query.search) {
      where.OR = [
        { paymentNumber: { contains: req.query.search, mode: 'insensitive' } },
        { invoice: { is: { invoiceNumber: { contains: req.query.search, mode: 'insensitive' } } } },
        { vendorBill: { is: { billReference: { contains: req.query.search, mode: 'insensitive' } } } },
      ];
    }

    if (req.user!.role === 'user') {
      const contact = await prisma.contact.findFirst({ where: { email: req.user!.email } });
      if (!contact) {
        return res.json({ payments: [], total: 0, page, limit });
      }
      const ownInvoiceIds = await prisma.customerInvoice.findMany({
        where: { customerId: contact.id },
        select: { id: true },
      });
      where.invoiceId = { in: ownInvoiceIds.map((i) => i.id) };
    }

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({ payments: data.map(serializePayment), total, page, limit });
  } catch (err) { next(err); }
}

export async function getPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);
    if (req.user!.role === 'user') {
      const contact = await prisma.contact.findFirst({ where: { email: req.user!.email } });
      const ownInvoiceIds = contact
        ? (await prisma.customerInvoice.findMany({ where: { customerId: contact.id }, select: { id: true } })).map((i) => i.id)
        : [];
      if (!payment.invoiceId || !ownInvoiceIds.includes(payment.invoiceId)) {
        throw new AppError('FORBIDDEN', 'You do not have access to this payment', 403);
      }
    }
    res.json(serializePayment(payment));
  } catch (err) { next(err); }
}

export async function createPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = req.body.invoice_id ?? req.body.invoiceId ?? null;
    const vendorBillId = req.body.vendor_bill_id ?? req.body.vendorBillId ?? null;
    const amount = req.body.amount;
    const paymentVia = req.body.payment_via ?? req.body.paymentVia ?? 'bank';
    const paymentDate = req.body.payment_date ?? req.body.paymentDate;

    if (invoiceId && vendorBillId) {
      throw new AppError('VALIDATION_ERROR', 'Payment cannot be linked to both invoice and bill', 400);
    }
    if (!invoiceId && !vendorBillId) {
      throw new AppError('VALIDATION_ERROR', 'Payment must be linked to either invoice or bill', 400);
    }

    if (invoiceId) {
      const invoice = await prisma.customerInvoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
      if (invoice.status !== 'confirmed') throw new AppError('CONFIRMED_REQUIRED', 'Can only pay confirmed invoices', 400);
    }

    if (vendorBillId) {
      const bill = await prisma.vendorBill.findUnique({ where: { id: vendorBillId } });
      if (!bill) throw new AppError('NOT_FOUND', 'Vendor bill not found', 404);
      if (bill.status !== 'confirmed') throw new AppError('CONFIRMED_REQUIRED', 'Can only pay confirmed bills', 400);
    }

    const paymentNumber = await generateSequence('PAY');

    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId,
        vendorBillId,
        amount: parseFloat(amount),
        paymentVia,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        status: 'draft',
        createdBy: req.user!.id,
      },
    });

    logAudit({
      userId: req.user!.id,
      action: 'create',
      entity: 'payment',
      entityId: payment.id,
      entityName: payment.paymentNumber,
      newValues: { status: payment.status, amount: Number(payment.amount) },
      req,
    });

    res.status(201).json(serializePayment(payment));
  } catch (err) { next(err); }
}

export async function confirmPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);
    if (payment.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft payments can be confirmed', 400);

    const cashAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Cash' } });
    if (!cashAccount) throw new AppError('CONFIG_ERROR', 'Cash account not found', 500);
    const bankAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Bank' } });
    if (!bankAccount) throw new AppError('CONFIG_ERROR', 'Bank account not found', 500);

    const entryNumber = await generateSequence('JE');
    const targetAccount = payment.paymentVia === 'cash' ? cashAccount : bankAccount;
    const journalType = payment.paymentVia === 'cash' ? 'cash' : 'bank';
    const journal = await prisma.journal.findFirst({ where: { journalType: journalType as any } });
    if (!journal) throw new AppError('CONFIG_ERROR', `Journal not found for type: ${journalType}`, 500);

    const result = await prisma.$transaction(async (tx) => {
      if (payment.invoiceId) {
        const invoice = await tx.customerInvoice.findUnique({ where: { id: payment.invoiceId } });
        if (!invoice || invoice.status !== 'confirmed') {
          throw new AppError('CONFIRMED_REQUIRED', 'Invoice must be confirmed before payment', 400);
        }

        if (Number(payment.amount) > Number(invoice.amountDue)) {
          throw new AppError('OVERPAYMENT_NOT_ALLOWED', 'Payment amount exceeds the amount due', 400);
        }

        const arAccount = await tx.chartOfAccount.findFirst({ where: { name: 'Accounts Receivable' } });
        if (!arAccount) throw new AppError('CONFIG_ERROR', 'Accounts Receivable account not found', 500);

        await tx.journalEntry.create({
          data: {
            entryNumber,
            accountingDate: payment.paymentDate,
            journalId: journal.id,
            sourceDocumentType: 'payment',
            sourceDocumentId: payment.id,
            status: 'posted',
            createdBy: req.user!.id,
            lines: {
              create: [
                { srNo: 1, accountId: targetAccount.id, partnerId: invoice.customerId, debit: Number(payment.amount), credit: 0 },
                { srNo: 2, accountId: arAccount.id, partnerId: invoice.customerId, debit: 0, credit: Number(payment.amount) },
              ],
            },
          },
        });

        const newAmountDue = Number(invoice.amountDue) - Number(payment.amount);
        await tx.customerInvoice.update({
          where: { id: payment.invoiceId },
          data: { amountDue: newAmountDue, status: newAmountDue <= 0 ? 'paid' : invoice.status },
        });
      }

      if (payment.vendorBillId) {
        const bill = await tx.vendorBill.findUnique({ where: { id: payment.vendorBillId } });
        if (!bill || bill.status !== 'confirmed') {
          throw new AppError('CONFIRMED_REQUIRED', 'Bill must be confirmed before payment', 400);
        }

        if (Number(payment.amount) > Number(bill.amountDue)) {
          throw new AppError('OVERPAYMENT_NOT_ALLOWED', 'Payment amount exceeds the amount due', 400);
        }

        const apAccount = await tx.chartOfAccount.findFirst({ where: { name: 'Accounts Payable' } });
        if (!apAccount) throw new AppError('CONFIG_ERROR', 'Accounts Payable account not found', 500);

        await tx.journalEntry.create({
          data: {
            entryNumber,
            accountingDate: payment.paymentDate,
            journalId: journal.id,
            sourceDocumentType: 'payment',
            sourceDocumentId: payment.id,
            status: 'posted',
            createdBy: req.user!.id,
            lines: {
              create: [
                { srNo: 1, accountId: apAccount.id, partnerId: bill.vendorId, debit: Number(payment.amount), credit: 0 },
                { srNo: 2, accountId: targetAccount.id, partnerId: bill.vendorId, debit: 0, credit: Number(payment.amount) },
              ],
            },
          },
        });

        const newAmountDue = Number(bill.amountDue) - Number(payment.amount);
        await tx.vendorBill.update({
          where: { id: payment.vendorBillId },
          data: { amountDue: newAmountDue, status: newAmountDue <= 0 ? 'paid' : bill.status },
        });
      }

      const updated = await tx.payment.update({
        where: { id: req.params.id },
        data: { status: 'confirmed' },
      });

      return updated;
    }, { isolationLevel: 'Serializable' });

    logAudit({
      userId: req.user!.id,
      action: 'confirm',
      entity: 'payment',
      entityId: result.id,
      entityName: result.paymentNumber,
      newValues: { status: result.status },
      req,
    });

    res.json(serializePayment(result));
  } catch (err) { next(err); }
}