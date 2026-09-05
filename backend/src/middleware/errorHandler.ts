import { Request, Response, NextFunction } from 'express';
import { isAppError } from '../utils/errors';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  if (isAppError(err)) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        field: err.field || null,
        details: err.details || {},
      },
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid session',
        field: null,
        details: {},
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Session expired',
        field: null,
        details: {},
      },
    });
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message || 'Internal server error';

  return res.status(statusCode).json({
    error: {
      code: 'INTERNAL_ERROR',
      message,
      field: null,
      details: {},
    },
  });
}
