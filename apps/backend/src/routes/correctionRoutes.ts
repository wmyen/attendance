import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createCorrectionRequest,
  getMyCorrections,
  getPendingCorrections,
  approveCorrection,
  rejectCorrection,
  cancelCorrection,
} from '../services/correctionService';

const router = Router();

router.use(authMiddleware);

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { date, correction_type, original_time, requested_time, reason } = req.body;

    if (!date || !correction_type || !requested_time || !reason) {
      res.status(400).json({ message: '請填寫所有必要欄位' });
      return;
    }

    const validTypes = ['missed_clock_in', 'missed_clock_out', 'correct_clock_in', 'correct_clock_out'];
    if (!validTypes.includes(correction_type)) {
      res.status(400).json({ message: '無效的申請類型' });
      return;
    }

    const id = await createCorrectionRequest(userId, {
      date,
      correction_type,
      original_time,
      requested_time,
      reason,
    });

    res.status(201).json({ success: true, data: { id } });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const rows = await getMyCorrections(userId);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/pending', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const rows = await getPendingCorrections(userId);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/approve', async (req: Request, res: Response) => {
  try {
    const approverId = req.user!.userId;
    const ok = await approveCorrection(Number(req.params.id), approverId);
    if (!ok) {
      res.status(404).json({ message: '找不到待審核的申請' });
      return;
    }
    res.json({ success: true, message: '已核准' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/reject', async (req: Request, res: Response) => {
  try {
    const approverId = req.user!.userId;
    const { rejection_reason } = req.body;
    const ok = await rejectCorrection(Number(req.params.id), approverId, rejection_reason);
    if (!ok) {
      res.status(404).json({ message: '找不到待審核的申請' });
      return;
    }
    res.json({ success: true, message: '已駁回' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const ok = await cancelCorrection(Number(req.params.id), userId);
    if (!ok) {
      res.status(404).json({ message: '找不到可取消的申請' });
      return;
    }
    res.json({ success: true, message: '已取消' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
