# 出缺勤管理系統 — 系統規格 (System Specification)

> **版本**: 1.1
> **歸檔日期**: 2026-04-24
> **來源**: openspec/changes/feat-attendance-management/design.md, feat-attendance-correction/design.md
> **狀態**: FINAL — 此文件為系統唯一真理來源 (Single Source of Truth)

---

## 1. 系統架構

### 1.1 專案結構
```
attendance/
├── apps/
│   ├── frontend/              # Vite + Vue.js 3
│   │   ├── src/
│   │   │   ├── views/         # 頁面元件
│   │   │   ├── components/    # 共用元件
│   │   │   ├── composables/   # Vue composables
│   │   │   ├── stores/        # Pinia 狀態管理
│   │   │   ├── router/        # Vue Router
│   │   │   ├── api/           # API 呼叫層
│   │   │   └── types/         # 前端型別
│   │   └── ...
│   └── backend/               # Express + TypeScript
│       ├── src/
│       │   ├── routes/        # API 路由
│       │   ├── controllers/   # 控制器
│       │   ├── services/      # 商業邏輯
│       │   ├── models/        # 資料模型
│       │   ├── middlewares/   # 認證/權限中介
│       │   ├── utils/         # 工具函式
│       │   └── types/         # 後端型別
│       └── ...
└── packages/
    └── shared/                # 共用 TypeScript 型別
        └── src/types/
```

### 1.2 技術棧
- **前端**: Vite + Vue 3 (Composition API) + Pinia + Vue Router + Axios + Element Plus
- **後端**: Express + TypeScript + bcrypt + jsonwebtoken + nodemailer
- **資料庫**: MySQL + mysql2
- **認證**: JWT（Access Token 15min + Refresh Token 7d）

## 2. 關鍵技術決策

### 2.1 Monorepo 組織
- **決策**: 單一 repo，apps/ 放前後端，packages/ 放共用型別
- **原因**: 共用 TypeScript 介面確保前後端型別一致，單一版控方便管理

### 2.2 認證機制
- **決策**: JWT 雙 Token 機制（Access + Refresh）
- **原因**: Access Token 短效降低被竊風險，Refresh Token 允許無感換發

### 2.3 Soft Delete
- **決策**: 使用者刪除採 is_active=false 軟刪除
- **原因**: 保留歷史出勤紀錄的關聯完整性

## 3. 資料庫 Schema

### users
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INT PK AUTO_INCREMENT | 主鍵 |
| email | VARCHAR UNIQUE NOT NULL | 登入帳號 |
| password_hash | VARCHAR NOT NULL | bcrypt 雜湊密碼 |
| name | VARCHAR NOT NULL | 姓名 |
| role | ENUM('admin','employee') | 角色 |
| department | VARCHAR | 部門 |
| manager_id | INT FK→users.id | 直屬主管 |
| agent_id | INT FK→users.id | 預設代理人 |
| hire_date | DATE | 到職日 |
| must_change_password | BOOLEAN DEFAULT true | 首次登入強制改密碼 |
| is_active | BOOLEAN DEFAULT true | 啟用狀態 |
| created_at | DATETIME | 建立時間 |
| updated_at | DATETIME | 更新時間 |

### attendance_records
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INT PK AUTO_INCREMENT | 主鍵 |
| user_id | INT FK→users.id | 使用者 |
| clock_in | DATETIME | 上班打卡時間 |
| clock_out | DATETIME | 下班打卡時間（可 NULL） |
| date | DATE | 打卡日期 |
| created_at | DATETIME | 建立時間 |
| updated_at | DATETIME | 更新時間 |

### leave_types
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INT PK AUTO_INCREMENT | 主鍵 |
| name | VARCHAR | 假別名稱（年假/事假/病假/補休...） |
| is_paid | BOOLEAN | 是否給薪 |
| requires_document | BOOLEAN | 是否需要證明文件 |
| auto_calculate | BOOLEAN | 是否自動計算額度 |

### leave_balances
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INT PK AUTO_INCREMENT | 主鍵 |
| user_id | INT FK→users.id | 使用者 |
| leave_type_id | INT FK→leave_types.id | 假別 |
| total_hours | DECIMAL | 總額度 |
| used_hours | DECIMAL | 已用時數 |
| year | INT | 年度 |
| created_at | DATETIME | 建立時間 |
| updated_at | DATETIME | 更新時間 |

### leave_requests
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INT PK AUTO_INCREMENT | 主鍵 |
| user_id | INT FK→users.id | 申請人 |
| leave_type_id | INT FK→leave_types.id | 假別 |
| agent_id | INT FK→users.id | 代理人 |
| start_date | DATETIME | 開始時間 |
| end_date | DATETIME | 結束時間 |
| hours | DECIMAL | 請假時數 |
| reason | TEXT | 事由 |
| status | ENUM('pending','approved','rejected','cancelled') | 狀態 |
| approver_id | INT FK→users.id | 簽核人 |
| approved_at | DATETIME | 簽核時間 |
| rejection_reason | TEXT | 駁回理由 |
| created_at | DATETIME | 建立時間 |
| updated_at | DATETIME | 更新時間 |

### overtime_requests
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INT PK AUTO_INCREMENT | 主鍵 |
| user_id | INT FK→users.id | 申請人 |
| start_time | DATETIME | 加班開始 |
| end_time | DATETIME | 加班結束 |
| hours | DECIMAL | 加班時數 |
| reason | TEXT | 事由 |
| status | ENUM('pending','approved','rejected','cancelled') | 狀態 |
| approver_id | INT FK→users.id | 簽核人 |
| approved_at | DATETIME | 簽核時間 |
| created_at | DATETIME | 建立時間 |
| updated_at | DATETIME | 更新時間 |

### password_reset_tokens
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INT PK AUTO_INCREMENT | 主鍵 |
| user_id | INT FK→users.id | 使用者 |
| token | VARCHAR | 重設 Token |
| expires_at | DATETIME | 過期時間 |
| used | BOOLEAN | 是否已使用 |

### attendance_correction_requests
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INT PK AUTO_INCREMENT | 主鍵 |
| user_id | INT FK→users.id | 申請人 |
| date | DATE NOT NULL | 打卡日期 |
| correction_type | ENUM('missed_clock_in','missed_clock_out','correct_clock_in','correct_clock_out') | 類型 |
| original_time | DATETIME NULL | 原始時間（更正用） |
| requested_time | DATETIME NOT NULL | 申請的打卡時間 |
| reason | TEXT | 原因 |
| status | ENUM('pending','approved','rejected','cancelled') | 狀態 |
| approver_id | INT FK→users.id NULL | 簽核人 |
| approved_at | DATETIME NULL | 簽核時間 |
| rejection_reason | TEXT NULL | 駁回理由 |
| created_at | DATETIME | 建立時間 |
| updated_at | DATETIME | 更新時間 |

## 4. API 規格

### Auth
| 方法 | 路徑 | 說明 | 認證 |
|------|------|------|------|
| POST | /api/auth/login | 登入 | 無 |
| POST | /api/auth/refresh | 換發 Token | 無 |
| POST | /api/auth/change-password | 修改密碼 | JWT |
| GET | /api/auth/me | 取得當前使用者 Profile | JWT |

### Users（管理者）
| 方法 | 路徑 | 說明 | 認證 |
|------|------|------|------|
| GET | /api/users | 列出使用者 | JWT + admin |
| POST | /api/users | 新增使用者 → Email 寄密碼 | JWT + admin |
| PUT | /api/users/:id | 修改使用者 | JWT + admin |
| DELETE | /api/users/:id | 停用使用者 | JWT + admin |
| GET | /api/users/:id/leave-balance | 查看某人假別額度 | JWT + admin |

### Attendance
| 方法 | 路徑 | 說明 | 認證 |
|------|------|------|------|
| POST | /api/attendance/clock-in | 打卡上班 | JWT |
| POST | /api/attendance/clock-out | 打卡下班 | JWT |
| GET | /api/attendance/today | 今日打卡狀態 | JWT |
| GET | /api/attendance/monthly | 月度出勤紀錄 | JWT |
| POST | /api/attendance/corrections | 提交打卡補登/更正 | JWT |
| GET | /api/attendance/corrections | 我的補登/更正紀錄 | JWT |
| GET | /api/attendance/corrections/pending | 待簽核補登（主管） | JWT |
| PUT | /api/attendance/corrections/:id/approve | 簽核通過 | JWT |
| PUT | /api/attendance/corrections/:id/reject | 簽核駁回 | JWT |
| DELETE | /api/attendance/corrections/:id | 取消申請 | JWT |

### Leave
| 方法 | 路徑 | 說明 | 認證 |
|------|------|------|------|
| GET | /api/leave/types | 假別清單 | JWT |
| GET | /api/leave/balances | 我的假別額度 | JWT |
| POST | /api/leave/requests | 提交請假申請 | JWT |
| GET | /api/leave/requests | 我的請假紀錄 | JWT |
| GET | /api/leave/requests/pending | 待我簽核的假單 | JWT |
| PUT | /api/leave/requests/:id/approve | 簽核通過 | JWT |
| PUT | /api/leave/requests/:id/reject | 簽核駁回 | JWT |
| DELETE | /api/leave/requests/:id | 取消請假 | JWT |

### Overtime
| 方法 | 路徑 | 說明 | 認證 |
|------|------|------|------|
| POST | /api/overtime/requests | 提交加班申請 | JWT |
| GET | /api/overtime/requests | 我的加班紀錄 | JWT |
| GET | /api/overtime/requests/pending | 待我簽核的加班單 | JWT |
| PUT | /api/overtime/requests/:id/approve | 簽核通過 | JWT |
| PUT | /api/overtime/requests/:id/reject | 簽核駁回 | JWT |

### 權限中介層
- `authMiddleware` — 驗證 JWT，注入 userId + role
- `adminOnly` — 擋非 admin
- `managerOf` — 驗證簽核者是該員工的 manager_id（透過 SQL WHERE 實作）

## 5. 前端路由

| 路由 | 頁面 | 權限 |
|------|------|------|
| /login | 登入頁 | guest |
| /change-password | 強制修改密碼 | requiresAuth |
| /dashboard | 首頁（打卡 + 今日狀態） | requiresAuth |
| /attendance/monthly | 月度出勤紀錄 | requiresAuth |
| /attendance/correction/apply | 申請打卡補登/更正 | requiresAuth |
| /attendance/correction/records | 我的補登紀錄 | requiresAuth |
| /attendance/correction/approvals | 待簽核補登單（主管） | requiresAuth |
| /leave/apply | 請假申請 | requiresAuth |
| /leave/records | 我的請假紀錄 | requiresAuth |
| /leave/approvals | 待簽核假單（主管） | requiresAuth |
| /leave/balance | 假別額度總覽 | requiresAuth |
| /overtime/apply | 加班申請 | requiresAuth |
| /overtime/records | 我的加班紀錄 | requiresAuth |
| /overtime/approvals | 待簽核加班單（主管） | requiresAuth |
| /admin/users | 使用者管理（管理者） | adminOnly |
| /admin/users/new | 新增使用者 | adminOnly |
| /admin/users/:id/edit | 編輯使用者 | adminOnly |

## 6. 額度計算邏輯

### 年假（依勞基法）
- 滿半年：3 天
- 滿 1 年：7 天
- 滿 2 年：10 天
- 滿 3~4 年：14 天
- 滿 5~9 年：15 天
- 滿 10 年以上：每滿 1 年加 1 天，上限 30 天

依 `hire_date` 計算年資。查詢假別額度時自動初始化當年度 `leave_balances` 記錄。

### 補休
加班申請簽核通過後，自動將 `overtime_requests.hours` 累加到 `leave_balances` 中對應的補休額度（`total_hours` 增加）。

## 7. 打卡補登/更正規則

- **時效限制**: 只能申請當月份的紀錄
- **簽核流程**: 全部都需要主管簽核
- **類型**: missed_clock_in / missed_clock_out / correct_clock_in / correct_clock_out
- **防護**: 同一天同一類型不可重複提交 pending 申請
- **核准寫入**: missed→INSERT/UPDATE attendance_records, correct→UPDATE 對應欄位

## 8. Email 通知觸發點

| 觸發事件 | 收件人 | 實作函式 |
|---------|--------|---------|
| 新增使用者 | 使用者本人 | sendPasswordEmail |
| 請假申請 | 直屬主管 | sendLeaveNotification |
| 請假簽核結果 | 申請人 | sendLeaveResultNotification |
| 請假申請 | 被指定的代理人 | sendAgentNotification |
| 加班申請 | 直屬主管 | sendOvertimeNotification |
| 加班簽核結果 | 申請人 | sendOvertimeResultNotification |
