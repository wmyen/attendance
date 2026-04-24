# 打卡補登與更正 — 設計文件

> **版本**: 1.0
> **日期**: 2026-04-24
> **狀態**: APPROVED

---

## 1. 功能概述

員工忘記打卡或打卡時間錯誤時，可透過系統提交補登/更正申請，經主管簽核後寫入出勤紀錄。

## 2. 核心規則

- **時效限制**: 只能申請當月份的紀錄
- **簽核流程**: 全部都需要主管簽核
- **涵蓋範圍**: 忘記打卡（補登）+ 打卡時間更正，統一同一張申請單
- **防護**: 同一天同一類型不可重複申請

## 3. 資料表 attendance_correction_requests

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INT PK AUTO_INCREMENT | 主鍵 |
| user_id | INT FK→users.id | 申請人 |
| date | DATE | 打卡日期 |
| correction_type | ENUM('missed_clock_in','missed_clock_out','correct_clock_in','correct_clock_out') | 類型 |
| original_time | DATETIME NULL | 原始時間（更正用，補登為 NULL） |
| requested_time | DATETIME NOT NULL | 申請的打卡時間 |
| reason | TEXT | 原因 |
| status | ENUM('pending','approved','rejected','cancelled') | 狀態 |
| approver_id | INT FK→users.id NULL | 簽核人 |
| approved_at | DATETIME NULL | 簽核時間 |
| rejection_reason | TEXT NULL | 駁回理由 |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP | 建立時間 |
| updated_at | DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新時間 |

## 4. API 規格

| 方法 | 路徑 | 說明 | 認證 |
|------|------|------|------|
| POST | /api/attendance/corrections | 提交補登/更正申請 | JWT |
| GET | /api/attendance/corrections | 我的補登/更正紀錄 | JWT |
| GET | /api/attendance/corrections/pending | 待簽核清單（主管） | JWT |
| PUT | /api/attendance/corrections/:id/approve | 簽核通過 | JWT |
| PUT | /api/attendance/corrections/:id/reject | 簽核駁回 | JWT |
| DELETE | /api/attendance/corrections/:id | 取消申請 | JWT |

## 5. 核准後寫入邏輯

- **missed_clock_in**: INSERT clock_in 到 attendance_records
- **missed_clock_out**: UPDATE 對應紀錄的 clock_out
- **correct_clock_in**: UPDATE 對應紀錄的 clock_in
- **correct_clock_out**: UPDATE 對應紀錄的 clock_out

## 6. 驗證規則

- 補登類型: 驗證該天確實沒有對應的打卡紀錄
- 更正類型: 需附上 original_time，且該天必須已有打卡紀錄
- 不可跨月申請（date 必須在當月）
- 同一天同一類型不可重複提交 pending 申請

## 7. 前端路由

| 路由 | 頁面 | 權限 |
|------|------|------|
| /attendance/correction/apply | 申請補登/更正 | requiresAuth |
| /attendance/correction/records | 我的補登紀錄 | requiresAuth |
| /attendance/correction/approvals | 待簽核補登單 | requiresAuth |

## 8. Email 通知

| 觸發事件 | 收件人 |
|---------|--------|
| 補登/更正申請 | 直屬主管 |
| 簽核結果 | 申請人 |
