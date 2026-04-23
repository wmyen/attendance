import { Request, Response } from 'express';
import * as userService from '../services/userService';

export async function listUsersHandler(_req: Request, res: Response): Promise<void> {
  const users = await userService.listUsers();
  res.json({ success: true, data: users });
}

export async function createUserHandler(req: Request, res: Response): Promise<void> {
  const { email, name, role, department, manager_id, agent_id, hire_date } = req.body;
  if (!email || !name || !role || !hire_date) {
    res.status(400).json({ success: false, message: '缺少必要欄位 (email, name, role, hire_date)' });
    return;
  }
  try {
    const id = await userService.createUser({ email, name, role, department, manager_id, agent_id, hire_date });
    res.status(201).json({ success: true, data: { id } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Duplicate entry')) {
      res.status(409).json({ success: false, message: '此 Email 已存在' });
      return;
    }
    res.status(500).json({ success: false, message: '建立使用者失敗' });
  }
}

export async function updateUserHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const { name, role, department, manager_id, agent_id, hire_date, is_active } = req.body;
  const ok = await userService.updateUser(id, { name, role, department, manager_id, agent_id, hire_date, is_active });
  if (!ok) {
    res.status(404).json({ success: false, message: '使用者不存在或無更新' });
    return;
  }
  res.json({ success: true, message: '更新成功' });
}

export async function deactivateUserHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (id === req.user!.userId) {
    res.status(400).json({ success: false, message: '不能停用自己的帳號' });
    return;
  }
  const ok = await userService.deactivateUser(id);
  if (!ok) {
    res.status(404).json({ success: false, message: '使用者不存在' });
    return;
  }
  res.json({ success: true, message: '已停用' });
}

export async function getUserLeaveBalanceHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const year = req.query.year ? Number(req.query.year) : undefined;
  const balances = await userService.getUserLeaveBalance(id, year);
  res.json({ success: true, data: balances });
}
