import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../models/db';

export async function clockIn(userId: number): Promise<RowDataPacket> {
  const today = new Date().toISOString().slice(0, 10);

  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM attendance_records WHERE user_id = ? AND date = ?',
    [userId, today]
  );
  if (existing.length > 0) {
    throw new Error('今日已打卡上班');
  }

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO attendance_records (user_id, clock_in, date) VALUES (?, NOW(), ?)',
    [userId, today]
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM attendance_records WHERE id = ?',
    [result.insertId]
  );
  return rows[0];
}

export async function clockOut(userId: number): Promise<RowDataPacket> {
  const today = new Date().toISOString().slice(0, 10);

  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM attendance_records WHERE user_id = ? AND date = ?',
    [userId, today]
  );
  if (existing.length === 0) {
    throw new Error('今日尚未打卡上班');
  }
  if (existing[0].clock_out) {
    throw new Error('今日已打卡下班');
  }

  await pool.query(
    'UPDATE attendance_records SET clock_out = NOW() WHERE id = ?',
    [existing[0].id]
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM attendance_records WHERE id = ?',
    [existing[0].id]
  );
  return rows[0];
}

export async function getToday(userId: number): Promise<RowDataPacket | null> {
  const today = new Date().toISOString().slice(0, 10);
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM attendance_records WHERE user_id = ? AND date = ?',
    [userId, today]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function getMonthly(userId: number, month?: string, targetUserId?: number): Promise<RowDataPacket[]> {
  const uid = targetUserId || userId;
  const m = month || new Date().toISOString().slice(0, 7);
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM attendance_records WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ? ORDER BY date",
    [uid, m]
  );
  return rows;
}
