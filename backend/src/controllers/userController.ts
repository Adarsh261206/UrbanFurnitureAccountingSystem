import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { authConfig } from '../config/auth';

const userSelect = {
  id: true,
  name: true,
  loginId: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' }, select: userSelect }),
      prisma.user.count(),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) { next(err); }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    res.json({ data: user });
  } catch (err) { next(err); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, loginId, email, password, role } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ loginId }, { email }] },
    });
    if (existingUser) {
      throw new AppError('USER_EXISTS', 'User with this login ID or email already exists', 409, 'loginId');
    }

    const passwordHash = await bcrypt.hash(password, authConfig.bcryptRounds);
    const user = await prisma.user.create({
      data: {
        name,
        loginId,
        email,
        passwordHash,
        role: role || 'user',
      },
      select: userSelect,
    });

    res.status(201).json({ data: user });
  } catch (err) { next(err); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(email && { email }), ...(role && { role }), ...(isActive !== undefined && { isActive }) },
      select: userSelect,
    });
    res.json({ data: user });
  } catch (err) { next(err); }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.status(204).send();
  } catch (err) { next(err); }
}
