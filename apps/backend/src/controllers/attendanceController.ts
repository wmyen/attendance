import { Request, Response } from 'express';
import * as attendanceService from '../services/attendanceService';

export async function clockInHandler(req: Request, res: Response): Promise<void> {
  try {
    const record = await attendanceService.clockIn(req.user!.userId);
    res.json({ success: true, data: { record } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function clockOutHandler(req: Request, res: Response): Promise<void> {
  try {
    const record = await attendanceService.clockOut(req.user!.userId);
    res.json({ success: true, data: { record } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function getTodayHandler(req: Request, res: Response): Promise<void> {
  const record = await attendanceService.getToday(req.user!.userId);
  res.json({ success: true, data: record });
}

export async function getMonthlyHandler(req: Request, res: Response): Promise<void> {
  const { month, userId } = req.query;
  const records = await attendanceService.getMonthly(
    req.user!.userId,
    month as string | undefined,
    userId ? Number(userId) : undefined
  );
  res.json({ success: true, data: records });
}
