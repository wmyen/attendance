import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../models/db';
import {
  sendLeaveNotification,
  sendLeaveResultNotification,
  sendAgentNotification,
} from '../utils/email';

function calculateAnnualLeaveDays(yearsOfService: number): number {
  if (yearsOfService < 0.5) return 0;
  if (yearsOfService < 1) return 3;
  if (yearsOfService < 2) return 7;
  if (yearsOfService < 3) return 10;
  if (yearsOfService < 5) return 14;
  if (yearsOfService < 10) return 15;
  const extra = Math.min(yearsOfService - 10, 15);
  return 15 + extra;
}

export async function getLeaveTypes(): Promise<RowDataPacket[]> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM leave_types ORDER BY id');
  return rows;
}

export async function getLeaveBalances(userId: number, year?: number): Promise<RowDataPacket[]> {
  const y = year || new Date().getFullYear();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT lb.*, lt.name as leave_type_name, lt.is_paid
     FROM leave_balances lb
     JOIN leave_types lt ON lb.leave_type_id = lt.id
     WHERE lb.user_id = ? AND lb.year = ?`,
    [userId, y]
  );
  return rows;
}

export async function ensureAnnualLeaveBalance(userId: number, hireDate: string): Promise<void> {
  const year = new Date().getFullYear();
  const hire = new Date(hireDate);
  const now = new Date();
  const yearsOfService = (now.getTime() - hire.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const days = calculateAnnualLeaveDays(yearsOfService);
  const hours = days * 8;

  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM leave_balances WHERE user_id = ? AND leave_type_id = 1 AND year = ?',
    [userId, year]
  );
  if (existing.length === 0 && hours > 0) {
    await pool.query(
      'INSERT INTO leave_balances (user_id, leave_type_id, total_hours, used_hours, year) VALUES (?, 1, ?, 0, ?)',
      [userId, hours, year]
    );
  }
}

export async function createLeaveRequest(userId: number, data: {
  leave_type_id: number;
  agent_id?: number;
  start_date: string;
  end_date: string;
  hours: number;
  reason: string;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO leave_requests (user_id, leave_type_id, agent_id, start_date, end_date, hours, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, data.leave_type_id, data.agent_id || null, data.start_date, data.end_date, data.hours, data.reason]
  );

  const [userRows] = await pool.query<RowDataPacket[]>('SELECT name, email, manager_id FROM users WHERE id = ?', [userId]);
  const user = userRows[0];

  if (user?.manager_id) {
    const [mgrRows] = await pool.query<RowDataPacket[]>('SELECT email FROM users WHERE id = ?', [user.manager_id]);
    if (mgrRows[0]?.email) {
      const info = `${user.name}: ${data.start_date} ~ ${data.end_date} (${data.hours}小時)`;
      try { await sendLeaveNotification(mgrRows[0].email, user.name, info); } catch {}
    }
  }

  if (data.agent_id) {
    const [agentRows] = await pool.query<RowDataPacket[]>('SELECT email FROM users WHERE id = ?', [data.agent_id]);
    if (agentRows[0]?.email) {
      const info = `${data.start_date} ~ ${data.end_date} (${data.hours}小時)`;
      try { await sendAgentNotification(agentRows[0].email, user.name, info); } catch {}
    }
  }

  return result.insertId;
}

export async function getMyLeaveRequests(userId: number): Promise<RowDataPacket[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT lr.*, lt.name as leave_type_name
     FROM leave_requests lr
     JOIN leave_types lt ON lr.leave_type_id = lt.id
     WHERE lr.user_id = ?
     ORDER BY lr.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getPendingLeaveRequests(managerId: number): Promise<RowDataPacket[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT lr.*, lt.name as leave_type_name, u.name as employee_name
     FROM leave_requests lr
     JOIN leave_types lt ON lr.leave_type_id = lt.id
     JOIN users u ON lr.user_id = u.id
     WHERE lr.status = 'pending' AND lr.user_id IN (SELECT id FROM users WHERE manager_id = ?)
     ORDER BY lr.created_at DESC`,
    [managerId]
  );
  return rows;
}

export async function approveLeaveRequest(requestId: number, approverId: number): Promise<boolean> {
  const [reqRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM leave_requests WHERE id = ? AND status = "pending"',
    [requestId]
  );
  if (reqRows.length === 0) return false;
  const req = reqRows[0];

  await pool.query(
    'UPDATE leave_requests SET status = "approved", approver_id = ?, approved_at = NOW() WHERE id = ?',
    [approverId, requestId]
  );

  await pool.query(
    'UPDATE leave_balances SET used_hours = used_hours + ? WHERE user_id = ? AND leave_type_id = ? AND year = YEAR(NOW())',
    [req.hours, req.user_id, req.leave_type_id]
  );

  const [userRows] = await pool.query<RowDataPacket[]>('SELECT email FROM users WHERE id = ?', [req.user_id]);
  if (userRows[0]?.email) {
    const info = `${req.start_date} ~ ${req.end_date} (${req.hours}小時)`;
    try { await sendLeaveResultNotification(userRows[0].email, 'approved', info); } catch {}
  }

  return true;
}

export async function rejectLeaveRequest(requestId: number, approverId: number, rejectionReason?: string): Promise<boolean> {
  const [reqRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM leave_requests WHERE id = ? AND status = "pending"',
    [requestId]
  );
  if (reqRows.length === 0) return false;
  const req = reqRows[0];

  await pool.query(
    'UPDATE leave_requests SET status = "rejected", approver_id = ?, approved_at = NOW(), rejection_reason = ? WHERE id = ?',
    [approverId, rejectionReason || null, requestId]
  );

  const [userRows] = await pool.query<RowDataPacket[]>('SELECT email FROM users WHERE id = ?', [req.user_id]);
  if (userRows[0]?.email) {
    const info = `${req.start_date} ~ ${req.end_date} (${req.hours}小時)`;
    try { await sendLeaveResultNotification(userRows[0].email, 'rejected', info); } catch {}
  }

  return true;
}

export async function cancelLeaveRequest(requestId: number, userId: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE leave_requests SET status = "cancelled" WHERE id = ? AND user_id = ? AND status = "pending"',
    [requestId, userId]
  );
  return result.affectedRows > 0;
}
