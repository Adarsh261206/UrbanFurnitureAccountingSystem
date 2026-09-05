import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { GenericController } from './genericController';

const controller = new GenericController(prisma, 'chartOfAccount');

export async function listCOA(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await controller.list(req.query);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getCOA(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await controller.getById(req.params.id);
    res.json({ data: item });
  } catch (err) { next(err); }
}

export async function createCOA(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await controller.create(req.body);
    res.status(201).json({ data: item });
  } catch (err) { next(err); }
}

export async function updateCOA(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await controller.update(req.params.id, req.body);
    res.json({ data: item });
  } catch (err) { next(err); }
}

export async function deleteCOA(req: Request, res: Response, next: NextFunction) {
  try {
    await controller.softDelete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}
