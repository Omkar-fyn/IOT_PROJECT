import { Router } from 'express';
import { login, getMe, changePassword, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { LoginSchema, ChangePasswordSchema } from '@smart-parcel-box/shared';

const router = Router();

router.post('/login', authLimiter, validate({ body: LoginSchema }), login);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, validate({ body: ChangePasswordSchema }), changePassword);
router.post('/logout', authenticate, logout);

export default router;

