import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { getProfitAndLoss, getBalanceSheet, getBudgetReport, getTrialBalance, getCashFlowStatement, getCashFlowPdf, getAgingReceivables, getAgingPayables } from '../controllers/reportController';

const router = Router();

router.use(authenticate);

router.get('/profit-and-loss', authorizeResource('report', 'read'), getProfitAndLoss);
router.get('/balance-sheet', authorizeResource('report', 'read'), getBalanceSheet);
router.get('/budget-report', authorizeResource('report', 'read'), getBudgetReport);
router.get('/trial-balance', authorizeResource('report', 'read'), getTrialBalance);
router.get('/cash-flow', authorizeResource('report', 'read'), getCashFlowStatement);
router.get('/cash-flow/pdf', authorizeResource('report', 'read'), getCashFlowPdf);
router.get('/aging-receivables', authorizeResource('report', 'read'), getAgingReceivables);
router.get('/aging-payables', authorizeResource('report', 'read'), getAgingPayables);

export default router;