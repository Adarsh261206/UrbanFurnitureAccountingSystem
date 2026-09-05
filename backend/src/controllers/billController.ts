import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';

export async function listBills(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.vendorId) where.vendorId = req.query.vendorId;

    if (req.user!.role === 'user') {
      where.createdBy = req.user!.id;
    }

    const [data, total] = await Promise.all([
      prisma.vendorBill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vendor: true, purchaseOrder: true, billLines: { include: { product: true } } },
      }),
      prisma.vendorBill.count({ where }),
    ]);

    const dataWithAmountPaid = data.map((bill) => ({
      ...bill,
      amountPaid: Number(bill.total) - Number(bill.amountDue),
    }));

    res.json({ data: dataWithAmountPaid, total, page, limit });
  } catch (err) { next(err); }
}

export async function getBill(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await prisma.vendorBill.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true, partner: true, purchaseOrder: true,
        billLines: { include: { product: true, chartOfAccount: true } },
        payments: true,
      },
    });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    if (req.user!.role === 'user' && bill.createdBy !== req.user!.id) {
      throw new AppError('FORBIDDEN', 'You do not have access to this bill', 403);
    }
    res.json({ data: { ...bill, amountPaid: Number(bill.total) - Number(bill.amountDue) } });
  } catch (err) { next(err); }
}

export async function createBill(req: Request, res: Response, next: NextFunction) {
  try {
    const { vendorId, purchaseOrderId, date, billDate, dueDate, paymentType, partnerId, paymentVia, vendorBillNo, lines } = req.body;

    if (!lines || lines.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Bill must have at least one line', 400);
    }

    const billReference = await generateSequence('BILL');
    const total = lines.reduce((sum: number, l: any) => {
      const qty = parseFloat(l.qty || l.quantity);
      const price = parseFloat(l.unitPrice || l.unit_price);
      return sum + qty * price;
    }, 0);

    const bill = await prisma.vendorBill.create({
      data: {
        billReference,
        vendorBillNo: vendorBillNo || null,
        purchaseOrderId: purchaseOrderId || null,
        vendorId,
        date: new Date(date),
        billDate: new Date(billDate),
        dueDate: new Date(dueDate),
        paymentType: paymentType || 'send',
        partnerId: partnerId || vendorId,
        paymentVia: paymentVia || 'bank',
        total,
        amountDue: total,
        status: 'draft',
        createdBy: req.user!.id,
        billLines: {
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
      include: { billLines: true },
    });

    res.status(201).json({ data: { ...bill, amountPaid: 0 } });
  } catch (err) { next(err); }
}

export async function updateBill(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await prisma.vendorBill.findUnique({ where: { id: req.params.id } });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    if (bill.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft bills can be updated', 400);

    const { vendorId, billDate, dueDate, paymentType, partnerId, paymentVia, vendorBillNo, lines } = req.body;
    const updateData: any = {};
    if (vendorId !== undefined) updateData.vendorId = vendorId;
    if (billDate !== undefined) updateData.billDate = new Date(billDate);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (paymentType !== undefined) updateData.paymentType = paymentType;
    if (partnerId !== undefined) updateData.partnerId = partnerId;
    if (paymentVia !== undefined) updateData.paymentVia = paymentVia;
    if (vendorBillNo !== undefined) updateData.vendorBillNo = vendorBillNo;

    if (lines !== undefined) {
      if (!Array.isArray(lines) || lines.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'Bill must have at least one line', 400);
      }
      const total = lines.reduce((sum: number, l: any) => {
        const qty = parseFloat(l.qty || l.quantity);
        const price = parseFloat(l.unitPrice || l.unit_price);
        return sum + qty * price;
      }, 0);
      updateData.total = total;
      updateData.amountDue = total;
      await prisma.vendorBillLine.deleteMany({ where: { vendorBillId: req.params.id } });
      await prisma.vendorBillLine.createMany({
        data: lines.map((line: any, index: number) => ({
          vendorBillId: req.params.id,
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

    const updated = await prisma.vendorBill.update({
      where: { id: req.params.id },
      data: updateData,
      include: { billLines: true },
    });

    res.json({ data: { ...updated, amountPaid: Number(updated.total) - Number(updated.amountDue) } });
  } catch (err) { next(err); }
}

export async function confirmBill(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await prisma.vendorBill.findUnique({ where: { id: req.params.id } });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    if (bill.status === 'confirmed') throw new AppError('ALREADY_CONFIRMED', 'Bill is already confirmed', 400);
    if (bill.status === 'paid') throw new AppError('ALREADY_PAID', 'Bill is already paid', 400);
    if (bill.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft bills can be confirmed', 400);

    const purchaseJournal = await prisma.journal.findFirst({ where: { journalType: 'purchase' } });
    if (!purchaseJournal) throw new AppError('CONFIG_ERROR', 'Purchase journal not found', 500);
    const apAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Accounts Payable' } });
    if (!apAccount) throw new AppError('CONFIG_ERROR', 'Accounts Payable account not found', 500);
    const purchaseExpense = await prisma.chartOfAccount.findFirst({ where: { name: 'Purchase Expense' } });
    if (!purchaseExpense) throw new AppError('CONFIG_ERROR', 'Purchase Expense account not found', 500);

    const entryNumber = await generateSequence('JE');

    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          entryNumber,
          accountingDate: bill.billDate,
          journalId: purchaseJournal.id,
          sourceDocumentType: 'vendor_bill',
          sourceDocumentId: bill.id,
          status: 'posted',
          createdBy: req.user!.id,
          lines: {
            create: [
              { srNo: 1, accountId: purchaseExpense.id, partnerId: bill.vendorId, debit: Number(bill.total), credit: 0 },
              { srNo: 2, accountId: apAccount.id, partnerId: bill.vendorId, debit: 0, credit: Number(bill.total) },
            ],
          },
        },
      });

      const updated = await tx.vendorBill.update({
        where: { id: req.params.id },
        data: { status: 'confirmed', journalEntryId: entry.id },
        include: { billLines: true },
      });

      return updated;
    }, { isolationLevel: 'Serializable' });

    res.json({ data: { ...result, amountPaid: Number(result.total) - Number(result.amountDue) } });
  } catch (err) { next(err); }
}

export async function payBill(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount, paymentVia, paymentDate } = req.body;

    if (amount === undefined) throw new AppError('INVALID_AMOUNT', 'Amount is required', 400);
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new AppError('INVALID_AMOUNT', 'Amount must be greater than 0', 400);
    }

    const bill = await prisma.vendorBill.findUnique({ where: { id: req.params.id } });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    if (bill.status !== 'confirmed') {
      throw new AppError('INVALID_STATUS', 'Only confirmed bills can be paid', 400);
    }

    if (payAmount > Number(bill.amountDue)) {
      throw new AppError('OVERPAYMENT_NOT_ALLOWED', 'Payment amount cannot exceed amount due', 400);
    }

    const cashAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Cash' } });
    if (!cashAccount) throw new AppError('CONFIG_ERROR', 'Cash account not found', 500);
    const bankAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Bank' } });
    if (!bankAccount) throw new AppError('CONFIG_ERROR', 'Bank account not found', 500);
    const apAccount = await prisma.chartOfAccount.findFirst({ where: { name: 'Accounts Payable' } });
    if (!apAccount) throw new AppError('CONFIG_ERROR', 'Accounts Payable account not found', 500);

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
          vendorBillId: bill.id,
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
              { srNo: 1, accountId: apAccount.id, partnerId: bill.vendorId, debit: payAmount, credit: 0 },
              { srNo: 2, accountId: targetAccount.id, partnerId: bill.vendorId, debit: 0, credit: payAmount },
            ],
          },
        },
      });

      const newAmountDue = Number(bill.amountDue) - payAmount;
      await tx.vendorBill.update({
        where: { id: bill.id },
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

export async function cancelBill(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await prisma.vendorBill.findUnique({ where: { id: req.params.id } });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    if (bill.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft bills can be cancelled', 400);

    await prisma.vendorBill.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function printBill(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ message: 'Bill print requested (stub)' });
  } catch (err) { next(err); }
}

export async function sendBill(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ message: 'Bill email sent (stub)' });
  } catch (err) { next(err); }
}