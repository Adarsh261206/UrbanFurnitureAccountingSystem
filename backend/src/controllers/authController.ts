import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { authConfig } from '../config/auth';
import { AppError } from '../utils/errors';
import { serializeUser } from '../utils/serializers';

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const loginId = req.body.login_id ?? req.body.loginId;
    const email = req.body.email;
    const password = req.body.password;
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
      data: {
        name: name ?? null,
        loginId,
        email,
        passwordHash,
        role: 'user',
      },
    });

    res.status(201).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const loginId = req.body.login_id ?? req.body.loginId;
    const password = req.body.password;

    const user = await prisma.user.findFirst({
      where: { OR: [{ loginId }, { email: loginId }] },
    });
    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid Login Id or Password', 401, 'login_id');
    }
    if (!user.isActive) {
      throw new AppError('ACCOUNT_DISABLED', 'Account has been disabled', 403, 'login_id');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid Login Id or Password', 401, 'login_id');
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      authConfig.jwtSecret,
      { expiresIn: authConfig.jwtExpiry }
    );

    res.cookie(authConfig.cookieName, token, authConfig.cookieOptions);
    res.json({ user: serializeUser(user) });
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
    });
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    res.json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(_req: Request, res: Response, next: NextFunction) {
  try {
    // Mock per 22_AUTHENTICATION_AND_SESSION §12: no actual email is sent.
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (err) { next(err); }
}