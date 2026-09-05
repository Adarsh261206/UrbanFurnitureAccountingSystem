import { body } from 'express-validator';
import { validate } from '../middleware/validate';

export const salesOrderCreateValidation = [
  body('customerId').isUUID().withMessage('Valid customer ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('invoiceDate').isISO8601().withMessage('Valid invoice date is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line is required'),
  body('lines.*.productId').optional().isUUID().withMessage('Valid product ID is required for each line'),
  body('lines.*.product_id').optional().isUUID().withMessage('Valid product_id is required for each line'),
  body('lines.*.accountId').optional().isUUID().withMessage('Valid account ID is required for each line'),
  body('lines.*.chart_of_account_id').optional().isUUID().withMessage('Valid chart_of_account_id is required for each line'),
  body('lines.*.qty').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.quantity').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('lines.*.unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  validate,
];

export const salesOrderUpdateValidation = [
  body('customerId').optional().isUUID().withMessage('Valid customer ID is required'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('invoiceDate').optional().isISO8601().withMessage('Valid invoice date is required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
  body('lines').optional().isArray({ min: 1 }).withMessage('At least one line is required'),
  body('lines.*.productId').optional().isUUID().withMessage('Valid product ID is required for each line'),
  body('lines.*.product_id').optional().isUUID().withMessage('Valid product_id is required for each line'),
  body('lines.*.accountId').optional().isUUID().withMessage('Valid account ID is required for each line'),
  body('lines.*.chart_of_account_id').optional().isUUID().withMessage('Valid chart_of_account_id is required for each line'),
  body('lines.*.qty').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.quantity').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('lines.*.unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  validate,
];

export const purchaseOrderCreateValidation = [
  body('vendorId').isUUID().withMessage('Valid vendor ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('billDate').isISO8601().withMessage('Valid bill date is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line is required'),
  body('lines.*.productId').optional().isUUID().withMessage('Valid product ID is required for each line'),
  body('lines.*.product_id').optional().isUUID().withMessage('Valid product_id is required for each line'),
  body('lines.*.accountId').optional().isUUID().withMessage('Valid account ID is required for each line'),
  body('lines.*.chart_of_account_id').optional().isUUID().withMessage('Valid chart_of_account_id is required for each line'),
  body('lines.*.qty').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.quantity').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('lines.*.unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  validate,
];

export const purchaseOrderUpdateValidation = [
  body('vendorId').optional().isUUID().withMessage('Valid vendor ID is required'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('billDate').optional().isISO8601().withMessage('Valid bill date is required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
  body('lines').optional().isArray({ min: 1 }).withMessage('At least one line is required'),
  body('lines.*.productId').optional().isUUID().withMessage('Valid product ID is required for each line'),
  body('lines.*.product_id').optional().isUUID().withMessage('Valid product_id is required for each line'),
  body('lines.*.accountId').optional().isUUID().withMessage('Valid account ID is required for each line'),
  body('lines.*.chart_of_account_id').optional().isUUID().withMessage('Valid chart_of_account_id is required for each line'),
  body('lines.*.qty').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.quantity').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('lines.*.unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  validate,
];

export const invoiceCreateValidation = [
  body('customerId').isUUID().withMessage('Valid customer ID is required'),
  body('partnerId').optional().isUUID().withMessage('Valid partner ID if provided'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('invoiceDate').isISO8601().withMessage('Valid invoice date is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('paymentType').optional().isIn(['receive', 'send']).withMessage('Invalid payment type'),
  body('paymentVia').optional().isIn(['bank', 'cash']).withMessage('Invalid payment via'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line is required'),
  body('lines.*.productId').optional().isUUID().withMessage('Valid product ID is required for each line'),
  body('lines.*.product_id').optional().isUUID().withMessage('Valid product_id is required for each line'),
  body('lines.*.accountId').optional().isUUID().withMessage('Valid account ID is required for each line'),
  body('lines.*.chart_of_account_id').optional().isUUID().withMessage('Valid chart_of_account_id is required for each line'),
  body('lines.*.qty').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.quantity').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('lines.*.unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  validate,
];

export const invoiceUpdateValidation = [
  body('customerId').optional().isUUID().withMessage('Valid customer ID is required'),
  body('partnerId').optional().isUUID().withMessage('Valid partner ID if provided'),
  body('invoiceDate').optional().isISO8601().withMessage('Valid invoice date is required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
  body('paymentType').optional().isIn(['receive', 'send']).withMessage('Invalid payment type'),
  body('paymentVia').optional().isIn(['bank', 'cash']).withMessage('Invalid payment via'),
  body('lines').optional().isArray({ min: 1 }).withMessage('At least one line is required'),
  body('lines.*.productId').optional().isUUID().withMessage('Valid product ID is required for each line'),
  body('lines.*.product_id').optional().isUUID().withMessage('Valid product_id is required for each line'),
  body('lines.*.accountId').optional().isUUID().withMessage('Valid account ID is required for each line'),
  body('lines.*.chart_of_account_id').optional().isUUID().withMessage('Valid chart_of_account_id is required for each line'),
  body('lines.*.qty').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.quantity').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('lines.*.unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  validate,
];

export const invoicePayValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('paymentVia').optional().isIn(['bank', 'cash']).withMessage('Payment via must be bank or cash'),
  body('paymentDate').optional().isISO8601().withMessage('Valid payment date is required'),
  validate,
];

export const billCreateValidation = [
  body('vendorId').isUUID().withMessage('Valid vendor ID is required'),
  body('partnerId').optional().isUUID().withMessage('Valid partner ID if provided'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('billDate').isISO8601().withMessage('Valid bill date is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('paymentType').optional().isIn(['receive', 'send']).withMessage('Invalid payment type'),
  body('paymentVia').optional().isIn(['bank', 'cash']).withMessage('Invalid payment via'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line is required'),
  body('lines.*.productId').optional().isUUID().withMessage('Valid product ID is required for each line'),
  body('lines.*.product_id').optional().isUUID().withMessage('Valid product_id is required for each line'),
  body('lines.*.accountId').optional().isUUID().withMessage('Valid account ID is required for each line'),
  body('lines.*.chart_of_account_id').optional().isUUID().withMessage('Valid chart_of_account_id is required for each line'),
  body('lines.*.qty').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.quantity').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('lines.*.unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  validate,
];

export const billUpdateValidation = [
  body('vendorId').optional().isUUID().withMessage('Valid vendor ID is required'),
  body('partnerId').optional().isUUID().withMessage('Valid partner ID if provided'),
  body('billDate').optional().isISO8601().withMessage('Valid bill date is required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
  body('paymentType').optional().isIn(['receive', 'send']).withMessage('Invalid payment type'),
  body('paymentVia').optional().isIn(['bank', 'cash']).withMessage('Invalid payment via'),
  body('vendorBillNo').optional().trim(),
  body('lines').optional().isArray({ min: 1 }).withMessage('At least one line is required'),
  body('lines.*.productId').optional().isUUID().withMessage('Valid product ID is required for each line'),
  body('lines.*.product_id').optional().isUUID().withMessage('Valid product_id is required for each line'),
  body('lines.*.accountId').optional().isUUID().withMessage('Valid account ID is required for each line'),
  body('lines.*.chart_of_account_id').optional().isUUID().withMessage('Valid chart_of_account_id is required for each line'),
  body('lines.*.qty').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.quantity').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('lines.*.unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  validate,
];

export const billPayValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('paymentVia').optional().isIn(['bank', 'cash']).withMessage('Payment via must be bank or cash'),
  body('paymentDate').optional().isISO8601().withMessage('Valid payment date is required'),
  validate,
];

export const paymentCreateValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('paymentVia').isIn(['bank', 'cash']).withMessage('Payment via must be bank or cash'),
  body('paymentDate').optional().isISO8601().withMessage('Valid payment date is required'),
  body('invoiceId').optional().isUUID().withMessage('Valid invoice ID if provided'),
  body('vendorBillId').optional().isUUID().withMessage('Valid vendor bill ID if provided'),
  validate,
];

export const budgetCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('responsibleId').isUUID().withMessage('Valid responsible contact ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('type').isIn(['income', 'expense']).withMessage('Invalid budget type'),
  body('analyticalId').isUUID().withMessage('Valid analytical ID is required'),
  body('committedAmount').optional().isFloat({ min: 0 }).withMessage('Committed amount must be non-negative'),
  validate,
];

export const budgetUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('responsibleId').optional().isUUID().withMessage('Valid responsible contact ID is required'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('type').optional().isIn(['income', 'expense']).withMessage('Invalid budget type'),
  body('analyticalId').optional().isUUID().withMessage('Valid analytical ID is required'),
  body('committedAmount').optional().isFloat({ min: 0 }).withMessage('Committed amount must be non-negative'),
  validate,
];

export const journalEntryCreateValidation = [
  body('accountingDate').isISO8601().withMessage('Valid accounting date is required'),
  body('journalId').isUUID().withMessage('Valid journal ID is required'),
  body('lines').isArray({ min: 2 }).withMessage('At least two lines are required'),
  body('lines.*.accountId').isUUID().withMessage('Valid account ID is required for each line'),
  body('lines.*.debit').isFloat({ min: 0 }).withMessage('Debit must be non-negative'),
  body('lines.*.credit').isFloat({ min: 0 }).withMessage('Credit must be non-negative'),
  validate,
];