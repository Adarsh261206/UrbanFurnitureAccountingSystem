import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { listBills, getBill, createBill, confirmBill, cancelBill } from '../controllers/billController';
import { billCreateValidation } from '../validators/transactionValidators';

const router = Router();

router.use(authenticate);

router.get('/', authorizeResource('vendorBill', 'read'), listBills);
router.get('/:id', authorizeResource('vendorBill', 'read'), getBill);
router.post('/', authorizeResource('vendorBill', 'create'), billCreateValidation, createBill);
router.post('/:id/confirm', authorizeResource('vendorBill', 'confirm'), confirmBill);
router.post('/:id/cancel', authorizeResource('vendorBill', 'cancel'), cancelBill);

export default router;
