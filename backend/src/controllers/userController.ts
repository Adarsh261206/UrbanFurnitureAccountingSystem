import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { authConfig } from '../config/auth';
import { serializeUser } from '../utils/serializers';
import { sendApprovalEmail, sendRejectionEmail } from '../services/mailService';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.user.count(),
    ]);

    res.json({ users: users.map(serializeUser), total, page, limit });
  } catch (err) { next(err); }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    res.json(serializeUser(user));
  } catch (err) { next(err); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const loginId = req.body.login_id ?? req.body.loginId;
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role || 'user';
    const name = req.body.name;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ loginId }, { email }] },
    });
    if (existing) {
      if (existing.loginId === loginId) {
        throw new AppError('DUPLICATE_LOGIN_ID', 'This Login Id is already taken', 409, 'login_id');
      }
      throw new AppError('DUPLICATE_EMAIL', 'This email is already registered', 409, 'email');
    }

    const passwordHash = await bcrypt.hash(password, authConfig.bcryptRounds);
    const user = await prisma.user.create({
      data: { name, loginId, email, passwordHash, role },
    });

    res.status(201).json(serializeUser(user));
  } catch (err) { next(err); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const role = req.body.role;
    const isActive = req.body.is_active ?? req.body.isActive;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });
    res.json(serializeUser(user));
  } catch (err) { next(err); }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function approveUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    if (user.approvalStatus === 'approved') {
      throw new AppError('ALREADY_APPROVED', 'User is already approved', 400);
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'approved', isActive: true },
    });

    // Auto-create a customer contact from the approved user's name/email so
    // they appear in Contacts immediately (skip if the email is taken).
    const existingContact = await prisma.contact.findUnique({
      where: { email: updated.email },
    });
    if (!existingContact) {
      await prisma.contact
        .create({
          data: {
            name: updated.name || updated.loginId,
            email: updated.email,
            contactType: 'customer',
          },
        })
        .catch(() => {
          // Race safety — a contact with this email may have been created meanwhile.
        });
    }

    await sendApprovalEmail(updated.email, updated.name);
    res.json(serializeUser(updated));
  } catch (err) { next(err); }
}

export async function rejectUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    if (user.approvalStatus === 'rejected') {
      throw new AppError('ALREADY_REJECTED', 'User is already rejected', 400);
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'rejected', isActive: false },
    });

    await sendRejectionEmail(updated.email, updated.name);
    res.json(serializeUser(updated));
  } catch (err) { next(err); }
}