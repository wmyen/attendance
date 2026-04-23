import { Router } from 'express';
import { authMiddleware, adminOnly } from '../middlewares/auth';
import {
  listUsersHandler,
  createUserHandler,
  updateUserHandler,
  deactivateUserHandler,
  getUserLeaveBalanceHandler,
} from '../controllers/userController';

const router = Router();

router.use(authMiddleware, adminOnly);

router.get('/', listUsersHandler);
router.post('/', createUserHandler);
router.put('/:id', updateUserHandler);
router.delete('/:id', deactivateUserHandler);
router.get('/:id/leave-balance', getUserLeaveBalanceHandler);

export default router;
