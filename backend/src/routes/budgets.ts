import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { listBudgets, getBudget, createBudget, updateBudget, confirmBudget, reviseBudget, cancelBudget, archiveBudget } from '../controllers/budgetController';
import { budgetCreateValidation, budgetUpdateValidation } from '../validators/transactionValidators';

const router = Router();

router.use(authenticate);

router.get('/', authorizeResource('budget', 'read'), listBudgets);
router.get('/:id', authorizeResource('budget', 'read'), getBudget);
router.post('/', authorizeResource('budget', 'create'), budgetCreateValidation, createBudget);
router.put('/:id', authorizeResource('budget', 'update'), budgetUpdateValidation, updateBudget);
router.put('/:id/confirm', authorizeResource('budget', 'confirm'), confirmBudget);
router.post('/:id/confirm', authorizeResource('budget', 'confirm'), confirmBudget);
router.post('/:id/revise', authorizeResource('budget', 'revise'), reviseBudget);
router.put('/:id/cancel', authorizeResource('budget', 'cancel'), cancelBudget);
router.post('/:id/cancel', authorizeResource('budget', 'cancel'), cancelBudget);
router.post('/:id/archive', authorizeResource('budget', 'update'), archiveBudget);

export default router;