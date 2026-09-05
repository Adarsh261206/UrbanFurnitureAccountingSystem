import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { serializeContact } from '../utils/serializers';
import { GenericController } from './genericController';

const controller = new GenericController(prisma, 'contact');

export async function listContacts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await controller.list(req.query);
    res.json({ contacts: result.data.map(serializeContact), total: result.total, page: result.page, limit: result.limit });
  } catch (err) { next(err); }
}

export async function getContact(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await controller.getById(req.params.id);
    res.json(serializeContact(item));
  } catch (err) { next(err); }
}

export async function createContact(req: Request, res: Response, next: NextFunction) {
  try {
    const data = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone ?? null,
      imageUrl: req.body.image_url ?? null,
      street: req.body.street ?? null,
      city: req.body.city ?? null,
      state: req.body.state ?? null,
      country: req.body.country ?? null,
      pincode: req.body.pincode ?? null,
    };
    const item = await controller.create(data);
    res.status(201).json(serializeContact(item));
  } catch (err) { next(err); }
}

export async function updateContact(req: Request, res: Response, next: NextFunction) {
  try {
    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.email !== undefined) data.email = req.body.email;
    if (req.body.phone !== undefined) data.phone = req.body.phone;
    if (req.body.image_url !== undefined) data.imageUrl = req.body.image_url;
    if (req.body.street !== undefined) data.street = req.body.street;
    if (req.body.city !== undefined) data.city = req.body.city;
    if (req.body.state !== undefined) data.state = req.body.state;
    if (req.body.country !== undefined) data.country = req.body.country;
    if (req.body.pincode !== undefined) data.pincode = req.body.pincode;
    const item = await controller.update(req.params.id, data);
    res.json(serializeContact(item));
  } catch (err) { next(err); }
}

export async function deleteContact(req: Request, res: Response, next: NextFunction) {
  try {
    await controller.softDelete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}