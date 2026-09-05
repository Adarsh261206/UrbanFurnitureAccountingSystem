import { body } from 'express-validator';
import { validate } from '../middleware/validate';

export const contactCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('street').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('pincode').optional().trim(),
  validate,
];

export const contactUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('street').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('pincode').optional().trim(),
  validate,
];

export const productCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('productType').isIn(['goods', 'service', 'combo']).withMessage('Invalid product type'),
  body('categoryId').isUUID().withMessage('Valid category ID is required'),
  body('salesPrice').optional().isFloat({ min: 0 }).withMessage('Sales price must be non-negative'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be non-negative'),
  validate,
];

export const productUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('productType').optional().isIn(['goods', 'service', 'combo']).withMessage('Invalid product type'),
  body('categoryId').optional().isUUID().withMessage('Valid category ID is required'),
  body('salesPrice').optional().isFloat({ min: 0 }).withMessage('Sales price must be non-negative'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be non-negative'),
  validate,
];

export const categoryCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  validate,
];

export const categoryUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  validate,
];

export const analyticalCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('responsibleId').isUUID().withMessage('Valid responsible contact ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('toDate').isISO8601().withMessage('Valid to date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('analyticAccount').trim().notEmpty().withMessage('Analytic account is required'),
  body('analytical_account').optional().trim().notEmpty().withMessage('Analytic account is required'),
  validate,
];

export const analyticalUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('responsibleId').optional().isUUID().withMessage('Valid responsible contact ID is required'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('toDate').optional().isISO8601().withMessage('Valid to date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('analyticAccount').optional().trim().notEmpty().withMessage('Analytic account cannot be empty'),
  body('analytical_account').optional().trim().notEmpty().withMessage('Analytic account cannot be empty'),
  validate,
];

export const coaCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('accountType').isIn(['asset', 'liability', 'bank', 'capital', 'cash', 'income', 'expense']).withMessage('Invalid account type'),
  body('journalType').optional().trim(),
  validate,
];

export const coaUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('accountType').optional().isIn(['asset', 'liability', 'bank', 'capital', 'cash', 'income', 'expense']).withMessage('Invalid account type'),
  body('journalType').optional().trim(),
  validate,
];

export const journalCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('journalType').isIn(['sale', 'purchase', 'bank', 'cash']).withMessage('Invalid journal type'),
  body('defaultAccountId').isUUID().withMessage('Valid default account ID is required'),
  validate,
];

export const journalUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('journalType').optional().isIn(['sale', 'purchase', 'bank', 'cash']).withMessage('Invalid journal type'),
  body('defaultAccountId').optional().isUUID().withMessage('Valid default account ID is required'),
  validate,
];

export const userUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['admin', 'accountant', 'user']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  validate,
];

export const userCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('loginId').trim().isLength({ min: 6, max: 12 }).withMessage('Login ID must be 6-12 characters'),
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
  body('role').optional().isIn(['admin', 'accountant', 'user']).withMessage('Invalid role'),
  validate,
];
