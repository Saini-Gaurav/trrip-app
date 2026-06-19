import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, registerSchema, loginSchema } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public — tight rate limit to prevent brute-force
router.post('/register', authLimiter, validate(registerSchema), authController.register.bind(authController));
router.post('/login',    authLimiter, validate(loginSchema),    authController.login.bind(authController));

// Token refresh — uses httpOnly cookie, no access token needed
router.post('/refresh', authLimiter, authController.refresh.bind(authController));

// Protected
router.get('/profile',  authenticate, authController.getProfile.bind(authController));
router.post('/logout',  authenticate, authController.logout.bind(authController));

export default router;
