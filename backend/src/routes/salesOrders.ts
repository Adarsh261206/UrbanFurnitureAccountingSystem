import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { listSalesOrders, getSalesOrder, createSalesOrder, updateSalesOrder, confirmSalesOrder } from '../controllers/salesOrderController';
import { salesOrderCreateValidation, salesOrderUpdateValidation } from '../validators/transactionValidators';

const router = Router();

router.use(authenticate);

router.get('/', authorizeResource('salesOrder', 'read'), listSalesOrders);
router.get('/:id', authorizeResource('salesOrder', 'read'), getSalesOrder);
router.post('/', authorizeResource('salesOrder', 'create'), salesOrderCreateValidation, createSalesOrder);
router.put('/:id', authorizeResource('salesOrder', 'update'), salesOrderUpdateValidation, updateSalesOrder);
router.put('/:id/confirm', authorizeResource('salesOrder', 'confirm'), confirmSalesOrder);
router.post('/:id/confirm', authorizeResource('salesOrder', 'confirm'), confirmSalesOrder);

export default router;