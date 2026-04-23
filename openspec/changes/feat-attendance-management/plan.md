# 出缺勤管理系統 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一個出缺勤管理系統，支援員工打卡、請假/加班申請與簽核流程。

**Architecture:** Monorepo 前後端分離，apps/frontend (Vite+Vue3) + apps/backend (Express+TS) + packages/shared (共用型別)。JWT 雙 Token 認證，MySQL 資料庫。

**Tech Stack:** Vite, Vue 3, Pinia, Vue Router, Element Plus, Express, TypeScript, mysql2, bcrypt, jsonwebtoken, nodemailer

---

## Phase 1: 專案鷹架 + 共用型別 + 資料庫

### Task 1.1: 初始化 Monorepo 結構

**Files:**
- Create: `apps/frontend/` (Vite + Vue 3 專案)
- Create: `apps/backend/` (Express + TS 專案)
- Create: `packages/shared/` (共用型別套件)

- [ ] **Step 1: 建立 frontend 專案**

```bash
cd /Users/wmyen/workspace/attendance
npm create vite@latest apps/frontend -- --template vue-ts
cd apps/frontend
npm install
npm install vue-router@4 pinia axios element-plus @element-plus/icons-vue
```

- [ ] **Step 2: 建立 backend 專案**

```bash
cd /Users/wmyen/workspace/attendance
mkdir -p apps/backend/src/{routes,controllers,services,models,middlewares,utils,types}
cd apps/backend
npm init -y
npm install express mysql2 bcrypt jsonwebtoken nodemailer dotenv cors
npm install -D typescript @types/express @types/bcrypt @types/jsonwebtoken @types/nodemailer @types/cors ts-node-dev @types/node
```

- [ ] **Step 3: 初始化 backend TypeScript**

Create: `apps/backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: 建立 shared 套件**

```bash
cd /Users/wmyen/workspace/attendance
mkdir -p packages/shared/src/types
```

Create: `packages/shared/package.json`

```json
{
  "name": "@attendance/shared",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

- [ ] **Step 5: 設定 backend package.json scripts**

Modify: `apps/backend/package.json` — 加入 scripts 區段

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.ts"
  }
}
```

- [ ] **Step 6: 建立 .env 範本**

Create: `apps/backend/.env.example`

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=attendance
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@attendance.com
PORT=3000
```

Create: `apps/backend/.env` (複製 .env.example 並填入本機設定)

- [ ] **Step 7: Commit**

```bash
git add apps/ packages/
git commit -m "chore: scaffold monorepo with frontend, backend, and shared packages"
```

---

### Task 1.2: 共用 TypeScript 型別定義

**Files:**
- Create: `packages/shared/src/types/user.ts`
- Create: `packages/shared/src/types/attendance.ts`
- Create: `packages/shared/src/types/leave.ts`
- Create: `packages/shared/src/types/overtime.ts`
- Create: `packages/shared/src/types/api.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: 定義 User 型別**

Create: `packages/shared/src/types/user.ts`

```typescript
export type UserRole = 'admin' | 'employee';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  department: string | null;
  manager_id: number | null;
  agent_id: number | null;
  hire_date: string;
  must_change_password: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  manager_id?: number;
  agent_id?: number;
  hire_date: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  department?: string;
  manager_id?: number | null;
  agent_id?: number | null;
  hire_date?: string;
  is_active?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
```

- [ ] **Step 2: 定義 Attendance 型別**

Create: `packages/shared/src/types/attendance.ts`

```typescript
export interface AttendanceRecord {
  id: number;
  user_id: number;
  clock_in: string | null;
  clock_out: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface ClockInResponse {
  record: AttendanceRecord;
}

export interface ClockOutResponse {
  record: AttendanceRecord;
}

export interface MonthlyAttendanceQuery {
  userId?: number;
  month?: string; // YYYY-MM
}
```

- [ ] **Step 3: 定義 Leave 型別**

Create: `packages/shared/src/types/leave.ts`

```typescript
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveType {
  id: number;
  name: string;
  is_paid: boolean;
  requires_document: boolean;
  auto_calculate: boolean;
}

export interface LeaveBalance {
  id: number;
  user_id: number;
  leave_type_id: number;
  total_hours: number;
  used_hours: number;
  year: number;
  leave_type?: LeaveType;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  leave_type_id: number;
  agent_id: number | null;
  start_date: string;
  end_date: string;
  hours: number;
  reason: string;
  status: LeaveRequestStatus;
  approver_id: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLeaveRequest {
  leave_type_id: number;
  agent_id?: number;
  start_date: string;
  end_date: string;
  hours: number;
  reason: string;
}

export interface ApproveRejectBody {
  rejection_reason?: string;
}
```

- [ ] **Step 4: 定義 Overtime 型別**

Create: `packages/shared/src/types/overtime.ts`

```typescript
export type OvertimeRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface OvertimeRequest {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  hours: number;
  reason: string;
  status: OvertimeRequestStatus;
  approver_id: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOvertimeRequest {
  start_time: string;
  end_time: string;
  hours: number;
  reason: string;
}
```

- [ ] **Step 5: 定義 API 通用型別**

Create: `packages/shared/src/types/api.ts`

```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total?: number;
  page?: number;
  pageSize?: number;
}
```

- [ ] **Step 6: 匯出所有型別**

Create: `packages/shared/src/index.ts`

```typescript
export * from './types/user';
export * from './types/attendance';
export * from './types/leave';
export * from './types/overtime';
export * from './types/api';
```

- [ ] **Step 7: Commit**

```bash
git add packages/
git commit -m "feat: add shared TypeScript type definitions"
```

---

### Task 1.3: 資料庫連線與 Schema 初始化

**Files:**
- Create: `apps/backend/src/models/db.ts`
- Create: `apps/backend/src/models/init.sql`

- [ ] **Step 1: 建立資料庫連線模組**

Create: `apps/backend/src/models/db.ts`

```typescript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'attendance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00',
});

export default pool;
```

- [ ] **Step 2: 建立 Schema SQL**

Create: `apps/backend/src/models/init.sql`

```sql
CREATE DATABASE IF NOT EXISTS attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE attendance;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  department VARCHAR(100),
  manager_id INT,
  agent_id INT,
  hire_date DATE NOT NULL,
  must_change_password BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  clock_in DATETIME NOT NULL,
  clock_out DATETIME,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_date (user_id, date)
);

CREATE TABLE IF NOT EXISTS leave_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  requires_document BOOLEAN DEFAULT FALSE,
  auto_calculate BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  total_hours DECIMAL(10, 2) DEFAULT 0,
  used_hours DECIMAL(10, 2) DEFAULT 0,
  year INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
  UNIQUE INDEX idx_user_type_year (user_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  agent_id INT,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  hours DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  approver_id INT,
  approved_at DATETIME,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_status (user_id, status),
  INDEX idx_approver_status (approver_id, status)
);

CREATE TABLE IF NOT EXISTS overtime_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  hours DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  approver_id INT,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_status (user_id, status),
  INDEX idx_approver_status (approver_id, status)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 種子資料：假別
INSERT IGNORE INTO leave_types (id, name, is_paid, requires_document, auto_calculate) VALUES
  (1, '年假', TRUE, FALSE, TRUE),
  (2, '事假', FALSE, FALSE, FALSE),
  (3, '病假', FALSE, TRUE, FALSE),
  (4, '補休', TRUE, FALSE, TRUE),
  (5, '婚假', TRUE, TRUE, FALSE),
  (6, '喪假', TRUE, TRUE, FALSE),
  (7, '產假', TRUE, TRUE, FALSE),
  (8, '公假', TRUE, FALSE, FALSE);

-- 種子資料：管理者帳號（密碼: admin123）
INSERT IGNORE INTO users (id, email, password_hash, name, role, hire_date, must_change_password) VALUES
  (1, 'admin@company.com', '$2b$10$placeholder_admin_hash', '系統管理員', 'admin', '2024-01-01', TRUE);
```

- [ ] **Step 3: 測試資料庫連線**

Create: `apps/backend/src/index.ts`（基本 Express 入口，先確認 DB 連線）

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './models/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    conn.release();
    res.json({ success: true, message: 'DB connected' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'DB connection failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

- [ ] **Step 4: 執行 init.sql 建立資料庫**

```bash
# 先登入 MySQL 手動執行 init.sql
mysql -u root -p < apps/backend/src/models/init.sql
```

- [ ] **Step 5: 啟動 backend 確認連線**

```bash
cd apps/backend
npx ts-node-dev src/index.ts
# 另開終端測試：
curl http://localhost:3000/api/health
# 預期: {"success":true,"message":"DB connected"}
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/
git commit -m "feat: add database connection and schema initialization"
```

---

## Phase 2: 認證系統（Auth）

### Task 2.1: Auth 工具函式

**Files:**
- Create: `apps/backend/src/utils/jwt.ts`
- Create: `apps/backend/src/utils/password.ts`
- Create: `apps/backend/src/utils/email.ts`

- [ ] **Step 1: JWT 工具**

Create: `apps/backend/src/utils/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: number;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}
```

- [ ] **Step 2: 密碼工具**

Create: `apps/backend/src/utils/password.ts`

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateRandomPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
```

- [ ] **Step 3: Email 工具**

Create: `apps/backend/src/utils/email.ts`

```typescript
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || 'noreply@attendance.com';

export async function sendPasswordEmail(to: string, name: string, password: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: '【出缺勤系統】您的帳號已建立',
    html: `<p>${name} 您好，</p>
           <p>您的出缺勤系統帳號已建立。</p>
           <p>登入帳號：<strong>${to}</strong></p>
           <p>臨時密碼：<strong>${password}</strong></p>
           <p>請於首次登入後立即修改密碼。</p>`,
  });
}

export async function sendLeaveNotification(to: string, employeeName: string, leaveInfo: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `【出缺勤系統】${employeeName} 提交了請假申請`,
    html: `<p>您有一筆新的請假申請待簽核：</p><p>${leaveInfo}</p>`,
  });
}

export async function sendLeaveResultNotification(to: string, status: string, leaveInfo: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `【出缺勤系統】您的請假申請已${status === 'approved' ? '核准' : '駁回'}`,
    html: `<p>您的請假申請：<p><p>${leaveInfo}</p><p>結果：${status === 'approved' ? '核准' : '駁回'}</p>`,
  });
}

export async function sendAgentNotification(to: string, employeeName: string, leaveInfo: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `【出缺勤系統】${employeeName} 已指定您為請假期間代理人`,
    html: `<p>${employeeName} 已指定您為請假期間的代理人：</p><p>${leaveInfo}</p>`,
  });
}

export async function sendOvertimeNotification(to: string, employeeName: string, overtimeInfo: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `【出缺勤系統】${employeeName} 提交了加班申請`,
    html: `<p>您有一筆新的加班申請待簽核：</p><p>${overtimeInfo}</p>`,
  });
}

export async function sendOvertimeResultNotification(to: string, status: string, overtimeInfo: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `【出缺勤系統】您的加班申請已${status === 'approved' ? '核准' : '駁回'}`,
    html: `<p>您的加班申請：</p><p>${overtimeInfo}</p><p>結果：${status === 'approved' ? '核准' : '駁回'}</p>`,
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/utils/
git commit -m "feat: add JWT, password, and email utility functions"
```

---

### Task 2.2: Auth 中介層

**Files:**
- Create: `apps/backend/src/middlewares/auth.ts`

- [ ] **Step 1: 建立認證中介層**

Create: `apps/backend/src/middlewares/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: '未提供認證 Token' });
    return;
  }
  try {
    const token = header.split(' ')[1];
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token 無效或已過期' });
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: '權限不足' });
    return;
  }
  next();
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/middlewares/
git commit -m "feat: add auth and admin middleware"
```

---

### Task 2.3: Auth Service + Controller + Route

**Files:**
- Create: `apps/backend/src/services/authService.ts`
- Create: `apps/backend/src/controllers/authController.ts`
- Create: `apps/backend/src/routes/authRoutes.ts`

- [ ] **Step 1: Auth Service**

Create: `apps/backend/src/services/authService.ts`

```typescript
import { RowDataPacket, ResultSetHeader } from 'mysql2';
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
```

- [ ] **Step 2: Auth Controller**

Create: `apps/backend/src/controllers/authController.ts`

```typescript
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
```

- [ ] **Step 3: Auth Routes**

Create: `apps/backend/src/routes/authRoutes.ts`

```typescript
import { Router } from 'express';
import { loginHandler, refreshTokenHandler, changePasswordHandler } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/login', loginHandler);
router.post('/refresh', refreshTokenHandler);
router.post('/change-password', authMiddleware, changePasswordHandler);

export default router;
```

- [ ] **Step 4: 掛載路由到 index.ts**

Modify: `apps/backend/src/index.ts` — 加入 authRoutes

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './models/db';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    conn.release();
    res.json({ success: true, message: 'DB connected' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'DB connection failed' });
  }
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

- [ ] **Step 5: 產生管理者密碼 hash 並插入 DB**

```bash
cd apps/backend
npx ts-node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10).then((h: string) => console.log(h));
"
# 複製輸出的 hash，然後更新 users 表：
# mysql -u root -p -e "USE attendance; UPDATE users SET password_hash='<貼上hash>' WHERE id=1;"
```

- [ ] **Step 6: 測試登入 API**

```bash
# 啟動 server
cd apps/backend && npx ts-node-dev src/index.ts

# 測試登入
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}'
# 預期: {"success":true,"data":{"accessToken":"...","refreshToken":"...","mustChangePassword":true,"user":{...}}}
```

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/
git commit -m "feat: implement auth service, controller, and routes"
```

---

## Phase 3: 使用者管理（User Management）

### Task 3.1: User Service + Controller + Route

**Files:**
- Create: `apps/backend/src/services/userService.ts`
- Create: `apps/backend/src/controllers/userController.ts`
- Create: `apps/backend/src/routes/userRoutes.ts`
- Modify: `apps/backend/src/index.ts` — 掛載 userRoutes

- [ ] **Step 1: User Service** — createUser (含 Email 密碼), listUsers, updateUser, deactivateUser, getUserLeaveBalance

- [ ] **Step 2: User Controller** — 對應 5 個 handler

- [ ] **Step 3: User Routes** — GET/POST/PUT/DELETE，掛 adminOnly 中介層

- [ ] **Step 4: 掛載到 index.ts**

- [ ] **Step 5: 測試 CRUD API**

- [ ] **Step 6: Commit**

---

## Phase 4: 打卡系統（Attendance）

### Task 4.1: Attendance Service + Controller + Route

**Files:**
- Create: `apps/backend/src/services/attendanceService.ts`
- Create: `apps/backend/src/controllers/attendanceController.ts`
- Create: `apps/backend/src/routes/attendanceRoutes.ts`
- Modify: `apps/backend/src/index.ts` — 掛載 attendanceRoutes

- [ ] **Step 1: Attendance Service** — clockIn, clockOut, getToday, getMonthly

- [ ] **Step 2: Attendance Controller** — 4 個 handler

- [ ] **Step 3: Attendance Routes** — POST clock-in/out, GET today/monthly

- [ ] **Step 4: 掛載到 index.ts**

- [ ] **Step 5: 測試打卡 API**

- [ ] **Step 6: Commit**

---

## Phase 5: 請假 + 加班系統（Leave & Overtime）

### Task 5.1: Leave Type + Leave Balance Service

**Files:**
- Create: `apps/backend/src/services/leaveService.ts`

- [ ] **Step 1: getLeaveTypes, getLeaveBalances, calculateAnnualLeave (年假計算)**

- [ ] **Step 2: Commit**

### Task 5.2: Leave Request Service + Controller + Route

**Files:**
- Create: `apps/backend/src/controllers/leaveController.ts`
- Create: `apps/backend/src/routes/leaveRoutes.ts`
- Modify: `apps/backend/src/index.ts` — 掛載 leaveRoutes

- [ ] **Step 1: Leave Service** — createRequest, getMyRequests, getPendingRequests, approveRequest, rejectRequest, cancelRequest (含 Email 通知 + 額度扣抵)

- [ ] **Step 2: Leave Controller + Route**

- [ ] **Step 3: 測試請假 API**

- [ ] **Step 4: Commit**

### Task 5.3: Overtime Service + Controller + Route

**Files:**
- Create: `apps/backend/src/services/overtimeService.ts`
- Create: `apps/backend/src/controllers/overtimeController.ts`
- Create: `apps/backend/src/routes/overtimeRoutes.ts`
- Modify: `apps/backend/src/index.ts` — 掛載 overtimeRoutes

- [ ] **Step 1: Overtime Service** — createRequest, getMyRequests, getPendingRequests, approveRequest (含補休額度累積), rejectRequest

- [ ] **Step 2: Overtime Controller + Route**

- [ ] **Step 3: 測試加班 API**

- [ ] **Step 4: Commit**

---

## Phase 6: 前端實作

### Task 6.1: 前端基礎建設

- [ ] **Step 1: Axios API 層 + Token 攔截器（自動 refresh）**
- [ ] **Step 2: Pinia authStore + 路由守衛**
- [ ] **Step 3: Vue Router 設定 + 角色權限守衛**
- [ ] **Step 4: Element Plus 全域註冊 + 版面 Layout**
- [ ] **Step 5: Commit**

### Task 6.2: 登入 + 修改密碼頁面

- [ ] **Step 1: Login.vue**
- [ ] **Step 2: ChangePassword.vue**
- [ ] **Step 3: 測試登入流程 E2E**
- [ ] **Step 4: Commit**

### Task 6.3: Dashboard + 打卡功能

- [ ] **Step 1: Dashboard.vue（今日狀態 + 打卡按鈕）**
- [ ] **Step 2: MonthlyAttendance.vue**
- [ ] **Step 3: Commit**

### Task 6.4: 請假 + 加班頁面

- [ ] **Step 1: LeaveApply.vue**
- [ ] **Step 2: LeaveRecords.vue**
- [ ] **Step 3: LeaveApprovals.vue**
- [ ] **Step 4: LeaveBalance.vue**
- [ ] **Step 5: OvertimeApply.vue**
- [ ] **Step 6: OvertimeRecords.vue**
- [ ] **Step 7: OvertimeApprovals.vue**
- [ ] **Step 8: Commit**

### Task 6.5: 管理者使用者管理頁面

- [ ] **Step 1: UserList.vue**
- [ ] **Step 2: UserForm.vue（新增/編輯）**
- [ ] **Step 3: 測試管理者流程 E2E**
- [ ] **Step 4: Commit**

---

## Phase 7: 整合測試與收尾

### Task 7.1: 整合驗證

- [ ] **Step 1: 管理者建立員工 → 員工收到 Email → 登入改密碼**
- [ ] **Step 2: 員工打卡 → 月度紀錄查詢**
- [ ] **Step 3: 員工請假 → 主管簽核 → 額度扣抵**
- [ ] **Step 4: 員工加班申請 → 主管核准 → 補休額度累積**
- [ ] **Step 5: 修正發現的問題**
- [ ] **Step 6: 最終 Commit**
