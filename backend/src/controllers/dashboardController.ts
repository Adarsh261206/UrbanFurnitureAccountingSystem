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

// ---------- Enhanced dashboard summary (charts data) ----------

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${String(y).slice(2)}`;
}

export async function getDashboardSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const months = 6;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // ---- Monthly revenue (confirmed + paid invoices) and expenses (confirmed bills) ----
    const invoices = await prisma.customerInvoice.findMany({
      where: { status: { in: ['confirmed', 'paid'] }, invoiceDate: { gte: startDate } },
      select: { total: true, invoiceDate: true },
    });
    const bills = await prisma.vendorBill.findMany({
      where: { status: { in: ['confirmed', 'paid'] }, billDate: { gte: startDate } },
      select: { total: true, billDate: true },
    });
    const payments = await prisma.payment.findMany({
      where: { status: 'successful', paymentDate: { gte: startDate } },
      select: { amount: true, paymentDate: true, vendorBillId: true, invoiceId: true },
    });

    const monthly: Record<string, { revenue: number; expense: number }> = {};
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly[monthKey(d)] = { revenue: 0, expense: 0 };
    }

    for (const inv of invoices) {
      const k = monthKey(inv.invoiceDate);
      if (monthly[k]) monthly[k].revenue += Number(inv.total);
    }
    for (const b of bills) {
      const k = monthKey(b.billDate);
      if (monthly[k]) monthly[k].expense += Number(b.total);
    }

    const monthly_revenue_expense = Object.keys(monthly)
      .sort()
      .map((k) => ({
        month: monthLabel(k),
        revenue: Math.round(monthly[k].revenue),
        expense: Math.round(monthly[k].expense),
      }));

    // ---- Cash flow: inflows (payments on invoices) vs outflows (payments on bills) ----
    const cashMonthly: Record<string, { inflow: number; outflow: number }> = {};
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      cashMonthly[monthKey(d)] = { inflow: 0, outflow: 0 };
    }
    for (const p of payments) {
      const k = monthKey(p.paymentDate);
      if (!cashMonthly[k]) continue;
      if (p.vendorBillId) cashMonthly[k].outflow += Number(p.amount);
      else if (p.invoiceId) cashMonthly[k].inflow += Number(p.amount);
    }
    const cash_flow = Object.keys(cashMonthly)
      .sort()
      .map((k) => ({
        month: monthLabel(k),
        inflow: Math.round(cashMonthly[k].inflow),
        outflow: Math.round(cashMonthly[k].outflow),
      }));

    // ---- Invoice status counts ----
    const [draftInvoices, confirmedInvoices, paidInvoices] = await Promise.all([
      prisma.customerInvoice.count({ where: { status: 'draft' } }),
      prisma.customerInvoice.count({ where: { status: 'confirmed' } }),
      prisma.customerInvoice.count({ where: { status: 'paid' } }),
    ]);
    const invoice_status = [
      { status: 'Draft', count: draftInvoices },
      { status: 'Confirmed', count: confirmedInvoices },
      { status: 'Paid', count: paidInvoices },
    ];

    // ---- Top customers by outstanding ----
    const receivables = await prisma.customerInvoice.findMany({
      where: { status: 'confirmed', amountDue: { gt: 0 } },
      select: { customerId: true, amountDue: true, customer: { select: { name: true } } },
    });
    const byCustomer: Record<string, { name: string; outstanding: number }> = {};
    for (const r of receivables) {
      const name = r.customer?.name ?? 'Unknown';
      if (!byCustomer[r.customerId]) byCustomer[r.customerId] = { name, outstanding: 0 };
      byCustomer[r.customerId].outstanding += Number(r.amountDue);
    }
    const top_customers = Object.values(byCustomer)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 8)
      .map((c) => ({ name: c.name, outstanding: Math.round(c.outstanding) }));

    // ---- Period totals for KPI cards ----
    const [thisMonthInvoices, prevMonthInvoices, ytdInvoices] = await Promise.all([
      prisma.customerInvoice.aggregate({
        where: { status: { in: ['confirmed', 'paid'] }, invoiceDate: { gte: thisMonthStart } },
        _sum: { total: true },
      }),
      prisma.customerInvoice.aggregate({
        where: { status: { in: ['confirmed', 'paid'] }, invoiceDate: { gte: prevMonthStart, lt: thisMonthStart } },
        _sum: { total: true },
      }),
      prisma.customerInvoice.aggregate({
        where: { status: { in: ['confirmed', 'paid'] }, invoiceDate: { gte: yearStart } },
        _sum: { total: true },
      }),
    ]);
    const [thisMonthBills, prevMonthBills, ytdBills] = await Promise.all([
      prisma.vendorBill.aggregate({
        where: { status: { in: ['confirmed', 'paid'] }, billDate: { gte: thisMonthStart } },
        _sum: { total: true },
      }),
      prisma.vendorBill.aggregate({
        where: { status: { in: ['confirmed', 'paid'] }, billDate: { gte: prevMonthStart, lt: thisMonthStart } },
        _sum: { total: true },
      }),
      prisma.vendorBill.aggregate({
        where: { status: { in: ['confirmed', 'paid'] }, billDate: { gte: yearStart } },
        _sum: { total: true },
      }),
    ]);
    const [totalReceivable, totalPayable] = await Promise.all([
      prisma.customerInvoice.aggregate({
        where: { status: 'confirmed', amountDue: { gt: 0 } },
        _sum: { amountDue: true },
      }),
      prisma.vendorBill.aggregate({
        where: { status: 'confirmed', amountDue: { gt: 0 } },
        _sum: { amountDue: true },
      }),
    ]);

    const revenue = Math.round(Number(thisMonthInvoices._sum.total ?? 0));
    const prevRevenue = Math.round(Number(prevMonthInvoices._sum.total ?? 0));
    const expense = Math.round(Number(thisMonthBills._sum.total ?? 0));
    const prevExpense = Math.round(Number(prevMonthBills._sum.total ?? 0));
    const profit = revenue - expense;
    const prevProfit = prevRevenue - prevExpense;
    const receivable = Math.round(Number(totalReceivable._sum.amountDue ?? 0));
    const payable = Math.round(Number(totalPayable._sum.amountDue ?? 0));

    res.json({
      kpis: {
        revenue,
        revenue_change_pct: prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null,
        expense,
        expense_change_pct: prevExpense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 100) : null,
        profit,
        profit_change_pct: prevProfit !== 0 ? Math.round(((profit - prevProfit) / Math.abs(prevProfit)) * 100) : null,
        receivable,
        payable,
        revenue_ytd: Math.round(Number(ytdInvoices._sum.total ?? 0)),
        expense_ytd: Math.round(Number(ytdBills._sum.total ?? 0)),
      },
      monthly_revenue_expense,
      cash_flow,
      invoice_status,
      top_customers,
    });
  } catch (err) { next(err); }
}