import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export async function getProfitAndLoss(req: Request, res: Response, next: NextFunction) {
  try {
    const fromDate = req.query.from ? new Date(req.query.from as string) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = req.query.to ? new Date(req.query.to as string) : new Date();

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
      data: {
        period: { from: fromDate, to: toDate },
        income: Object.values(incomeByAccount),
        totalIncome,
        expenses: Object.values(expenseByAccount),
        totalExpenses,
        netProfit,
      },
    });
  } catch (err) { next(err); }
}

export async function getBalanceSheet(req: Request, res: Response, next: NextFunction) {
  try {
    const asOfDate = req.query.asOf ? new Date(req.query.asOf as string) : new Date();

    const [assetAccounts, liabilityAccounts, capitalAccounts] = await Promise.all([
      prisma.chartOfAccount.findMany({ where: { accountType: { in: ['asset', 'bank', 'cash'] } } }),
      prisma.chartOfAccount.findMany({ where: { accountType: 'liability' } }),
      prisma.chartOfAccount.findMany({ where: { accountType: 'capital' } }),
    ]);

    const allAccountIds = [...assetAccounts, ...liabilityAccounts, ...capitalAccounts].map((a) => a.id);

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
    for (const account of [...assetAccounts, ...liabilityAccounts, ...capitalAccounts]) {
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
      .filter((a) => a.type === 'liability')
      .reduce((s, a) => s + a.balance, 0);

    const totalCapital = Object.values(accountBalances)
      .filter((a) => a.type === 'capital')
      .reduce((s, a) => s + a.balance, 0);

    const balanceCheck = Math.abs(totalAssets - (totalLiabilities + totalCapital)) < 0.01;

    res.json({
      data: {
        asOf: asOfDate,
        assets: Object.values(accountBalances).filter((a) => ['asset', 'bank', 'cash'].includes(a.type)),
        totalAssets,
        liabilities: Object.values(accountBalances).filter((a) => a.type === 'liability'),
        totalLiabilities,
        capital: Object.values(accountBalances).filter((a) => a.type === 'capital'),
        totalCapital,
        balanceCheck,
      },
    });
  } catch (err) { next(err); }
}
