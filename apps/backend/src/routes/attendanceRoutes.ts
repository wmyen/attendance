import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  clockInHandler,
  clockOutHandler,
  getTodayHandler,
  getMonthlyHandler,
} from '../controllers/attendanceController';

const router = Router();

router.use(authMiddleware);

router.post('/clock-in', clockInHandler);
router.post('/clock-out', clockOutHandler);
router.get('/today', getTodayHandler);
router.get('/monthly', getMonthlyHandler);

export default router;
