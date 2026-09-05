import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { GenericController } from './genericController';

const controller = new GenericController(prisma, 'contact');

export async function listContacts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await controller.list(req.query);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getContact(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await controller.getById(req.params.id);
    res.json({ data: item });
  } catch (err) { next(err); }
}

export async function createContact(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await controller.create(req.body);
    res.status(201).json({ data: item });
  } catch (err) { next(err); }
}

export async function updateContact(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await controller.update(req.params.id, req.body);
    res.json({ data: item });
  } catch (err) { next(err); }
}

export async function deleteContact(req: Request, res: Response, next: NextFunction) {
  try {
    await controller.softDelete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}
