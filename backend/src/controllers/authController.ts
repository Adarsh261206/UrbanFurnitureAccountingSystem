import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database';
import { authConfig } from '../config/auth';
import { AppError } from '../utils/errors';
import { serializeUser } from '../utils/serializers';
import { sendResetPasswordEmail, appUrl } from '../services/mailService';

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
        isActive: false,
        approvalStatus: 'pending',
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
      where: { OR: [{ loginId }, { email: loginId }], deletedAt: null },
    });
    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid Login Id or Password', 401, 'login_id');
    }
    if (user.approvalStatus === 'pending') {
      throw new AppError(
        'ACCOUNT_PENDING_APPROVAL',
        'Your account is pending admin approval. Please try again later.',
        403,
        'login_id',
      );
    }
    if (user.approvalStatus === 'rejected') {
      throw new AppError(
        'ACCOUNT_REJECTED',
        'Your account request was not approved. Contact the administrator.',
        403,
        'login_id',
      );
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

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const email = req.body.email;
    const user = email
      ? await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
      : null;

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: tokenHash,
          resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      const resetUrl = `${appUrl()}/reset-password?token=${token}`;
      await sendResetPasswordEmail(user.email, user.name, resetUrl);
    }
    // Always return the same message — never leak which emails exist.
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (err) { next(err); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.body.token;
    const password = req.body.password;
    if (!token || !password) {
      throw new AppError('VALIDATION', 'Token and password are required', 400);
    }
    if (typeof password !== 'string' || password.length < 8) {
      throw new AppError('WEAK_PASSWORD', 'Password must be at least 8 characters', 400, 'password');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({
      where: { resetTokenHash: tokenHash, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) {
      throw new AppError('INVALID_TOKEN', 'Reset link is invalid or has expired', 400, 'token');
    }

    const passwordHash = await bcrypt.hash(password, authConfig.bcryptRounds);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetTokenHash: null, resetTokenExpiry: null },
    });

    res.json({ message: 'Password has been reset. You can now sign in.' });
  } catch (err) { next(err); }
}