import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';
import { serializeBillDetail, serializeBillListRow } from '../utils/serializers';

export async function listBills(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.vendor_id) where.vendorId = req.query.vendor_id;

    const [data, total] = await Promise.all([
      prisma.vendorBill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vendor: true },
      }),
      prisma.vendorBill.count({ where }),
    ]);

    res.json({ bills: data.map(serializeBillListRow), total, page, limit });
  } catch (err) { next(err); }
}

export async function getBill(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await prisma.vendorBill.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true, partner: true,
        billLines: { include: { product: true } },
      },
    });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    res.json(serializeBillDetail(bill));
  } catch (err) { next(err); }
}

export async function createBill(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorId = req.body.vendor_id ?? req.body.vendorId;
    const purchaseOrderId = req.body.purchase_order_id ?? req.body.purchaseOrderId ?? null;
    const billDate = req.body.bill_date ?? req.body.billDate;
    const dueDate = req.body.due_date ?? req.body.dueDate;
    const date = req.body.date ?? billDate;
    const lines = req.body.lines;

    if (!lines || lines.length === 0) {
      throw new AppError('LINES_REQUIRED', 'Bill must have at least one line', 400, 'lines');
    }

    const billReference = await generateSequence('BILL');
    const total = lines.reduce((sum: number, l: any) => {
      const qty = parseFloat(l.quantity ?? l.qty);
      const price = parseFloat(l.unit_price ?? l.unitPrice);
      return sum + qty * price;
    }, 0);

    const bill = await prisma.vendorBill.create({
      data: {
        billReference,
        vendorBillNo: req.body.vendor_bill_no ?? null,
        purchaseOrderId,
        vendorId,
        date: new Date(date),
        billDate: new Date(billDate),
        dueDate: new Date(dueDate),
        paymentType: req.body.payment_type ?? 'send',
        partnerId: req.body.partner_id ?? vendorId,
        paymentVia: req.body.payment_via ?? 'bank',
        total,
        amountDue: total,
        status: 'draft',
        createdBy: req.user!.id,
        billLines: {
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
      include: { vendor: true, partner: true, billLines: { include: { product: true } } },
    });

    res.status(201).json(serializeBillDetail(bill));
  } catch (err) { next(err); }
}

export async function updateBill(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await prisma.vendorBill.findUnique({ where: { id: req.params.id } });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    if (bill.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft bills can be updated', 400);

    const updateData: any = {};
    if (req.body.vendor_id !== undefined) updateData.vendorId = req.body.vendor_id;
    if (req.body.bill_date !== undefined) updateData.billDate = new Date(req.body.bill_date);
    if (req.body.due_date !== undefined) updateData.dueDate = new Date(req.body.due_date);
    if (req.body.payment_type !== undefined) updateData.paymentType = req.body.payment_type;
    if (req.body.partner_id !== undefined) updateData.partnerId = req.body.partner_id;
    if (req.body.payment_via !== undefined) updateData.paymentVia = req.body.payment_via;
    if (req.body.vendor_bill_no !== undefined) updateData.vendorBillNo = req.body.vendor_bill_no;

    if (req.body.lines !== undefined) {
      const lines = req.body.lines;
      if (!Array.isArray(lines) || lines.length === 0) {
        throw new AppError('LINES_REQUIRED', 'Bill must have at least one line', 400, 'lines');
      }
      const total = lines.reduce((sum: number, l: any) => {
        const qty = parseFloat(l.quantity ?? l.qty);
        const price = parseFloat(l.unit_price ?? l.unitPrice);
        return sum + qty * price;
      }, 0);
      updateData.total = total;
      updateData.amountDue = total;
      await prisma.vendorBillLine.deleteMany({ where: { vendorBillId: req.params.id } });
      await prisma.vendorBillLine.createMany({
        data: lines.map((line: any, index: number) => ({
          vendorBillId: req.params.id,
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

    const updated = await prisma.vendorBill.update({
      where: { id: req.params.id },
      data: updateData,
      include: { vendor: true, partner: true, billLines: { include: { product: true } } },
    });

    res.json(serializeBillDetail(updated));
  } catch (err) { next(err); }
}

export async function confirmBill(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await prisma.vendorBill.findUnique({ where: { id: req.params.id } });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    if (bill.status === 'confirmed') throw new AppError('ALREADY_CONFIRMED', 'Bill is already confirmed', 400);
    if (bill.status === 'paid') throw new AppError('ALREADY_PAID', 'Bill is already paid', 400);
    if (bill.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft bills can be confirmed', 400);

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
        include: { vendor: true, partner: true, billLines: { include: { product: true } } },
      });

      return updated;
    }, { isolationLevel: 'Serializable' });

    res.json(serializeBillDetail(result));
  } catch (err) { next(err); }
}

export async function payBill(req: Request, res: Response, next: NextFunction) {
  try {
    const amount = req.body.amount;
    const paymentVia = req.body.payment_via ?? req.body.paymentVia ?? 'bank';
    const paymentDate = req.body.payment_date ?? req.body.paymentDate;

    if (amount === undefined) throw new AppError('INVALID_AMOUNT', 'Amount is required', 400, 'amount');
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new AppError('INVALID_AMOUNT', 'Amount must be greater than 0', 400, 'amount');
    }

    const bill = await prisma.vendorBill.findUnique({ where: { id: req.params.id } });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    if (bill.status === 'paid') throw new AppError('ALREADY_PAID', 'Bill is already paid', 400);
    if (bill.status !== 'confirmed') {
      throw new AppError('CONFIRMED_REQUIRED', 'Only confirmed bills can be paid', 400);
    }

    if (payAmount > Number(bill.amountDue)) {
      throw new AppError('OVERPAYMENT_NOT_ALLOWED', 'Payment amount exceeds the amount due', 400, 'amount');
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

    const updated = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          vendorBillId: bill.id,
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
              { srNo: 1, accountId: apAccount.id, partnerId: bill.vendorId, debit: payAmount, credit: 0 },
              { srNo: 2, accountId: targetAccount.id, partnerId: bill.vendorId, debit: 0, credit: payAmount },
            ],
          },
        },
      });

      const newAmountDue = Number(bill.amountDue) - payAmount;
      const b = await tx.vendorBill.update({
        where: { id: bill.id },
        data: { amountDue: newAmountDue, status: newAmountDue <= 0 ? 'paid' : 'confirmed' },
        include: { vendor: true, partner: true, billLines: { include: { product: true } } },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { journalEntryId: entry.id },
      });

      return b;
    }, { isolationLevel: 'Serializable' });

    res.json(serializeBillDetail(updated));
  } catch (err) { next(err); }
}

export async function cancelBill(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await prisma.vendorBill.findUnique({
      where: { id: req.params.id },
      include: { vendor: true, partner: true, billLines: { include: { product: true } } },
    });
    if (!bill) throw new AppError('NOT_FOUND', 'Bill not found', 404);
    if (bill.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft bills can be cancelled', 400);

    await prisma.vendorBill.delete({ where: { id: req.params.id } });
    res.json(serializeBillDetail(bill));
  } catch (err) { next(err); }
}

export async function printBill(_req: Request, res: Response, next: NextFunction) {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.send(Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF\n'));
  } catch (err) { next(err); }
}

export async function sendBill(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ message: 'Bill email sent (stub)' });
  } catch (err) { next(err); }
}