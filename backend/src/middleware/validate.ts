import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const WEAK_PASSWORD = 'Password does not meet the complexity requirements';

export function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    const msg = firstError.msg || 'Validation failed';
    const isWeakPassword = msg === 'WEAK_PASSWORD';
    return res.status(400).json({
      error: {
        code: isWeakPassword ? 'WEAK_PASSWORD' : 'VALIDATION_ERROR',
        message: isWeakPassword ? WEAK_PASSWORD : msg,
        field: isWeakPassword ? 'password' : ((firstError as any).path || null),
        details: { errors: errors.array() },
      },
    });
  }
  next();
}
