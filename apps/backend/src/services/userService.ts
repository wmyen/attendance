import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../models/db';
import { hashPassword, generateRandomPassword } from '../utils/password';
import { sendPasswordEmail } from '../utils/email';

export async function listUsers(): Promise<RowDataPacket[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, email, name, role, department, manager_id, agent_id, hire_date, must_change_password, is_active, created_at, updated_at FROM users ORDER BY id'
  );
  return rows;
}

export async function createUser(data: {
  email: string;
  name: string;
  role: 'admin' | 'employee';
  department?: string;
  manager_id?: number;
  agent_id?: number;
  hire_date: string;
}): Promise<number> {
  const password = generateRandomPassword();
  const hash = await hashPassword(password);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (email, password_hash, name, role, department, manager_id, agent_id, hire_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.email, hash, data.name, data.role, data.department || null, data.manager_id || null, data.agent_id || null, data.hire_date]
  );

  try {
    await sendPasswordEmail(data.email, data.name, password);
  } catch (err) {
    console.error('Failed to send password email:', err);
  }

  return result.insertId;
}

export async function updateUser(id: number, data: {
  name?: string;
  role?: 'admin' | 'employee';
  department?: string;
  manager_id?: number | null;
  agent_id?: number | null;
  hire_date?: string;
  is_active?: boolean;
}): Promise<boolean> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
  if (data.department !== undefined) { fields.push('department = ?'); values.push(data.department); }
  if (data.manager_id !== undefined) { fields.push('manager_id = ?'); values.push(data.manager_id); }
  if (data.agent_id !== undefined) { fields.push('agent_id = ?'); values.push(data.agent_id); }
  if (data.hire_date !== undefined) { fields.push('hire_date = ?'); values.push(data.hire_date); }
  if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

  if (fields.length === 0) return false;

  values.push(id);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
}

export async function deactivateUser(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE users SET is_active = FALSE WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

export async function getUserLeaveBalance(userId: number, year?: number): Promise<RowDataPacket[]> {
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
