import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { GenericController } from './genericController';

const controller = new GenericController(prisma, 'category');

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await controller.list(req.query);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await controller.getById(req.params.id);
    res.json({ data: item });
  } catch (err) { next(err); }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await controller.create(req.body);
    res.status(201).json({ data: item });
  } catch (err) { next(err); }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await controller.update(req.params.id, req.body);
    res.json({ data: item });
  } catch (err) { next(err); }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await controller.softDelete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}
