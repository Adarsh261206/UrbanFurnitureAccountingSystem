import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { listInvoices, getInvoice, createInvoice, updateInvoice, confirmInvoice, payInvoice, cancelInvoice, printInvoice, sendInvoice } from '../controllers/invoiceController';
import { invoiceCreateValidation, invoiceUpdateValidation, invoicePayValidation } from '../validators/transactionValidators';

const router = Router();

router.use(authenticate);

router.get('/', authorizeResource('customerInvoice', 'read'), listInvoices);
router.get('/:id', authorizeResource('customerInvoice', 'read'), getInvoice);
router.post('/', authorizeResource('customerInvoice', 'create'), invoiceCreateValidation, createInvoice);
router.put('/:id', authorizeResource('customerInvoice', 'update'), invoiceUpdateValidation, updateInvoice);
router.post('/:id/confirm', authorizeResource('customerInvoice', 'confirm'), confirmInvoice);
router.post('/:id/pay', authorizeResource('customerInvoice', 'pay'), invoicePayValidation, payInvoice);
router.post('/:id/cancel', authorizeResource('customerInvoice', 'cancel'), cancelInvoice);
router.post('/:id/print', authorizeResource('customerInvoice', 'pay'), printInvoice);
router.post('/:id/send', authorizeResource('customerInvoice', 'pay'), sendInvoice);

export default router;