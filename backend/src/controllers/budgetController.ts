import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

export async function listBudgets(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.type) where.type = req.query.type;
    if (req.query.analyticalId) where.analyticalId = req.query.analyticalId;

    const [data, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { responsible: true, analytical: true },
      }),
      prisma.budget.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) { next(err); }
}

export async function getBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: req.params.id },
      include: { responsible: true, analytical: true, revisions: true },
    });
    if (!budget) throw new AppError('NOT_FOUND', 'Budget not found', 404);

    const achievedAmount = await calculateAchievement(budget);
    const committedAmount = Number(budget.committedAmount) || 0;
    const amountToAchieve = committedAmount > 0 ? committedAmount - achievedAmount : 0;
    const achievedPercentage = committedAmount > 0 ? Math.round((achievedAmount / committedAmount) * 100) : 0;

    res.json({
      data: {
        ...budget,
        achievedAmount,
        achievedPercentage,
        amountToAchieve,
      },
    });
  } catch (err) { next(err); }
}

async function calculateAchievement(budget: any): Promise<number> {
  const startDate = new Date(budget.startDate);
  const endDate = new Date(budget.endDate);
  const analyticalId = budget.analyticalId;
  const type = budget.type;

  if (type === 'income') {
    const invoices = await prisma.customerInvoice.findMany({
      where: {
        status: { in: ['confirmed', 'paid'] },
        date: { gte: startDate, lte: endDate },
        invoiceLines: {
          some: { budgetAnalyticId: analyticalId },
        },
      },
      include: {
        invoiceLines: { where: { budgetAnalyticId: analyticalId } },
      },
    });
    return invoices.reduce((sum, inv) => {
      const lineTotal = inv.invoiceLines.reduce((ls, l) => ls + Number(l.total), 0);
      return sum + lineTotal;
    }, 0);
  } else {
    const bills = await prisma.vendorBill.findMany({
      where: {
        status: { in: ['confirmed', 'paid'] },
        date: { gte: startDate, lte: endDate },
        billLines: {
          some: { budgetAnalyticId: analyticalId },
        },
      },
      include: {
        billLines: { where: { budgetAnalyticId: analyticalId } },
      },
    });
    return bills.reduce((sum, bill) => {
      const lineTotal = bill.billLines.reduce((ls, l) => ls + Number(l.total), 0);
      return sum + lineTotal;
    }, 0);
  }
}

export async function createBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, responsibleId, startDate, endDate, type, analyticalId, committedAmount } = req.body;

    const budget = await prisma.budget.create({
      data: {
        name,
        responsibleId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        analyticalId,
        committedAmount: committedAmount ? parseFloat(committedAmount) : null,
        status: 'draft',
      },
      include: { responsible: true, analytical: true },
    });

    res.status(201).json({ data: budget });
  } catch (err) { next(err); }
}

export async function updateBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!budget) throw new AppError('NOT_FOUND', 'Budget not found', 404);
    if (budget.status !== 'draft' && budget.status !== 'revised') {
      throw new AppError('INVALID_STATUS', 'Only draft or revised budgets can be updated', 400);
    }

    const { name, responsibleId, startDate, endDate, type, analyticalId, committedAmount } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (responsibleId !== undefined) updateData.responsibleId = responsibleId;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (type !== undefined) updateData.type = type;
    if (analyticalId !== undefined) updateData.analyticalId = analyticalId;
    if (committedAmount !== undefined) updateData.committedAmount = committedAmount ? parseFloat(committedAmount) : null;

    const updated = await prisma.budget.update({
      where: { id: req.params.id },
      data: updateData,
      include: { responsible: true, analytical: true },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
}

export async function confirmBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!budget) throw new AppError('NOT_FOUND', 'Budget not found', 404);
    if (budget.status !== 'draft') throw new AppError('INVALID_STATUS', 'Only draft budgets can be confirmed', 400);

    const updated = await prisma.budget.update({
      where: { id: req.params.id },
      data: { status: 'confirmed' },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
}

export async function reviseBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!budget) throw new AppError('NOT_FOUND', 'Budget not found', 404);
    if (budget.status !== 'confirmed') throw new AppError('INVALID_STATUS', 'Only confirmed budgets can be revised', 400);

    const revised = await prisma.budget.create({
      data: {
        name: `${budget.name} (Revised)`,
        responsibleId: budget.responsibleId,
        startDate: budget.startDate,
        endDate: budget.endDate,
        type: budget.type,
        analyticalId: budget.analyticalId,
        committedAmount: req.body.committedAmount ? parseFloat(req.body.committedAmount) : budget.committedAmount,
        status: 'revised',
        originalBudgetId: budget.id,
      },
      include: { responsible: true, analytical: true },
    });

    res.status(201).json({ data: revised });
  } catch (err) { next(err); }
}

export async function cancelBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!budget) throw new AppError('NOT_FOUND', 'Budget not found', 404);
    if (budget.status === 'cancelled') throw new AppError('ALREADY_CANCELLED', 'Budget is already cancelled', 400);

    const updated = await prisma.budget.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
}

export async function archiveBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!budget) throw new AppError('NOT_FOUND', 'Budget not found', 404);

    const updated = await prisma.budget.update({
      where: { id: req.params.id },
      data: { isArchived: true },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
}
