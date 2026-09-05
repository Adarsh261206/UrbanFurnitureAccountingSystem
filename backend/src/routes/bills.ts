import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { listBills, getBill, createBill, updateBill, confirmBill, payBill, cancelBill, printBill, sendBill } from '../controllers/billController';
import { billCreateValidation, billUpdateValidation, billPayValidation } from '../validators/transactionValidators';

const router = Router();

router.use(authenticate);

router.get('/', authorizeResource('vendorBill', 'read'), listBills);
router.get('/:id', authorizeResource('vendorBill', 'read'), getBill);
router.post('/', authorizeResource('vendorBill', 'create'), billCreateValidation, createBill);
router.put('/:id', authorizeResource('vendorBill', 'update'), billUpdateValidation, updateBill);
router.post('/:id/confirm', authorizeResource('vendorBill', 'confirm'), confirmBill);
router.post('/:id/pay', authorizeResource('vendorBill', 'pay'), billPayValidation, payBill);
router.post('/:id/cancel', authorizeResource('vendorBill', 'cancel'), cancelBill);
router.post('/:id/print', authorizeResource('vendorBill', 'pay'), printBill);
router.post('/:id/send', authorizeResource('vendorBill', 'pay'), sendBill);

export default router;