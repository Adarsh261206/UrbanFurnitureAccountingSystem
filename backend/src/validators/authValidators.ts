import { body } from 'express-validator';
import { validate } from '../middleware/validate';

export const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('loginId').trim().isLength({ min: 6, max: 12 }).withMessage('Login ID must be 6-12 characters'),
  body('login_id').optional().trim().isLength({ min: 6, max: 12 }).withMessage('Login ID must be 6-12 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').custom((value) => {
    if (typeof value !== 'string' || value.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (!/[a-z]/.test(value)) throw new Error('Password must contain at least one lowercase letter');
    if (!/[A-Z]/.test(value)) throw new Error('Password must contain at least one uppercase letter');
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=;'[\]\\/]/.test(value)) {
      throw new Error('Password must contain at least one special character');
    }
    return true;
  }),
  body('confirmPassword').notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('confirm_password').optional().custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  validate,
];

export const loginValidation = [
  body('loginId').trim().notEmpty().withMessage('Login ID is required'),
  body('login_id').optional().trim().notEmpty().withMessage('Login ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];