import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getLeaveTypesHandler,
  getLeaveBalancesHandler,
  createLeaveRequestHandler,
  getMyLeaveRequestsHandler,
  getPendingLeaveRequestsHandler,
  approveLeaveRequestHandler,
  rejectLeaveRequestHandler,
  cancelLeaveRequestHandler,
} from '../controllers/leaveController';

const router = Router();

router.use(authMiddleware);

router.get('/types', getLeaveTypesHandler);
router.get('/balances', getLeaveBalancesHandler);
router.post('/requests', createLeaveRequestHandler);
router.get('/requests', getMyLeaveRequestsHandler);
router.get('/requests/pending', getPendingLeaveRequestsHandler);
router.put('/requests/:id/approve', approveLeaveRequestHandler);
router.put('/requests/:id/reject', rejectLeaveRequestHandler);
router.delete('/requests/:id', cancelLeaveRequestHandler);

export default router;
