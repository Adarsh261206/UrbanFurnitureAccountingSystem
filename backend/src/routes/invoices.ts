import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { listInvoices, getInvoice, createInvoice, confirmInvoice, cancelInvoice } from '../controllers/invoiceController';

const router = Router();

router.use(authenticate);

router.get('/', authorizeResource('customerInvoice', 'read'), listInvoices);
router.get('/:id', authorizeResource('customerInvoice', 'read'), getInvoice);
router.post('/', authorizeResource('customerInvoice', 'create'), createInvoice);
router.post('/:id/confirm', authorizeResource('customerInvoice', 'confirm'), confirmInvoice);
router.post('/:id/cancel', authorizeResource('customerInvoice', 'cancel'), cancelInvoice);

export default router;
