import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

export async function getDashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalContacts,
      totalProducts,
      totalCustomers,
      totalVendors,
      pendingInvoices,
      pendingBills,
      draftSalesOrders,
      draftPurchaseOrders,
      draftBudgets,
    ] = await Promise.all([
      prisma.contact.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.customerInvoice.count({ where: { status: 'confirmed' } }),
      prisma.vendorBill.count({ where: { status: 'confirmed' } }),
      prisma.customerInvoice.findMany({
        where: { status: 'confirmed', amountDue: { gt: 0 } },
        select: { id: true, invoiceReference: true, amountDue: true, customer: { select: { name: true } } },
        take: 10,
      }),
      prisma.vendorBill.findMany({
        where: { status: 'confirmed', amountDue: { gt: 0 } },
        select: { id: true, billReference: true, amountDue: true, vendor: { select: { name: true } } },
        take: 10,
      }),
      prisma.salesOrder.count({ where: { status: 'draft' } }),
      prisma.purchaseOrder.count({ where: { status: 'draft' } }),
      prisma.budget.count({ where: { status: 'draft' } }),
    ]);

    const totalPendingReceivables = pendingInvoices.reduce((sum, inv) => sum + Number(inv.amountDue), 0);
    const totalPendingPayables = pendingBills.reduce((sum, bill) => sum + Number(bill.amountDue), 0);

    res.json({
      data: {
        contacts: totalContacts,
        products: totalProducts,
        openInvoices: totalCustomers,
        openBills: totalVendors,
        pendingInvoices,
        pendingBills,
        totalPendingReceivables,
        totalPendingPayables,
        draftSalesOrders,
        draftPurchaseOrders,
        draftBudgets,
      },
    });
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

    res.json({ data: { receivables, total } });
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

    res.json({ data: { payables, total } });
  } catch (err) { next(err); }
}
