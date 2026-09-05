import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

const PDF_STUB = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF\n');

function sendPdf(res: any) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  res.send(PDF_STUB);
}

export async function getProfitAndLoss(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.query.format === 'pdf') {
      return sendPdf(res);
    }

    let fromDate: Date;
    let toDate: Date;

    if (req.query.year) {
      const year = parseInt(req.query.year as string);
      fromDate = new Date(year, 0, 1);
      toDate = new Date(year, 11, 31, 23, 59, 59);
    } else if (req.query.from && req.query.to) {
      fromDate = new Date(req.query.from as string);
      toDate = new Date(req.query.to as string);
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

    res.json({
      year: req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear(),
      income: {
        items: Object.values(incomeByAccount).map((a) => ({ account_name: a.name, amount: a.amount })),
        total: totalIncome,
      },
      expenses: {
        items: Object.values(expenseByAccount).map((a) => ({ account_name: a.name, amount: a.amount })),
        total: totalExpenses,
      },
      net_income: netProfit,
    });
  } catch (err) { next(err); }
}

export async function getBalanceSheet(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.query.format === 'pdf') {
      return sendPdf(res);
    }

    let asOfDate: Date;

    if (req.query.year) {
      const year = parseInt(req.query.year as string);
      asOfDate = new Date(year, 11, 31, 23, 59, 59);
    } else if (req.query.asOf) {
      asOfDate = new Date(req.query.asOf as string);
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

    res.json({
      year: req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear(),
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