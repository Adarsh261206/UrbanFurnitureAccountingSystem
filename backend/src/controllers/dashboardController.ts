import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { serializeDashboard } from '../utils/serializers';

export async function getDashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const [draftSalesOrders, confirmedSalesOrders, totalSalesOrders] = await Promise.all([
      prisma.salesOrder.count({ where: { status: 'draft' } }),
      prisma.salesOrder.count({ where: { status: 'confirmed' } }),
      prisma.salesOrder.count(),
    ]);

    const [draftPurchaseOrders, confirmedPurchaseOrders, totalPurchaseOrders] = await Promise.all([
      prisma.purchaseOrder.count({ where: { status: 'draft' } }),
      prisma.purchaseOrder.count({ where: { status: 'confirmed' } }),
      prisma.purchaseOrder.count(),
    ]);

    const [draftBudgets, confirmedBudgets, totalBudgets] = await Promise.all([
      prisma.budget.count({ where: { status: 'draft' } }),
      prisma.budget.count({ where: { status: 'confirmed' } }),
      prisma.budget.count(),
    ]);

    res.json(serializeDashboard({
      draftSalesOrders,
      confirmedSalesOrders,
      totalSalesOrders,
      draftPurchaseOrders,
      confirmedPurchaseOrders,
      totalPurchaseOrders,
      draftBudgets,
      confirmedBudgets,
      totalBudgets,
    }));
  } catch (err) { next(err); }
}

export async function getReceivables(_req: Request, res: Response, next: NextFunction) {
  try {
    const receivables = await prisma.customerInvoice.findMany({
      where: { status: 'confirmed', amountDue: { gt: 0 } },
      select: {
        id: true,
        invoiceReference: true,
        invoiceNumber: true,
        total: true,
        amountDue: true,
        dueDate: true,
        customer: { select: { name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const total = receivables.reduce((sum, r) => sum + Number(r.amountDue), 0);

    res.json({
      receivables: receivables.map((r) => ({
        id: r.id,
        invoice_reference: r.invoiceReference,
        invoice_number: r.invoiceNumber,
        total: Number(r.total),
        amount_due: Number(r.amountDue),
        due_date: r.dueDate,
        customer: r.customer,
      })),
      total,
    });
  } catch (err) { next(err); }
}

export async function getPayables(_req: Request, res: Response, next: NextFunction) {
  try {
    const payables = await prisma.vendorBill.findMany({
      where: { status: 'confirmed', amountDue: { gt: 0 } },
      select: {
        id: true,
        billReference: true,
        vendorBillNo: true,
        total: true,
        amountDue: true,
        dueDate: true,
        vendor: { select: { name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const total = payables.reduce((sum, p) => sum + Number(p.amountDue), 0);

    res.json({
      payables: payables.map((p) => ({
        id: p.id,
        bill_reference: p.billReference,
        vendor_bill_no: p.vendorBillNo,
        total: Number(p.total),
        amount_due: Number(p.amountDue),
        due_date: p.dueDate,
        vendor: p.vendor,
      })),
      total,
    });
  } catch (err) { next(err); }
}