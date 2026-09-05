import { body } from 'express-validator';
import { validate } from '../middleware/validate';

export const contactCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('image_url').optional().trim(),
  body('street').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('pincode').optional().trim(),
  body('contact_type').optional().isIn(['customer', 'vendor', 'both']).withMessage('Invalid contact type'),
  body('gstin').optional().trim(),
  body('pan').optional().trim(),
  validate,
];

export const contactUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('image_url').optional().trim(),
  body('street').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('pincode').optional().trim(),
  body('contact_type').optional().isIn(['customer', 'vendor', 'both']).withMessage('Invalid contact type'),
  body('gstin').optional().trim(),
  body('pan').optional().trim(),
  validate,
];

export const productCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('product_type').isIn(['goods', 'service', 'combo']).withMessage('Invalid product type'),
  body('category_id').optional().isUUID().withMessage('Valid category ID is required'),
  body('category_name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
  body('sales_price').optional().isFloat({ min: 0 }).withMessage('Sales price must be non-negative'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be non-negative'),
  body('image_url').optional().trim(),
  body('sku').optional().trim(),
  body('barcode').optional().trim(),
  body('hsn_code').optional().trim(),
  body('description').optional().trim(),
  body('brand_id').optional().isUUID().withMessage('Valid brand ID is required'),
  body('brand_name').optional().trim().notEmpty().withMessage('Brand name cannot be empty'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
  validate,
];

export const productUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('product_type').optional().isIn(['goods', 'service', 'combo']).withMessage('Invalid product type'),
  body('category_id').optional().isUUID().withMessage('Valid category ID is required'),
  body('sales_price').optional().isFloat({ min: 0 }).withMessage('Sales price must be non-negative'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be non-negative'),
  body('image_url').optional().trim(),
  body('sku').optional().trim(),
  body('barcode').optional().trim(),
  body('hsn_code').optional().trim(),
  body('description').optional().trim(),
  body('brand_id').optional().isUUID().withMessage('Valid brand ID is required'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
  validate,
];

export const brandCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  validate,
];

export const brandUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
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
  body('responsible_id').isUUID().withMessage('Valid responsible contact ID is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('to_date').isISO8601().withMessage('Valid to date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('analytic_account').trim().notEmpty().withMessage('Analytic account is required'),
  validate,
];

export const analyticalUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('responsible_id').optional().isUUID().withMessage('Valid responsible contact ID is required'),
  body('start_date').optional().isISO8601().withMessage('Valid start date is required'),
  body('to_date').optional().isISO8601().withMessage('Valid to date is required'),
  body('end_date').optional().isISO8601().withMessage('Valid end date is required'),
  body('analytic_account').optional().trim().notEmpty().withMessage('Analytic account cannot be empty'),
  validate,
];

export const coaCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('account_type').isIn(['asset', 'liability', 'bank', 'capital', 'cash', 'income', 'expense']).withMessage('Invalid account type'),
  body('journal_type').optional().trim(),
  validate,
];

export const coaUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('account_type').optional().isIn(['asset', 'liability', 'bank', 'capital', 'cash', 'income', 'expense']).withMessage('Invalid account type'),
  body('journal_type').optional().trim(),
  validate,
];

export const journalCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('journal_type').isIn(['sale', 'purchase', 'bank', 'cash']).withMessage('Invalid journal type'),
  body('default_account_id').isUUID().withMessage('Valid default account ID is required'),
  validate,
];

export const journalUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('journal_type').optional().isIn(['sale', 'purchase', 'bank', 'cash']).withMessage('Invalid journal type'),
  body('default_account_id').optional().isUUID().withMessage('Valid default account ID is required'),
  validate,
];

export const userCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
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
  body('confirm_password').optional(),
  body('role').optional().isIn(['admin', 'accountant', 'user']).withMessage('Invalid role'),
  validate,
];

export const userUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['admin', 'accountant', 'user']).withMessage('Invalid role'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
  validate,
];