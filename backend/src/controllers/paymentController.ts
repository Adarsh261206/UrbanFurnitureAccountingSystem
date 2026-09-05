import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';

export async function listPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.invoiceId) where.invoiceId = req.query.invoiceId;
    if (req.query.vendorBillId) where.vendorBillId = req.query.vendorBillId;

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { invoice: true, vendorBill: true },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) { next(err); }
}

export async function getPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { invoice: true, vendorBill: true, journalEntry: true },
    });
    if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);
    res.json({ data: payment });
  } catch (err) { next(err); }
}

export async function createPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId, vendorBillId, amount, paymentVia, paymentDate } = req.body;

    if (invoiceId && vendorBillId) {
      throw new AppError('VALIDATION_ERROR', 'Payment cannot be linked to both invoice and bill', 400);
    }
    if (!invoiceId && !vendorBillId) {
      throw new AppError('VALIDATION_ERROR', 'Payment must be linked to either invoice or bill', 400);
    }

    const paymentNumber = await generateSequence('PAY');

    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId: invoiceId || null,
        vendorBillId: vendorBillId || null,
        amount: parseFloat(amount),
        paymentVia: paymentVia || 'bank',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        status: 'draft',
        createdBy: req.user!.id,
      },
      include: { invoice: true, vendorBill: true },
    });

    res.status(201).json({ data: payment });
  } catch (err) { next(err); }
}

export async function confirmPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);
    if (payment.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft payments can be confirmed', 400);

    let journalEntryId = null;
    const cashAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Cash' } });
    const bankAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Bank' } });

    if (payment.invoiceId) {
      const invoice = await prisma.customerInvoice.findUnique({ where: { id: payment.invoiceId } });
      if (invoice && invoice.status === 'confirmed') {
        const arAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Accounts Receivable' } });
        const targetAccount = payment.paymentVia === 'cash' ? cashAccount : bankAccount;

        if (arAccount && targetAccount) {
          const entryNumber = await generateSequence('JE');
          const entry = await prisma.journalEntry.create({
            data: {
              entryNumber,
              accountingDate: payment.paymentDate,
              journalId: (await prisma.journal.findFirst({ where: { journalType: payment.paymentVia === 'cash' ? 'cash' : 'bank' } }))!.id,
              sourceDocumentType: 'payment',
              sourceDocumentId: payment.id,
              status: 'posted',
              createdBy: req.user!.id,
              lines: {
                create: [
                  { accountId: targetAccount.id, debit: Number(payment.amount), credit: 0, srNo: 1 },
                  { accountId: arAccount.id, debit: 0, credit: Number(payment.amount), srNo: 2 },
                ],
              },
            },
          });
          journalEntryId = entry.id;
        }

        const newAmountDue = Math.max(0, Number(invoice.amountDue) - Number(payment.amount));
        await prisma.customerInvoice.update({
          where: { id: payment.invoiceId },
          data: { amountDue: newAmountDue, status: newAmountDue <= 0 ? 'paid' : invoice.status },
        });
      }
    }

    if (payment.vendorBillId) {
      const bill = await prisma.vendorBill.findUnique({ where: { id: payment.vendorBillId } });
      if (bill && bill.status === 'confirmed') {
        const apAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Accounts Payable' } });
        const targetAccount = payment.paymentVia === 'cash' ? cashAccount : bankAccount;

        if (apAccount && targetAccount) {
          const entryNumber = await generateSequence('JE');
          const entry = await prisma.journalEntry.create({
            data: {
              entryNumber,
              accountingDate: payment.paymentDate,
              journalId: (await prisma.journal.findFirst({ where: { journalType: payment.paymentVia === 'cash' ? 'cash' : 'bank' } }))!.id,
              sourceDocumentType: 'payment',
              sourceDocumentId: payment.id,
              status: 'posted',
              createdBy: req.user!.id,
              lines: {
                create: [
                  { accountId: apAccount.id, debit: Number(payment.amount), credit: 0, srNo: 1 },
                  { accountId: targetAccount.id, debit: 0, credit: Number(payment.amount), srNo: 2 },
                ],
              },
            },
          });
          journalEntryId = entry.id;
        }

        const newAmountDue = Math.max(0, Number(bill.amountDue) - Number(payment.amount));
        await prisma.vendorBill.update({
          where: { id: payment.vendorBillId },
          data: { amountDue: newAmountDue, status: newAmountDue <= 0 ? 'paid' : bill.status },
        });
      }
    }

    const updated = await prisma.payment.update({
      where: { id: req.params.id },
      data: { status: 'confirmed', journalEntryId },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
}
