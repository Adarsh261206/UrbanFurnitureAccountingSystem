import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { listPayments, getPayment, createPayment, confirmPayment } from '../controllers/paymentController';
import { paymentCreateValidation } from '../validators/transactionValidators';

const router = Router();

router.use(authenticate);

router.get('/', authorizeResource('payment', 'read'), listPayments);
router.get('/:id', authorizeResource('payment', 'read'), getPayment);
router.post('/', authorizeResource('payment', 'create'), paymentCreateValidation, createPayment);
router.post('/:id/confirm', authorizeResource('payment', 'confirm'), confirmPayment);

export default router;
