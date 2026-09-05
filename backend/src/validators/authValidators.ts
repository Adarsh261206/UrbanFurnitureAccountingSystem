import { body } from 'express-validator';
import { validate } from '../middleware/validate';

export const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('loginId').trim().notEmpty().isLength({ max: 12 }).withMessage('Login ID is required (max 12 chars)'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'accountant', 'user']).withMessage('Invalid role'),
  validate,
];

export const loginValidation = [
  body('loginId').trim().notEmpty().withMessage('Login ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];
