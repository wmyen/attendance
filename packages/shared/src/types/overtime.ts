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
