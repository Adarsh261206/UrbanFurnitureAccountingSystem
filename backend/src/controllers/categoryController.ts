import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { serializeCategory } from '../utils/serializers';

export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
    res.json(data.map(serializeCategory));
  } catch (err) { next(err); }
}

export async function getCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.category.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!item) throw new AppError('NOT_FOUND', 'Category not found', 404);
    res.json(serializeCategory(item));
  } catch (err) { next(err); }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.category.create({ data: { name: req.body.name } });
    res.status(201).json(serializeCategory(item));
  } catch (err) { next(err); }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.category.update({ where: { id: req.params.id }, data: { name: req.body.name } });
    res.json(serializeCategory(item));
  } catch (err) { next(err); }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.category.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.status(204).send();
  } catch (err) { next(err); }
}