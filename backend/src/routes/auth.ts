import { Router } from 'express';
import { signup, login, logout, me } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { signupValidation, loginValidation } from '../validators/authValidators';
import { loginLimiter, signupLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/signup', signupLimiter, signupValidation, signup);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
