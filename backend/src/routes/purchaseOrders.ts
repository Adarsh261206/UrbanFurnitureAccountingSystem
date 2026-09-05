import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, confirmPurchaseOrder } from '../controllers/purchaseOrderController';

const router = Router();

router.use(authenticate);

router.get('/', authorizeResource('purchaseOrder', 'read'), listPurchaseOrders);
router.get('/:id', authorizeResource('purchaseOrder', 'read'), getPurchaseOrder);
router.post('/', authorizeResource('purchaseOrder', 'create'), createPurchaseOrder);
router.post('/:id/confirm', authorizeResource('purchaseOrder', 'confirm'), confirmPurchaseOrder);

export default router;
