import { Request, Response, NextFunction } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

function noopMiddleware(_req: Request, _res: Response, next: NextFunction) {
  next();
}

export const loginLimiter = isTest ? noopMiddleware : rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again later.',
      field: null,
      details: {},
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const signupLimiter = isTest ? noopMiddleware : rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many signup attempts. Please try again later.',
      field: null,
      details: {},
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = isTest ? noopMiddleware : rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      field: null,
      details: {},
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.user?.id || ipKeyGenerator(req.ip);
  },
});