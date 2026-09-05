import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const lineFields = () => [
  body('lines.*.product_id').isUUID().withMessage('Valid product_id is required for each line'),
  body('lines.*.account_id').isUUID().withMessage('Valid account_id is required for each line'),
  body('lines.*.analytical_id').optional().isUUID().withMessage('Valid analytical_id is required for each line'),
  body('lines.*.quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
];

export const salesOrderCreateValidation = [
  body('customer_id').isUUID().withMessage('Valid customer ID is required'),
  body('order_date').isISO8601().withMessage('Valid order date is required'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line is required'),
  ...lineFields(),
  validate,
];

export const salesOrderUpdateValidation = [
  body('customer_id').optional().isUUID().withMessage('Valid customer ID is required'),
  body('order_date').optional().isISO8601().withMessage('Valid order date is required'),
  body('lines').optional().isArray({ min: 1 }).withMessage('At least one line is required'),
  ...lineFields(),
  validate,
];

export const purchaseOrderCreateValidation = [
  body('vendor_id').isUUID().withMessage('Valid vendor ID is required'),
  body('order_date').isISO8601().withMessage('Valid order date is required'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line is required'),
  ...lineFields(),
  validate,
];

export const purchaseOrderUpdateValidation = [
  body('vendor_id').optional().isUUID().withMessage('Valid vendor ID is required'),
  body('order_date').optional().isISO8601().withMessage('Valid order date is required'),
  body('lines').optional().isArray({ min: 1 }).withMessage('At least one line is required'),
  ...lineFields(),
  validate,
];

export const invoiceCreateValidation = [
  body('customer_id').isUUID().withMessage('Valid customer ID is required'),
  body('invoice_date').isISO8601().withMessage('Valid invoice date is required'),
  body('due_date').isISO8601().withMessage('Valid due date is required'),
  body('sales_order_id').optional().isUUID().withMessage('Valid sales_order_id if provided'),
  body('payment_type').optional().isIn(['receive', 'send']).withMessage('Invalid payment type'),
  body('payment_via').optional().isIn(['bank', 'cash']).withMessage('Invalid payment via'),
  body('partner_id').optional().isUUID().withMessage('Valid partner_id if provided'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line is required'),
  ...lineFields(),
  validate,
];

export const invoiceUpdateValidation = [
  body('customer_id').optional().isUUID().withMessage('Valid customer ID is required'),
  body('invoice_date').optional().isISO8601().withMessage('Valid invoice date is required'),
  body('due_date').optional().isISO8601().withMessage('Valid due date is required'),
  body('payment_type').optional().isIn(['receive', 'send']).withMessage('Invalid payment type'),
  body('payment_via').optional().isIn(['bank', 'cash']).withMessage('Invalid payment via'),
  body('partner_id').optional().isUUID().withMessage('Valid partner_id if provided'),
  body('lines').optional().isArray({ min: 1 }).withMessage('At least one line is required'),
  ...lineFields(),
  validate,
];

export const invoicePayValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('payment_via').optional().isIn(['bank', 'cash']).withMessage('Payment via must be bank or cash'),
  body('payment_date').optional().isISO8601().withMessage('Valid payment date is required'),
  validate,
];

export const billCreateValidation = [
  body('vendor_id').isUUID().withMessage('Valid vendor ID is required'),
  body('bill_date').isISO8601().withMessage('Valid bill date is required'),
  body('due_date').isISO8601().withMessage('Valid due date is required'),
  body('purchase_order_id').optional().isUUID().withMessage('Valid purchase_order_id if provided'),
  body('payment_type').optional().isIn(['receive', 'send']).withMessage('Invalid payment type'),
  body('payment_via').optional().isIn(['bank', 'cash']).withMessage('Invalid payment via'),
  body('partner_id').optional().isUUID().withMessage('Valid partner_id if provided'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line is required'),
  ...lineFields(),
  validate,
];

export const billUpdateValidation = [
  body('vendor_id').optional().isUUID().withMessage('Valid vendor ID is required'),
  body('bill_date').optional().isISO8601().withMessage('Valid bill date is required'),
  body('due_date').optional().isISO8601().withMessage('Valid due date is required'),
  body('payment_type').optional().isIn(['receive', 'send']).withMessage('Invalid payment type'),
  body('payment_via').optional().isIn(['bank', 'cash']).withMessage('Invalid payment via'),
  body('partner_id').optional().isUUID().withMessage('Valid partner_id if provided'),
  body('vendor_bill_no').optional().trim(),
  body('lines').optional().isArray({ min: 1 }).withMessage('At least one line is required'),
  ...lineFields(),
  validate,
];

export const billPayValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('payment_via').optional().isIn(['bank', 'cash']).withMessage('Payment via must be bank or cash'),
  body('payment_date').optional().isISO8601().withMessage('Valid payment date is required'),
  validate,
];

export const paymentCreateValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('payment_via').isIn(['bank', 'cash']).withMessage('Payment via must be bank or cash'),
  body('payment_date').optional().isISO8601().withMessage('Valid payment date is required'),
  body('invoice_id').optional().isUUID().withMessage('Valid invoice ID if provided'),
  body('vendor_bill_id').optional().isUUID().withMessage('Valid vendor bill ID if provided'),
  validate,
];

export const budgetCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('responsible_id').isUUID().withMessage('Valid responsible contact ID is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('type').isIn(['income', 'expense']).withMessage('Invalid budget type'),
  body('analytical_id').isUUID().withMessage('Valid analytical ID is required'),
  body('committed_amount').optional().isFloat({ min: 0 }).withMessage('Committed amount must be non-negative'),
  validate,
];

export const budgetUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('responsible_id').optional().isUUID().withMessage('Valid responsible contact ID is required'),
  body('start_date').optional().isISO8601().withMessage('Valid start date is required'),
  body('end_date').optional().isISO8601().withMessage('Valid end date is required'),
  body('type').optional().isIn(['income', 'expense']).withMessage('Invalid budget type'),
  body('analytical_id').optional().isUUID().withMessage('Valid analytical ID is required'),
  body('committed_amount').optional().isFloat({ min: 0 }).withMessage('Committed amount must be non-negative'),
  validate,
];

export const journalEntryCreateValidation = [
  body('journal_id').isUUID().withMessage('Valid journal ID is required'),
  body('accounting_date').isISO8601().withMessage('Valid accounting date is required'),
  body('reference').optional().trim(),
  body('lines').isArray({ min: 2 }).withMessage('At least two lines are required'),
  body('lines.*.account_id').isUUID().withMessage('Valid account ID is required for each line'),
  body('lines.*.partner_id').optional().isUUID().withMessage('Valid partner ID if provided'),
  body('lines.*.debit').isFloat({ min: 0 }).withMessage('Debit must be non-negative'),
  body('lines.*.credit').isFloat({ min: 0 }).withMessage('Credit must be non-negative'),
  validate,
];