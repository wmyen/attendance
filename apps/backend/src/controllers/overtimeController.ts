import { Request, Response } from 'express';
import * as overtimeService from '../services/overtimeService';

export async function createOvertimeRequestHandler(req: Request, res: Response): Promise<void> {
  const { start_time, end_time, hours, reason } = req.body;
  if (!start_time || !end_time || !hours || !reason) {
    res.status(400).json({ success: false, message: '缺少必要欄位' });
    return;
  }
  try {
    const id = await overtimeService.createOvertimeRequest(req.user!.userId, {
      start_time, end_time, hours, reason,
    });
    res.status(201).json({ success: true, data: { id } });
  } catch {
    res.status(500).json({ success: false, message: '建立加班申請失敗' });
  }
}

export async function getMyOvertimeRequestsHandler(req: Request, res: Response): Promise<void> {
  const records = await overtimeService.getMyOvertimeRequests(req.user!.userId);
  res.json({ success: true, data: records });
}

export async function getPendingOvertimeRequestsHandler(req: Request, res: Response): Promise<void> {
  const records = await overtimeService.getPendingOvertimeRequests(req.user!.userId);
  res.json({ success: true, data: records });
}

export async function approveOvertimeRequestHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const ok = await overtimeService.approveOvertimeRequest(id, req.user!.userId);
  if (!ok) {
    res.status(404).json({ success: false, message: '找不到待簽核的加班單' });
    return;
  }
  res.json({ success: true, message: '已核准' });
}

export async function rejectOvertimeRequestHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const { rejection_reason } = req.body;
  const ok = await overtimeService.rejectOvertimeRequest(id, req.user!.userId, rejection_reason);
  if (!ok) {
    res.status(404).json({ success: false, message: '找不到待簽核的加班單' });
    return;
  }
  res.json({ success: true, message: '已駁回' });
}
