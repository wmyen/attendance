import { RowDataPacket } from 'mysql2';
import pool from '../models/db';
import { verifyPassword, hashPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt';
import { LoginResponse } from '../../../packages/shared/src';

export async function login(email: string, password: string): Promise<LoginResponse | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, email, name, role, password_hash, must_change_password, is_active FROM users WHERE email = ?',
    [email]
  );
  if (rows.length === 0) return null;
  const user = rows[0];
  if (!user.is_active) return null;

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return null;

  const payload: TokenPayload = { userId: user.id, role: user.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    mustChangePassword: !!user.must_change_password,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function refreshTokens(token: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const payload = verifyRefreshToken(token);
    const newPayload: TokenPayload = { userId: payload.userId, role: payload.role };
    return {
      accessToken: generateAccessToken(newPayload),
      refreshToken: generateRefreshToken(newPayload),
    };
  } catch {
    return null;
  }
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT password_hash FROM users WHERE id = ?',
    [userId]
  );
  if (rows.length === 0) return false;

  const valid = await verifyPassword(oldPassword, rows[0].password_hash);
  if (!valid) return false;

  const hash = await hashPassword(newPassword);
  await pool.query(
    'UPDATE users SET password_hash = ?, must_change_password = FALSE, updated_at = NOW() WHERE id = ?',
    [hash, userId]
  );
  return true;
}
