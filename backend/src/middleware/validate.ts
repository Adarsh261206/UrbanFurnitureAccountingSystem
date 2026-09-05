import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError.msg || 'Validation failed',
        field: (firstError as any).path || null,
        details: { errors: errors.array() },
      },
    });
  }
  next();
}
