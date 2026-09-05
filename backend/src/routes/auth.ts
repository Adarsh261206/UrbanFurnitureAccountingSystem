import { Router } from 'express';
import { signup, login, logout, me, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { signupValidation, loginValidation, resetPasswordValidation } from '../validators/authValidators';
import { loginLimiter, signupLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/signup', signupLimiter, signupValidation, signup);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);

export default router;