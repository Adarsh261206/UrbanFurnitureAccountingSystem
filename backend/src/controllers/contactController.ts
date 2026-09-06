import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { serializeContact } from '../utils/serializers';
import { GenericController } from './genericController';
import { logAudit } from '../services/auditService';

const controller = new GenericController(prisma, 'contact');

export async function listContacts(req: Request, res: Response, next: NextFunction) {
  try {
    const query: any = { ...req.query };
    const where: any = { deletedAt: null };
    if (query.contact_type) where.contactType = query.contact_type;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const result = await controller.list({ ...query, where });
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
      contactType: req.body.contact_type ?? 'both',
      gstin: req.body.gstin ?? null,
      pan: req.body.pan ?? null,
    };
    const item = await controller.create(data);

    logAudit({
      userId: req.user!.id,
      action: 'create',
      entity: 'contact',
      entityId: item.id,
      entityName: item.name,
      newValues: { name: item.name, contact_type: item.contactType },
      req,
    });

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
    if (req.body.contact_type !== undefined) data.contactType = req.body.contact_type;
    if (req.body.gstin !== undefined) data.gstin = req.body.gstin;
    if (req.body.pan !== undefined) data.pan = req.body.pan;
    const item = await controller.update(req.params.id, data);

    logAudit({
      userId: req.user!.id,
      action: 'update',
      entity: 'contact',
      entityId: item.id,
      entityName: item.name,
      newValues: { name: item.name, contact_type: item.contactType },
      req,
    });

    res.json(serializeContact(item));
  } catch (err) { next(err); }
}

export async function deleteContact(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await controller.getById(req.params.id);
    await controller.softDelete(req.params.id);

    logAudit({
      userId: req.user!.id,
      action: 'delete',
      entity: 'contact',
      entityId: item.id,
      entityName: item.name,
      oldValues: { name: item.name, contact_type: item.contactType },
      req,
    });

    res.status(204).send();
  } catch (err) { next(err); }
}