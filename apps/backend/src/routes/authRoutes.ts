import { Router } from 'express';
import { loginHandler, refreshTokenHandler, changePasswordHandler } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/login', loginHandler);
router.post('/refresh', refreshTokenHandler);
router.post('/change-password', authMiddleware, changePasswordHandler);

export default router;
