import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../models/db';
import { sendOvertimeNotification, sendOvertimeResultNotification } from '../utils/email';

export async function createOvertimeRequest(userId: number, data: {
  start_time: string;
  end_time: string;
  hours: number;
  reason: string;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO overtime_requests (user_id, start_time, end_time, hours, reason) VALUES (?, ?, ?, ?, ?)',
    [userId, data.start_time, data.end_time, data.hours, data.reason]
  );

  const [userRows] = await pool.query<RowDataPacket[]>('SELECT name, email, manager_id FROM users WHERE id = ?', [userId]);
  const user = userRows[0];
  if (user?.manager_id) {
    const [mgrRows] = await pool.query<RowDataPacket[]>('SELECT email FROM users WHERE id = ?', [user.manager_id]);
    if (mgrRows[0]?.email) {
      const info = `${user.name}: ${data.start_time} ~ ${data.end_time} (${data.hours}小時)`;
      try { await sendOvertimeNotification(mgrRows[0].email, user.name, info); } catch {}
    }
  }

  return result.insertId;
}

export async function getMyOvertimeRequests(userId: number): Promise<RowDataPacket[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM overtime_requests WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

export async function getPendingOvertimeRequests(managerId: number): Promise<RowDataPacket[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT or2.*, u.name as employee_name
     FROM overtime_requests or2
     JOIN users u ON or2.user_id = u.id
     WHERE or2.status = 'pending' AND or2.user_id IN (SELECT id FROM users WHERE manager_id = ?)
     ORDER BY or2.created_at DESC`,
    [managerId]
  );
  return rows;
}

export async function approveOvertimeRequest(requestId: number, approverId: number): Promise<boolean> {
  const [reqRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM overtime_requests WHERE id = ? AND status = "pending"',
    [requestId]
  );
  if (reqRows.length === 0) return false;
  const req = reqRows[0];

  await pool.query(
    'UPDATE overtime_requests SET status = "approved", approver_id = ?, approved_at = NOW() WHERE id = ?',
    [approverId, requestId]
  );

  // 累加補休額度 (leave_type_id = 4)
  const year = new Date().getFullYear();
  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM leave_balances WHERE user_id = ? AND leave_type_id = 4 AND year = ?',
    [req.user_id, year]
  );
  if (existing.length > 0) {
    await pool.query(
      'UPDATE leave_balances SET total_hours = total_hours + ? WHERE user_id = ? AND leave_type_id = 4 AND year = ?',
      [req.hours, req.user_id, year]
    );
  } else {
    await pool.query(
      'INSERT INTO leave_balances (user_id, leave_type_id, total_hours, used_hours, year) VALUES (?, 4, ?, 0, ?)',
      [req.user_id, req.hours, year]
    );
  }

  const [userRows] = await pool.query<RowDataPacket[]>('SELECT email FROM users WHERE id = ?', [req.user_id]);
  if (userRows[0]?.email) {
    const info = `${req.start_time} ~ ${req.end_time} (${req.hours}小時)`;
    try { await sendOvertimeResultNotification(userRows[0].email, 'approved', info); } catch {}
  }

  return true;
}

export async function rejectOvertimeRequest(requestId: number, approverId: number, rejectionReason?: string): Promise<boolean> {
  const [reqRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM overtime_requests WHERE id = ? AND status = "pending"',
    [requestId]
  );
  if (reqRows.length === 0) return false;
  const req = reqRows[0];

  await pool.query(
    'UPDATE overtime_requests SET status = "rejected", approver_id = ?, approved_at = NOW(), reason = CONCAT(reason, ?) WHERE id = ?',
    [approverId, rejectionReason ? ` | 駁回理由: ${rejectionReason}` : '', requestId]
  );

  const [userRows] = await pool.query<RowDataPacket[]>('SELECT email FROM users WHERE id = ?', [req.user_id]);
  if (userRows[0]?.email) {
    const info = `${req.start_time} ~ ${req.end_time} (${req.hours}小時)`;
    try { await sendOvertimeResultNotification(userRows[0].email, 'rejected', info); } catch {}
  }

  return true;
}
