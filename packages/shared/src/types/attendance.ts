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
  month?: string;
}
