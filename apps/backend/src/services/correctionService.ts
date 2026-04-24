import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../models/db';

interface CorrectionData {
  date: string;
  correction_type: 'missed_clock_in' | 'missed_clock_out' | 'correct_clock_in' | 'correct_clock_out';
  original_time?: string;
  requested_time: string;
  reason: string;
}

export async function createCorrectionRequest(userId: number, data: CorrectionData): Promise<number> {
  const now = new Date();
  const requestDate = new Date(data.date);
  const isCurrentMonth = requestDate.getFullYear() === now.getFullYear() && requestDate.getMonth() === now.getMonth();
  if (!isCurrentMonth) {
    throw new Error('只能申請當月份的補登/更正');
  }

  // Check for duplicate pending request
  const [dupes] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM attendance_correction_requests
     WHERE user_id = ? AND date = ? AND correction_type = ? AND status = 'pending'`,
    [userId, data.date, data.correction_type]
  );
  if (dupes.length > 0) {
    throw new Error('該日期已有相同的待審核申請');
  }

  // Validate based on type
  const [records] = await pool.query<RowDataPacket[]>(
    'SELECT id, clock_in, clock_out FROM attendance_records WHERE user_id = ? AND date = ?',
    [userId, data.date]
  );

  if (data.correction_type.startsWith('missed_')) {
    if (data.correction_type === 'missed_clock_in' && records.length > 0 && records[0].clock_in) {
      throw new Error('該日期已有上班打卡紀錄');
    }
    if (data.correction_type === 'missed_clock_out' && records.length > 0 && records[0].clock_out) {
      throw new Error('該日期已有下班打卡紀錄');
    }
    if (data.correction_type === 'missed_clock_out' && records.length === 0) {
      throw new Error('該日期尚無上班打卡紀錄，無法單獨補登下班');
    }
  } else {
    if (records.length === 0) {
      throw new Error('該日期無打卡紀錄，無法更正');
    }
    if (data.correction_type === 'correct_clock_in' && !records[0].clock_in) {
      throw new Error('該日期無上班打卡紀錄可更正');
    }
    if (data.correction_type === 'correct_clock_out' && !records[0].clock_out) {
      throw new Error('該日期無下班打卡紀錄可更正');
    }
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO attendance_correction_requests
     (user_id, date, correction_type, original_time, requested_time, reason)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, data.date, data.correction_type, data.original_time || null, data.requested_time, data.reason]
  );

  return result.insertId;
}

export async function getMyCorrections(userId: number): Promise<RowDataPacket[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM attendance_correction_requests
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getPendingCorrections(managerId: number): Promise<RowDataPacket[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT acr.*, u.name as employee_name
     FROM attendance_correction_requests acr
     JOIN users u ON acr.user_id = u.id
     WHERE acr.status = 'pending' AND acr.user_id IN (SELECT id FROM users WHERE manager_id = ?)
     ORDER BY acr.created_at DESC`,
    [managerId]
  );
  return rows;
}

export async function approveCorrection(requestId: number, approverId: number): Promise<boolean> {
  const [reqRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM attendance_correction_requests WHERE id = ? AND status = "pending"',
    [requestId]
  );
  if (reqRows.length === 0) return false;
  const req = reqRows[0];

  await pool.query(
    'UPDATE attendance_correction_requests SET status = "approved", approver_id = ?, approved_at = NOW() WHERE id = ?',
    [approverId, requestId]
  );

  // Write to attendance_records based on type
  const requestedTime = req.requested_time;

  if (req.correction_type === 'missed_clock_in') {
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM attendance_records WHERE user_id = ? AND date = ?',
      [req.user_id, req.date]
    );
    if (existing.length > 0) {
      await pool.query(
        'UPDATE attendance_records SET clock_in = ?, updated_at = NOW() WHERE id = ?',
        [requestedTime, existing[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO attendance_records (user_id, clock_in, date) VALUES (?, ?, ?)',
        [req.user_id, requestedTime, req.date]
      );
    }
  } else if (req.correction_type === 'missed_clock_out') {
    await pool.query(
      'UPDATE attendance_records SET clock_out = ?, updated_at = NOW() WHERE user_id = ? AND date = ?',
      [requestedTime, req.user_id, req.date]
    );
  } else if (req.correction_type === 'correct_clock_in') {
    await pool.query(
      'UPDATE attendance_records SET clock_in = ?, updated_at = NOW() WHERE user_id = ? AND date = ?',
      [requestedTime, req.user_id, req.date]
    );
  } else if (req.correction_type === 'correct_clock_out') {
    await pool.query(
      'UPDATE attendance_records SET clock_out = ?, updated_at = NOW() WHERE user_id = ? AND date = ?',
      [requestedTime, req.user_id, req.date]
    );
  }

  return true;
}

export async function rejectCorrection(requestId: number, approverId: number, rejectionReason?: string): Promise<boolean> {
  const [reqRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM attendance_correction_requests WHERE id = ? AND status = "pending"',
    [requestId]
  );
  if (reqRows.length === 0) return false;

  await pool.query(
    'UPDATE attendance_correction_requests SET status = "rejected", approver_id = ?, approved_at = NOW(), rejection_reason = ? WHERE id = ?',
    [approverId, rejectionReason || null, requestId]
  );

  return true;
}

export async function cancelCorrection(requestId: number, userId: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE attendance_correction_requests SET status = "cancelled" WHERE id = ? AND user_id = ? AND status = "pending"',
    [requestId, userId]
  );
  return result.affectedRows > 0;
}
