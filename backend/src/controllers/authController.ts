import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { authConfig } from '../config/auth';
import { AppError } from '../utils/errors';

export async function signup(req: Request, res: Response, next: NextFunction) {
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
      select: { id: true, name: true, loginId: true, email: true, role: true, isActive: true, createdAt: true },
    });

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      authConfig.jwtSecret,
      { expiresIn: 86400 }
    );

    res.cookie(authConfig.cookieName, token, authConfig.cookieOptions);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { loginId, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { OR: [{ loginId }, { email: loginId }] },
    });
    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid login ID or password', 401, 'loginId');
    }
    if (!user.isActive) {
      throw new AppError('ACCOUNT_DISABLED', 'Account has been disabled', 403, 'loginId');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid login ID or password', 401, 'loginId');
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      authConfig.jwtSecret,
      { expiresIn: 86400 }
    );

    res.cookie(authConfig.cookieName, token, authConfig.cookieOptions);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        loginId: user.loginId,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(authConfig.cookieName, { path: '/api' });
  res.json({ message: 'Logged out successfully' });
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, loginId: true, email: true, role: true, isActive: true, createdAt: true },
    });
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
