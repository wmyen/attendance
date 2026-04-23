import { Request, Response } from 'express';
import * as leaveService from '../services/leaveService';

export async function getLeaveTypesHandler(_req: Request, res: Response): Promise<void> {
  const types = await leaveService.getLeaveTypes();
  res.json({ success: true, data: types });
}

export async function getLeaveBalancesHandler(req: Request, res: Response): Promise<void> {
  const year = req.query.year ? Number(req.query.year) : undefined;
  const balances = await leaveService.getLeaveBalances(req.user!.userId, year);
  res.json({ success: true, data: balances });
}

export async function createLeaveRequestHandler(req: Request, res: Response): Promise<void> {
  const { leave_type_id, agent_id, start_date, end_date, hours, reason } = req.body;
  if (!leave_type_id || !start_date || !end_date || !hours || !reason) {
    res.status(400).json({ success: false, message: '缺少必要欄位' });
    return;
  }
  try {
    const id = await leaveService.createLeaveRequest(req.user!.userId, {
      leave_type_id, agent_id, start_date, end_date, hours, reason,
    });
    res.status(201).json({ success: true, data: { id } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: '建立請假申請失敗' });
  }
}

export async function getMyLeaveRequestsHandler(req: Request, res: Response): Promise<void> {
  const records = await leaveService.getMyLeaveRequests(req.user!.userId);
  res.json({ success: true, data: records });
}

export async function getPendingLeaveRequestsHandler(req: Request, res: Response): Promise<void> {
  const records = await leaveService.getPendingLeaveRequests(req.user!.userId);
  res.json({ success: true, data: records });
}

export async function approveLeaveRequestHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const ok = await leaveService.approveLeaveRequest(id, req.user!.userId);
  if (!ok) {
    res.status(404).json({ success: false, message: '找不到待簽核的假單' });
    return;
  }
  res.json({ success: true, message: '已核准' });
}

export async function rejectLeaveRequestHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const { rejection_reason } = req.body;
  const ok = await leaveService.rejectLeaveRequest(id, req.user!.userId, rejection_reason);
  if (!ok) {
    res.status(404).json({ success: false, message: '找不到待簽核的假單' });
    return;
  }
  res.json({ success: true, message: '已駁回' });
}

export async function cancelLeaveRequestHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const ok = await leaveService.cancelLeaveRequest(id, req.user!.userId);
  if (!ok) {
    res.status(404).json({ success: false, message: '找不到可取消的假單' });
    return;
  }
  res.json({ success: true, message: '已取消' });
}
