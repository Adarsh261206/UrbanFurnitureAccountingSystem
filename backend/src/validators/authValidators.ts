import { body } from 'express-validator';
import { validate } from '../middleware/validate';

export const signupValidation = [
  body('login_id').trim().isLength({ min: 6, max: 12 }).withMessage('Login ID must be 6-12 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').custom((value) => {
    if (typeof value !== 'string' || value.length < 8) {
      throw new Error('WEAK_PASSWORD');
    }
    if (!/[a-z]/.test(value)) throw new Error('WEAK_PASSWORD');
    if (!/[A-Z]/.test(value)) throw new Error('WEAK_PASSWORD');
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=;'[\]\\/]/.test(value)) {
      throw new Error('WEAK_PASSWORD');
    }
    return true;
  }),
  body('confirm_password').notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  validate,
];

export const loginValidation = [
  body('login_id').trim().notEmpty().withMessage('Login ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

export const resetPasswordValidation = [
  body('token').trim().notEmpty().withMessage('Token is required'),
  body('password').custom((value) => {
    if (typeof value !== 'string' || value.length < 8) {
      throw new Error('WEAK_PASSWORD');
    }
    if (!/[a-z]/.test(value)) throw new Error('WEAK_PASSWORD');
    if (!/[A-Z]/.test(value)) throw new Error('WEAK_PASSWORD');
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=;'[\]\\/]/.test(value)) {
      throw new Error('WEAK_PASSWORD');
    }
    return true;
  }),
  body('confirm_password').notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  validate,
];