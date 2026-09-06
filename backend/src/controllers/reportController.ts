import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { generateProfitLossPdf, generateBalanceSheetPdf, generateCashFlowPdf, generateTrialBalancePdf, generateGstr1Pdf, generateGstr3bPdf, type ProfitLossData, type BalanceSheetData, type CashFlowData, type TrialBalanceData, type Gstr1Data, type Gstr3bData } from '../services/reportPdfService';
import { sendPdfBuffer } from '../services/pdfService';

async function computeProfitAndLoss(year: number, from?: Date, to?: Date) {
  let fromDate: Date;
  let toDate: Date;

  if (from && to) {
    fromDate = from;
    toDate = to;
  } else if (year) {
    fromDate = new Date(year, 0, 1);
    toDate = new Date(year, 11, 31, 23, 59, 59);
  } else {
    const now = new Date();
    fromDate = new Date(now.getFullYear(), 0, 1);
    toDate = now;
  }

  const [incomeAccounts, expenseAccounts] = await Promise.all([
    prisma.chartOfAccount.findMany({ where: { accountType: 'income' } }),
    prisma.chartOfAccount.findMany({ where: { accountType: 'expense' } }),
  ]);

  const incomeAccountIds = incomeAccounts.map((a) => a.id);
  const expenseAccountIds = expenseAccounts.map((a) => a.id);

  const [incomeLines, expenseLines] = await Promise.all([
    prisma.journalEntryLine.findMany({
      where: {
        accountId: { in: incomeAccountIds },
        journalEntry: {
          status: 'posted',
          accountingDate: { gte: fromDate, lte: toDate },
        },
      },
      include: { account: true },
    }),
    prisma.journalEntryLine.findMany({
      where: {
        accountId: { in: expenseAccountIds },
        journalEntry: {
          status: 'posted',
          accountingDate: { gte: fromDate, lte: toDate },
        },
      },
      include: { account: true },
    }),
  ]);

  const incomeByAccount: Record<string, { name: string; amount: number }> = {};
  for (const line of incomeLines) {
    const key = line.accountId;
    if (!incomeByAccount[key]) {
      incomeByAccount[key] = { name: line.account.name, amount: 0 };
    }
    incomeByAccount[key].amount += Number(line.credit) - Number(line.debit);
  }

  const expenseByAccount: Record<string, { name: string; amount: number }> = {};
  for (const line of expenseLines) {
    const key = line.accountId;
    if (!expenseByAccount[key]) {
      expenseByAccount[key] = { name: line.account.name, amount: 0 };
    }
    expenseByAccount[key].amount += Number(line.debit) - Number(line.credit);
  }

  const totalIncome = Object.values(incomeByAccount).reduce((s, a) => s + a.amount, 0);
  const totalExpenses = Object.values(expenseByAccount).reduce((s, a) => s + a.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  return {
    year,
    income: {
      items: Object.values(incomeByAccount).map((a) => ({ account_name: a.name, amount: a.amount })),
      total: totalIncome,
    },
    expenses: {
      items: Object.values(expenseByAccount).map((a) => ({ account_name: a.name, amount: a.amount })),
      total: totalExpenses,
    },
    net_income: netProfit,
  };
}

async function computeBalanceSheet(year: number, asOf?: Date) {
  let asOfDate: Date;

  if (asOf) {
    asOfDate = asOf;
  } else if (year) {
    asOfDate = new Date(year, 11, 31, 23, 59, 59);
  } else {
    asOfDate = new Date();
  }

  const [assetAccounts, liabilityAccounts, capitalAccounts, incomeAccounts] = await Promise.all([
    prisma.chartOfAccount.findMany({ where: { accountType: { in: ['asset', 'bank', 'cash'] } } }),
    prisma.chartOfAccount.findMany({ where: { accountType: 'liability' } }),
    prisma.chartOfAccount.findMany({ where: { accountType: 'capital' } }),
    prisma.chartOfAccount.findMany({ where: { accountType: 'income' } }),
  ]);

  const allAccountIds = [...assetAccounts, ...liabilityAccounts, ...capitalAccounts, ...incomeAccounts].map((a) => a.id);

  const lines = await prisma.journalEntryLine.findMany({
    where: {
      accountId: { in: allAccountIds },
      journalEntry: {
        status: 'posted',
        accountingDate: { lte: asOfDate },
      },
    },
    include: { account: true },
  });

  const accountBalances: Record<string, { name: string; type: string; balance: number }> = {};
  for (const account of [...assetAccounts, ...liabilityAccounts, ...capitalAccounts, ...incomeAccounts]) {
    accountBalances[account.id] = { name: account.name, type: account.accountType, balance: 0 };
  }

  for (const line of lines) {
    const entry = accountBalances[line.accountId];
    if (entry) {
      if (['asset', 'bank', 'cash'].includes(entry.type)) {
        entry.balance += Number(line.debit) - Number(line.credit);
      } else {
        entry.balance += Number(line.credit) - Number(line.debit);
      }
    }
  }

  const totalAssets = Object.values(accountBalances)
    .filter((a) => ['asset', 'bank', 'cash'].includes(a.type))
    .reduce((s, a) => s + a.balance, 0);

  const totalLiabilities = Object.values(accountBalances)
    .filter((a) => ['liability', 'capital', 'income'].includes(a.type))
    .reduce((s, a) => s + a.balance, 0);

  const balanceCheck = Math.abs(totalAssets - totalLiabilities) < 0.01;

  return {
    year,
    assets: {
      items: Object.values(accountBalances)
        .filter((a) => ['asset', 'bank', 'cash'].includes(a.type))
        .map((a) => ({ account_name: a.name, amount: a.balance })),
      total: totalAssets,
    },
    liabilities: {
      items: Object.values(accountBalances)
        .filter((a) => ['liability', 'capital', 'income'].includes(a.type))
        .map((a) => ({ account_name: a.name, amount: a.balance })),
      total: totalLiabilities,
    },
    balance_check: balanceCheck,
  };
}

export async function getProfitAndLoss(req: Request, res: Response, next: NextFunction) {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const data = await computeProfitAndLoss(
      year,
      req.query.from ? new Date(req.query.from as string) : undefined,
      req.query.to ? new Date(req.query.to as string) : undefined,
    );

    if (req.query.format === 'pdf') {
      const buffer = await generateProfitLossPdf(data as ProfitLossData);
      return sendPdfBuffer(res, buffer, `profit-and-loss-${year}.pdf`);
    }

    res.json(data);
  } catch (err) { next(err); }
}

export async function getBalanceSheet(req: Request, res: Response, next: NextFunction) {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const data = await computeBalanceSheet(
      year,
      req.query.asOf ? new Date(req.query.asOf as string) : undefined,
    );

    if (req.query.format === 'pdf') {
      const buffer = await generateBalanceSheetPdf(data as BalanceSheetData);
      return sendPdfBuffer(res, buffer, `balance-sheet-${year}.pdf`);
    }

    res.json(data);
  } catch (err) { next(err); }
}

async function computeTrialBalance(year: number) {
  const fromDate = new Date(year, 0, 1);
  const toDate = new Date(year, 11, 31, 23, 59, 59);

  const allAccounts = await prisma.chartOfAccount.findMany({
    orderBy: { name: 'asc' },
  });

  const lines = await prisma.journalEntryLine.findMany({
    where: {
      journalEntry: {
        status: 'posted',
        accountingDate: { gte: fromDate, lte: toDate },
      },
    },
    include: { account: true },
  });

  const accountSums: Record<string, { debit: number; credit: number }> = {};
  for (const account of allAccounts) {
    accountSums[account.id] = { debit: 0, credit: 0 };
  }

  for (const line of lines) {
    const sums = accountSums[line.accountId];
    if (sums) {
      sums.debit += Number(line.debit);
      sums.credit += Number(line.credit);
    }
  }

  const accounts = allAccounts
    .map((account) => {
      const sums = accountSums[account.id]!;
      return {
        account_id: account.id,
        account_name: account.name,
        account_type: account.accountType,
        debit: sums.debit,
        credit: sums.credit,
      };
    })
    .filter((a) => a.debit !== 0 || a.credit !== 0);

  const total_debit = accounts.reduce((s, a) => s + a.debit, 0);
  const total_credit = accounts.reduce((s, a) => s + a.credit, 0);
  const is_balanced = Math.abs(total_debit - total_credit) < 0.01;

  return {
    year,
    accounts,
    total_debit,
    total_credit,
    is_balanced,
  };
}

export async function getTrialBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const data = await computeTrialBalance(year);

    if (req.query.format === 'pdf') {
      const buffer = await generateTrialBalancePdf(data as TrialBalanceData);
      return sendPdfBuffer(res, buffer, `trial-balance-${year}.pdf`);
    }

    res.json(data);
  } catch (err) { next(err); }
}

function assignBucket(daysOverdue: number): string {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1_30';
  if (daysOverdue <= 60) return '31_60';
  if (daysOverdue <= 90) return '61_90';
  return '90_plus';
}

export async function getAgingReceivables(req: Request, res: Response, next: NextFunction) {
  try {
    const today = new Date();

    const invoices = await prisma.customerInvoice.findMany({
      where: {
        status: { in: ['confirmed', 'paid'] },
        amountDue: { gt: 0 },
      },
      include: { customer: true },
    });

    const byCustomer: Record<string, { contact_id: string; contact_name: string; invoices: any[]; total_due: number }> = {};

    for (const inv of invoices) {
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / 86400000));
      const bucket = assignBucket(daysOverdue);
      const amountDue = Number(inv.amountDue);

      if (!byCustomer[inv.customerId]) {
        byCustomer[inv.customerId] = {
          contact_id: inv.customerId,
          contact_name: inv.customer.name,
          invoices: [],
          total_due: 0,
        };
      }

      byCustomer[inv.customerId].invoices.push({
        invoice_id: inv.id,
        invoice_number: inv.invoiceNumber,
        total: Number(inv.total),
        amount_due: amountDue,
        due_date: inv.dueDate,
        days_overdue: daysOverdue,
        bucket,
      });
      byCustomer[inv.customerId].total_due += amountDue;
    }

    const customers = Object.values(byCustomer).sort((a, b) => b.total_due - a.total_due);

    const bucket_totals = { current: 0, '1_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 };
    let grand_total = 0;

    for (const c of customers) {
      for (const inv of c.invoices) {
        bucket_totals[inv.bucket as keyof typeof bucket_totals] += inv.amount_due;
        grand_total += inv.amount_due;
      }
    }

    res.json({
      as_of_date: today,
      customers,
      bucket_totals,
      grand_total,
    });
  } catch (err) { next(err); }
}

export async function getAgingPayables(req: Request, res: Response, next: NextFunction) {
  try {
    const today = new Date();

    const bills = await prisma.vendorBill.findMany({
      where: {
        status: { in: ['confirmed', 'paid'] },
        amountDue: { gt: 0 },
      },
      include: { vendor: true },
    });

    const byVendor: Record<string, { contact_id: string; contact_name: string; bills: any[]; total_due: number }> = {};

    for (const bill of bills) {
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - new Date(bill.dueDate).getTime()) / 86400000));
      const bucket = assignBucket(daysOverdue);
      const amountDue = Number(bill.amountDue);

      if (!byVendor[bill.vendorId]) {
        byVendor[bill.vendorId] = {
          contact_id: bill.vendorId,
          contact_name: bill.vendor.name,
          bills: [],
          total_due: 0,
        };
      }

      byVendor[bill.vendorId].bills.push({
        bill_id: bill.id,
        bill_reference: bill.billReference,
        total: Number(bill.total),
        amount_due: amountDue,
        due_date: bill.dueDate,
        days_overdue: daysOverdue,
        bucket,
      });
      byVendor[bill.vendorId].total_due += amountDue;
    }

    const vendors = Object.values(byVendor).sort((a, b) => b.total_due - a.total_due);

    const bucket_totals = { current: 0, '1_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 };
    let grand_total = 0;

    for (const v of vendors) {
      for (const bill of v.bills) {
        bucket_totals[bill.bucket as keyof typeof bucket_totals] += bill.amount_due;
        grand_total += bill.amount_due;
      }
    }

    res.json({
      as_of_date: today,
      vendors,
      bucket_totals,
      grand_total,
    });
  } catch (err) { next(err); }
}

export async function getBudgetReport(req: Request, res: Response, next: NextFunction) {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const type = req.query.type as string | undefined;

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const where: any = {
      startDate: { gte: startDate },
      endDate: { lte: endDate },
    };
    if (type) where.type = type;

    const budgets = await prisma.budget.findMany({
      where,
      include: { responsible: true, analytical: true },
      orderBy: { createdAt: 'desc' },
    });

    const budgetsReport = await Promise.all(
      budgets.map(async (budget) => {
        let achievedAmount = 0;

        if (budget.type === 'income') {
          const invoices = await prisma.customerInvoice.findMany({
            where: {
              status: { in: ['confirmed', 'paid'] },
              invoiceDate: { gte: new Date(budget.startDate), lte: new Date(budget.endDate) },
              invoiceLines: { some: { budgetAnalyticId: budget.analyticalId } },
            },
            include: { invoiceLines: { where: { budgetAnalyticId: budget.analyticalId } } },
          });
          achievedAmount = invoices.reduce((sum, inv) => {
            return sum + inv.invoiceLines.reduce((ls, l) => ls + Number(l.total), 0);
          }, 0);
        } else {
          const bills = await prisma.vendorBill.findMany({
            where: {
              status: { in: ['confirmed', 'paid'] },
              billDate: { gte: new Date(budget.startDate), lte: new Date(budget.endDate) },
              billLines: { some: { budgetAnalyticId: budget.analyticalId } },
            },
            include: { billLines: { where: { budgetAnalyticId: budget.analyticalId } } },
          });
          achievedAmount = bills.reduce((sum, bill) => {
            return sum + bill.billLines.reduce((ls, l) => ls + Number(l.total), 0);
          }, 0);
        }

        const committedAmount = Number(budget.committedAmount) || 0;
        const achievedPercentage = committedAmount > 0 ? Math.round((achievedAmount / committedAmount) * 100) : 0;
        const amountToAchieve = committedAmount > 0 ? committedAmount - achievedAmount : 0;

        return {
          id: budget.id,
          name: budget.name,
          start_date: budget.startDate,
          end_date: budget.endDate,
          type: budget.type,
          committed_amount: Number(budget.committedAmount) || 0,
          achieved_amount: achievedAmount,
          achieved_percentage: achievedPercentage,
          amount_to_achieve: amountToAchieve,
          status: budget.status,
        };
      })
    );

    res.json({ budgets: budgetsReport });
  } catch (err) { next(err); }
}

async function computeCashFlowStatement(year: number) {
  const fromDate = new Date(year, 0, 1);
  const toDate = new Date(year, 11, 31, 23, 59, 59);
  const prevToDate = new Date(year - 1, 11, 31, 23, 59, 59);

  const [cashBankAccounts, assetAccounts, capitalAccounts, liabilityAccounts] = await Promise.all([
    prisma.chartOfAccount.findMany({ where: { accountType: { in: ['cash', 'bank'] } } }),
    prisma.chartOfAccount.findMany({ where: { accountType: 'asset' } }),
    prisma.chartOfAccount.findMany({ where: { accountType: 'capital' } }),
    prisma.chartOfAccount.findMany({ where: { accountType: 'liability' } }),
  ]);

  const cashBankIds = cashBankAccounts.map((a) => a.id);
  const assetIds = assetAccounts.map((a) => a.id);
  const capitalIds = capitalAccounts.map((a) => a.id);
  const liabilityIds = liabilityAccounts.map((a) => a.id);

  // All posted lines for the year affecting cash/bank accounts
  const cashLines = await prisma.journalEntryLine.findMany({
    where: {
      accountId: { in: cashBankIds },
      journalEntry: { status: 'posted', accountingDate: { gte: fromDate, lte: toDate } },
    },
    include: { account: true, journalEntry: true },
  });

  // All posted lines for prior year to compute opening balance
  const prevCashLines = await prisma.journalEntryLine.findMany({
    where: {
      accountId: { in: cashBankIds },
      journalEntry: { status: 'posted', accountingDate: { lte: prevToDate } },
    },
  });

  // Opening balance = sum of all prior year cash/bank movements
  const openingBalance = prevCashLines.reduce(
    (s, l) => s + Number(l.debit) - Number(l.credit),
    0,
  );

  // Operating: cash/bank lines paired with income or expense accounts
  // Investing: cash/bank lines paired with asset accounts
  // Financing: cash/bank lines paired with capital or liability accounts
  const operatingItems: { description: string; amount: number }[] = [];
  const investingItems: { description: string; amount: number }[] = [];
  const financingItems: { description: string; amount: number }[] = [];

  for (const line of cashLines) {
    const amount = Number(line.debit) - Number(line.credit);
    const desc = line.account.name;
    const entryDate = line.journalEntry.accountingDate;

    // Find the offsetting entry lines to classify the transaction
    const otherLines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntryId: line.journalEntryId,
        id: { not: line.id },
      },
      include: { account: true },
    });

    const hasIncome = otherLines.some((l) => l.account.accountType === 'income');
    const hasExpense = otherLines.some((l) => l.account.accountType === 'expense');
    const hasAsset = otherLines.some((l) => l.account.accountType === 'asset');
    const hasCapital = otherLines.some((l) => l.account.accountType === 'capital');
    const hasLiability = otherLines.some((l) => l.account.accountType === 'liability');

    const month = entryDate.toLocaleString('en-US', { month: 'short' });
    const label = `${desc} (${month})`;

    if (hasIncome || hasExpense) {
      operatingItems.push({ description: label, amount });
    } else if (hasAsset) {
      investingItems.push({ description: label, amount });
    } else if (hasCapital || hasLiability) {
      financingItems.push({ description: label, amount });
    } else {
      operatingItems.push({ description: label, amount });
    }
  }

  const operatingTotal = operatingItems.reduce((s, i) => s + i.amount, 0);
  const investingTotal = investingItems.reduce((s, i) => s + i.amount, 0);
  const financingTotal = financingItems.reduce((s, i) => s + i.amount, 0);
  const netChange = operatingTotal + investingTotal + financingTotal;

  return {
    year,
    operating: { items: operatingItems, total: operatingTotal },
    investing: { items: investingItems, total: investingTotal },
    financing: { items: financingItems, total: financingTotal },
    net_change: netChange,
    opening_balance: openingBalance,
    closing_balance: openingBalance + netChange,
  };
}

export async function getCashFlowStatement(req: Request, res: Response, next: NextFunction) {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const data = await computeCashFlowStatement(year);
    res.json(data);
  } catch (err) { next(err); }
}

export async function getCashFlowPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const data = await computeCashFlowStatement(year);
    const buffer = await generateCashFlowPdf(data as CashFlowData);
    return sendPdfBuffer(res, buffer, `cash-flow-statement-${year}.pdf`);
  } catch (err) { next(err); }
}

function GST_RATE(row: any): number {
  return Number(row.taxRate ?? 0);
}

export async function getGstr1(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const fromDate = new Date(year, month - 1, 1);
    const toDate = new Date(year, month, 0, 23, 59, 59);

    const invoices = await prisma.customerInvoice.findMany({
      where: {
        status: { in: ['confirmed', 'paid'] },
        invoiceDate: { gte: fromDate, lte: toDate },
      },
      include: {
        customer: true,
        invoiceLines: { include: { product: true } },
      },
      orderBy: { invoiceDate: 'asc' },
    });

    const invoiceDtos = invoices.map((inv) => {
      const taxableValue = Number(inv.subtotal);
      const igst = Number(inv.taxAmount) * 0.5;
      const cgst = Number(inv.taxAmount) * 0.25;
      const sgst = Number(inv.taxAmount) * 0.25;

      const hsnMap: Record<string, any> = {};
      for (const line of inv.invoiceLines) {
        const hsn = line.product?.hsnCode || 'UNKNOWN';
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = { hsn_code: hsn, description: line.product?.name || '', uqc: 'PCS', total_quantity: 0, total_value: 0, taxable_value: 0, igst: 0, cgst: 0, sgst: 0 };
        }
        const h = hsnMap[hsn];
        const lineTaxable = Number(line.unitPrice) * Number(line.qty);
        const lineTax = lineTaxable * (Number(line.taxRate) / 100);
        h.total_quantity += Number(line.qty);
        h.total_value += Number(line.total);
        h.taxable_value += lineTaxable;
        h.igst += lineTax * 0.5;
        h.cgst += lineTax * 0.25;
        h.sgst += lineTax * 0.25;
      }

      return {
        invoice_id: inv.id,
        invoice_number: inv.invoiceNumber,
        date: inv.invoiceDate.toISOString().slice(0, 10),
        customer_name: inv.customer.name,
        customer_gstin: inv.customer.gstin || null,
        place_of_supply: inv.customer.state || '',
        invoice_type: 'B2B',
        taxable_value: taxableValue,
        igst,
        cgst,
        sgst,
        total: Number(inv.total),
        hsn_summary: Object.values(hsnMap),
      };
    });

    const hsnAgg: Record<string, any> = {};
    for (const inv of invoiceDtos) {
      for (const h of inv.hsn_summary) {
        if (!hsnAgg[h.hsn_code]) {
          hsnAgg[h.hsn_code] = { ...h };
        } else {
          hsnAgg[h.hsn_code].total_quantity += h.total_quantity;
          hsnAgg[h.hsn_code].total_value += h.total_value;
          hsnAgg[h.hsn_code].taxable_value += h.taxable_value;
          hsnAgg[h.hsn_code].igst += h.igst;
          hsnAgg[h.hsn_code].cgst += h.cgst;
          hsnAgg[h.hsn_code].sgst += h.sgst;
        }
      }
    }

    const summary = {
      total_taxable_value: invoiceDtos.reduce((s, i) => s + i.taxable_value, 0),
      total_igst: invoiceDtos.reduce((s, i) => s + i.igst, 0),
      total_cgst: invoiceDtos.reduce((s, i) => s + i.cgst, 0),
      total_sgst: invoiceDtos.reduce((s, i) => s + i.sgst, 0),
      total_invoices: invoiceDtos.length,
    };

    res.json({
      period: `${year}-${String(month).padStart(2, '0')}`,
      summary,
      invoices: invoiceDtos,
      hsn_summary: Object.values(hsnAgg),
    });
  } catch (err) { next(err); }
}

export async function getGstr1Pdf(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const fromDate = new Date(year, month - 1, 1);
    const toDate = new Date(year, month, 0, 23, 59, 59);

    const invoices = await prisma.customerInvoice.findMany({
      where: {
        status: { in: ['confirmed', 'paid'] },
        invoiceDate: { gte: fromDate, lte: toDate },
      },
      include: {
        customer: true,
        invoiceLines: { include: { product: true } },
      },
      orderBy: { invoiceDate: 'asc' },
    });

    const invoiceDtos = invoices.map((inv) => {
      const taxableValue = Number(inv.subtotal);
      const igst = Number(inv.taxAmount) * 0.5;
      const cgst = Number(inv.taxAmount) * 0.25;
      const sgst = Number(inv.taxAmount) * 0.25;

      const hsnMap: Record<string, any> = {};
      for (const line of inv.invoiceLines) {
        const hsn = line.product?.hsnCode || 'UNKNOWN';
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = { hsn_code: hsn, description: line.product?.name || '', uqc: 'PCS', total_quantity: 0, total_value: 0, taxable_value: 0, igst: 0, cgst: 0, sgst: 0 };
        }
        const h = hsnMap[hsn];
        const lineTaxable = Number(line.unitPrice) * Number(line.qty);
        const lineTax = lineTaxable * (Number(line.taxRate) / 100);
        h.total_quantity += Number(line.qty);
        h.total_value += Number(line.total);
        h.taxable_value += lineTaxable;
        h.igst += lineTax * 0.5;
        h.cgst += lineTax * 0.25;
        h.sgst += lineTax * 0.25;
      }

      return {
        invoice_id: inv.id,
        invoice_number: inv.invoiceNumber,
        date: inv.invoiceDate.toISOString().slice(0, 10),
        customer_name: inv.customer.name,
        customer_gstin: inv.customer.gstin || null,
        place_of_supply: inv.customer.state || '',
        invoice_type: 'B2B',
        taxable_value: taxableValue,
        igst,
        cgst,
        sgst,
        total: Number(inv.total),
        hsn_summary: Object.values(hsnMap),
      };
    });

    const hsnAgg: Record<string, any> = {};
    for (const inv of invoiceDtos) {
      for (const h of inv.hsn_summary) {
        if (!hsnAgg[h.hsn_code]) {
          hsnAgg[h.hsn_code] = { ...h };
        } else {
          hsnAgg[h.hsn_code].total_quantity += h.total_quantity;
          hsnAgg[h.hsn_code].total_value += h.total_value;
          hsnAgg[h.hsn_code].taxable_value += h.taxable_value;
          hsnAgg[h.hsn_code].igst += h.igst;
          hsnAgg[h.hsn_code].cgst += h.cgst;
          hsnAgg[h.hsn_code].sgst += h.sgst;
        }
      }
    }

    const summary = {
      total_taxable_value: invoiceDtos.reduce((s, i) => s + i.taxable_value, 0),
      total_igst: invoiceDtos.reduce((s, i) => s + i.igst, 0),
      total_cgst: invoiceDtos.reduce((s, i) => s + i.cgst, 0),
      total_sgst: invoiceDtos.reduce((s, i) => s + i.sgst, 0),
      total_invoices: invoiceDtos.length,
    };

    const data: Gstr1Data = {
      period: `${year}-${String(month).padStart(2, '0')}`,
      summary,
      invoices: invoiceDtos,
      hsn_summary: Object.values(hsnAgg),
    };

    const buffer = await generateGstr1Pdf(data);
    return sendPdfBuffer(res, buffer, `gstr-1-${year}-${String(month).padStart(2, '0')}.pdf`);
  } catch (err) { next(err); }
}

export async function getGstr3b(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const fromDate = new Date(year, month - 1, 1);
    const toDate = new Date(year, month, 0, 23, 59, 59);

    const [invoices, bills] = await Promise.all([
      prisma.customerInvoice.findMany({
        where: { status: { in: ['confirmed', 'paid'] }, invoiceDate: { gte: fromDate, lte: toDate } },
        include: { customer: true },
      }),
      prisma.vendorBill.findMany({
        where: { status: { in: ['confirmed', 'paid'] }, billDate: { gte: fromDate, lte: toDate } },
        include: { vendor: true },
      }),
    ]);

    let taxableOutward = 0;
    let totalIgst = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let interState = 0;
    let intraState = 0;

    for (const inv of invoices) {
      const taxable = Number(inv.subtotal);
      const tax = Number(inv.taxAmount);
      taxableOutward += taxable;
      totalIgst += tax * 0.5;
      totalCgst += tax * 0.25;
      totalSgst += tax * 0.25;

      const custState = inv.customer.state?.trim().toLowerCase() || '';
      const ourState = 'maharashtra';
      if (custState === ourState) {
        intraState += taxable;
      } else {
        interState += taxable;
      }
    }

    let eligibleIgst = 0;
    let eligibleCgst = 0;
    let eligibleSgst = 0;

    for (const bill of bills) {
      const tax = Number(bill.taxAmount);
      eligibleIgst += tax * 0.5;
      eligibleCgst += tax * 0.25;
      eligibleSgst += tax * 0.25;
    }

    const data: Gstr3bData = {
      period: `${year}-${String(month).padStart(2, '0')}`,
      '3_1': {
        taxable_outward: taxableOutward,
        zero_rated: 0,
        deemed_exports: 0,
        reverse_charge: 0,
        total_outward: taxableOutward,
      },
      '3_2': { inter_state: interState, intra_state: intraState },
      '4': { total_igst: totalIgst, total_cgst: totalCgst, total_sgst: totalSgst, total_cess: 0 },
      '5': { eligible_itc_igst: eligibleIgst, eligible_itc_cgst: eligibleCgst, eligible_itc_sgst: eligibleSgst, ineligible_itc: 0 },
      '6': {
        tax_payable_igst: totalIgst - eligibleIgst,
        tax_payable_cgst: totalCgst - eligibleCgst,
        tax_payable_sgst: totalSgst - eligibleSgst,
        interest: 0,
        late_fee: 0,
        total_tax_payable: (totalIgst - eligibleIgst) + (totalCgst - eligibleCgst) + (totalSgst - eligibleSgst),
      },
    };

    res.json(data);
  } catch (err) { next(err); }
}

export async function getGstr3bPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const fromDate = new Date(year, month - 1, 1);
    const toDate = new Date(year, month, 0, 23, 59, 59);

    const [invoices, bills] = await Promise.all([
      prisma.customerInvoice.findMany({
        where: { status: { in: ['confirmed', 'paid'] }, invoiceDate: { gte: fromDate, lte: toDate } },
        include: { customer: true },
      }),
      prisma.vendorBill.findMany({
        where: { status: { in: ['confirmed', 'paid'] }, billDate: { gte: fromDate, lte: toDate } },
        include: { vendor: true },
      }),
    ]);

    let taxableOutward = 0;
    let totalIgst = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let interState = 0;
    let intraState = 0;

    for (const inv of invoices) {
      const taxable = Number(inv.subtotal);
      const tax = Number(inv.taxAmount);
      taxableOutward += taxable;
      totalIgst += tax * 0.5;
      totalCgst += tax * 0.25;
      totalSgst += tax * 0.25;

      const custState = inv.customer.state?.trim().toLowerCase() || '';
      const ourState = 'maharashtra';
      if (custState === ourState) {
        intraState += taxable;
      } else {
        interState += taxable;
      }
    }

    let eligibleIgst = 0;
    let eligibleCgst = 0;
    let eligibleSgst = 0;

    for (const bill of bills) {
      const tax = Number(bill.taxAmount);
      eligibleIgst += tax * 0.5;
      eligibleCgst += tax * 0.25;
      eligibleSgst += tax * 0.25;
    }

    const data: Gstr3bData = {
      period: `${year}-${String(month).padStart(2, '0')}`,
      '3_1': {
        taxable_outward: taxableOutward,
        zero_rated: 0,
        deemed_exports: 0,
        reverse_charge: 0,
        total_outward: taxableOutward,
      },
      '3_2': { inter_state: interState, intra_state: intraState },
      '4': { total_igst: totalIgst, total_cgst: totalCgst, total_sgst: totalSgst, total_cess: 0 },
      '5': { eligible_itc_igst: eligibleIgst, eligible_itc_cgst: eligibleCgst, eligible_itc_sgst: eligibleSgst, ineligible_itc: 0 },
      '6': {
        tax_payable_igst: totalIgst - eligibleIgst,
        tax_payable_cgst: totalCgst - eligibleCgst,
        tax_payable_sgst: totalSgst - eligibleSgst,
        interest: 0,
        late_fee: 0,
        total_tax_payable: (totalIgst - eligibleIgst) + (totalCgst - eligibleCgst) + (totalSgst - eligibleSgst),
      },
    };

    const buffer = await generateGstr3bPdf(data);
    return sendPdfBuffer(res, buffer, `gstr-3b-${year}-${String(month).padStart(2, '0')}.pdf`);
  } catch (err) { next(err); }
}