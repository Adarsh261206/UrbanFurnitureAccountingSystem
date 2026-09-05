import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { getSmtpSettings, updateSmtpSettings, testSmtpSettings } from '../controllers/settingsController';

const router = Router();

router.use(authenticate);

router.get('/smtp', authorizeResource('user', 'read'), getSmtpSettings);
router.put('/smtp', authorizeResource('user', 'update'), updateSmtpSettings);
router.post('/smtp/test', authorizeResource('user', 'update'), testSmtpSettings);

export default router;