import { Router } from 'express';
import { loginHandler, refreshTokenHandler, changePasswordHandler, getProfileHandler } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/login', loginHandler);
router.post('/refresh', refreshTokenHandler);
router.post('/change-password', authMiddleware, changePasswordHandler);
router.get('/me', authMiddleware, getProfileHandler);

export default router;
