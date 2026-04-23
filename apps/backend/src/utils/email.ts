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
    html: `<p>您的請假申請：</p><p>${leaveInfo}</p><p>結果：${status === 'approved' ? '核准' : '駁回'}</p>`,
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
