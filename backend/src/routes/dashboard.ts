import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { getDashboard, getReceivables, getPayables, getDashboardSummary } from '../controllers/dashboardController';

const router = Router();

router.use(authenticate);

router.get('/', authorizeResource('dashboard', 'read'), getDashboard);
router.get('/receivables', authorizeResource('dashboard', 'read'), getReceivables);
router.get('/payables', authorizeResource('dashboard', 'read'), getPayables);
router.get('/summary', authorizeResource('dashboard', 'read'), getDashboardSummary);

export default router;
