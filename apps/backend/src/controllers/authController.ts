import { Request, Response } from 'express';
import * as authService from '../services/authService';

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, message: '請提供 email 和密碼' });
    return;
  }
  const result = await authService.login(email, password);
  if (!result) {
    res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
    return;
  }
  res.json({ success: true, data: result });
}

export async function refreshTokenHandler(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ success: false, message: '請提供 refreshToken' });
    return;
  }
  const result = await authService.refreshTokens(refreshToken);
  if (!result) {
    res.status(401).json({ success: false, message: 'Refresh Token 無效或已過期' });
    return;
  }
  res.json({ success: true, data: result });
}

export async function changePasswordHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    res.status(400).json({ success: false, message: '請提供舊密碼和新密碼' });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ success: false, message: '新密碼至少需 8 位字元' });
    return;
  }
  const ok = await authService.changePassword(userId, oldPassword, newPassword);
  if (!ok) {
    res.status(400).json({ success: false, message: '舊密碼不正確' });
    return;
  }
  res.json({ success: true, message: '密碼修改成功' });
}
