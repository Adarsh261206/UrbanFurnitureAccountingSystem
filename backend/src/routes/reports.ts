import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { getProfitAndLoss, getBalanceSheet } from '../controllers/reportController';

const router = Router();

router.use(authenticate);

router.get('/profit-and-loss', authorizeResource('report', 'read'), getProfitAndLoss);
router.get('/balance-sheet', authorizeResource('report', 'read'), getBalanceSheet);

export default router;
