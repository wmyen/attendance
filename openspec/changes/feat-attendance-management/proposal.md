# 變更提案 (Proposal)

## 1. 變更動機 (Why)
企業需要一個數位化的出缺勤管理系統，取代紙本或試算表管理方式，提供員工自助打卡、請假、加班申請，並透過線上簽核流程提升行政效率。

## 2. 變更範圍 (What)
- [x] 使用者認證與授權系統（登入、JWT、角色權限）
- [x] 使用者管理（管理者 CRUD、Email 發送密碼、首次登入強制改密碼）
- [x] 打卡系統（上班/下班按鈕打卡、今日狀態、月度紀錄）
- [x] 請假管理（假別額度、申請、簽核、代理人通知）
- [x] 加班管理（申請、簽核、補休額度累積）
- [x] 假別額度自動計算（年假依年資、補休依加班時數）

## 3. 能力契約 (Capabilities)
- **新增能力**:
    - `auth` — 認證登入、Token 管理、密碼修改
    - `user-management` — 使用者 CRUD、Email 通知
    - `attendance` — 打卡上下班、出勤紀錄查詢
    - `leave` — 請假申請、簽核、假別額度、代理人
    - `overtime` — 加班申請、簽核、補休累積

## 4. 影響評估
- **架構影響**: 全新系統，採 Monorepo 前後端分離架構
- **API 變動**: 全新 REST API，共約 20 個端點
- **依賴項增減**:
    - 前端：Vue 3, Pinia, Vue Router, Axios, Element Plus/Naive UI
    - 後端：Express, jsonwebtoken, bcrypt, nodemailer, mysql2
