import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createOvertimeRequestHandler,
  getMyOvertimeRequestsHandler,
  getPendingOvertimeRequestsHandler,
  approveOvertimeRequestHandler,
  rejectOvertimeRequestHandler,
} from '../controllers/overtimeController';

const router = Router();

router.use(authMiddleware);

router.post('/requests', createOvertimeRequestHandler);
router.get('/requests', getMyOvertimeRequestsHandler);
router.get('/requests/pending', getPendingOvertimeRequestsHandler);
router.put('/requests/:id/approve', approveOvertimeRequestHandler);
router.put('/requests/:id/reject', rejectOvertimeRequestHandler);

export default router;
