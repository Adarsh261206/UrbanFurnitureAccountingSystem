import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { serializeBudgetDetail, serializeBudgetListRow } from '../utils/serializers';

export async function listBudgets(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.type) where.type = req.query.type;
    if (req.query.analytical_id) where.analyticalId = req.query.analytical_id;
    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search, mode: 'insensitive' } },
        { responsible: { is: { name: { contains: req.query.search, mode: 'insensitive' } } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { responsible: true },
      }),
      prisma.budget.count({ where }),
    ]);

    const budgets = await Promise.all(
      data.map(async (budget) => {
        const achievedAmount = await calculateAchievement(budget);
        return serializeBudgetListRow({ ...budget, achievedAmount });
      })
    );

    res.json({ budgets, total, page, limit });
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
    res.json(serializeBudgetDetail({ ...budget, achievedAmount }));
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
        invoiceDate: { gte: startDate, lte: endDate },
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
        billDate: { gte: startDate, lte: endDate },
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
    const budget = await prisma.budget.create({
      data: {
        name: req.body.name,
        responsibleId: req.body.responsible_id,
        startDate: new Date(req.body.start_date),
        endDate: new Date(req.body.end_date),
        type: req.body.type,
        analyticalId: req.body.analytical_id,
        committedAmount: req.body.committed_amount ? parseFloat(req.body.committed_amount) : null,
        status: 'draft',
      },
      include: { responsible: true, analytical: true },
    });

    res.status(201).json(serializeBudgetDetail(budget));
  } catch (err) { next(err); }
}

export async function updateBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!budget) throw new AppError('NOT_FOUND', 'Budget not found', 404);
    if (budget.status !== 'draft' && budget.status !== 'revised') {
      throw new AppError('DRAFT_REQUIRED', 'Only draft or revised budgets can be updated', 400);
    }

    const updateData: any = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.responsible_id !== undefined) updateData.responsibleId = req.body.responsible_id;
    if (req.body.start_date !== undefined) updateData.startDate = new Date(req.body.start_date);
    if (req.body.end_date !== undefined) updateData.endDate = new Date(req.body.end_date);
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.analytical_id !== undefined) updateData.analyticalId = req.body.analytical_id;
    if (req.body.committed_amount !== undefined) {
      updateData.committedAmount = req.body.committed_amount ? parseFloat(req.body.committed_amount) : null;
    }

    const updated = await prisma.budget.update({
      where: { id: req.params.id },
      data: updateData,
      include: { responsible: true, analytical: true },
    });

    res.json(serializeBudgetDetail(updated));
  } catch (err) { next(err); }
}

export async function confirmBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!budget) throw new AppError('NOT_FOUND', 'Budget not found', 404);
    if (budget.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft budgets can be confirmed', 400);

    const body = req.body ?? {};
    const rawAmount = body.committed_amount !== undefined ? body.committed_amount : body.committedAmount;
    if (rawAmount === undefined || rawAmount === null || rawAmount === '') {
      throw new AppError('AMOUNT_REQUIRED', 'Committed amount is required to confirm a budget', 400, 'committed_amount');
    }
    const committedAmount = parseFloat(rawAmount);

    const updated = await prisma.budget.update({
      where: { id: req.params.id },
      data: { status: 'confirmed', committedAmount },
      include: { responsible: true, analytical: true },
    });

    res.json(serializeBudgetDetail(updated));
  } catch (err) { next(err); }
}

export async function reviseBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!budget) throw new AppError('NOT_FOUND', 'Budget not found', 404);
    if (budget.status !== 'confirmed') throw new AppError('CONFIRMED_REQUIRED', 'Only confirmed budgets can be revised', 400);

    const body = req.body ?? {};
    const rawAmount = body.committed_amount !== undefined ? body.committed_amount : body.committedAmount;
    const committedAmount = rawAmount !== undefined && rawAmount !== null && rawAmount !== ''
      ? parseFloat(rawAmount)
      : budget.committedAmount;

    const result = await prisma.$transaction(async (tx) => {
      const revised = await tx.budget.create({
        data: {
          name: `${budget.name} (Revised)`,
          responsibleId: budget.responsibleId,
          startDate: budget.startDate,
          endDate: budget.endDate,
          type: budget.type,
          analyticalId: budget.analyticalId,
          committedAmount,
          status: 'draft',
          originalBudgetId: budget.id,
        },
        include: { responsible: true, analytical: true },
      });

      await tx.budget.update({
        where: { id: budget.id },
        data: { status: 'revised' },
      });

      return revised;
    }, { isolationLevel: 'Serializable' });

    res.status(201).json(serializeBudgetDetail(result));
  } catch (err) { next(err); }
}

export async function cancelBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!budget) throw new AppError('NOT_FOUND', 'Budget not found', 404);
    if (budget.status === 'cancelled') throw new AppError('ALREADY_CANCELLED', 'Budget is already cancelled', 400);

    const updated = await prisma.budget.update({
      where: { id: req.params.id },
      data: { status: 'cancelled', isArchived: true },
      include: { responsible: true, analytical: true },
    });

    res.json(serializeBudgetDetail(updated));
  } catch (err) { next(err); }
}

export async function archiveBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!budget) throw new AppError('NOT_FOUND', 'Budget not found', 404);

    const updated = await prisma.budget.update({
      where: { id: req.params.id },
      data: { isArchived: true },
      include: { responsible: true, analytical: true },
    });

    res.json(serializeBudgetDetail(updated));
  } catch (err) { next(err); }
}