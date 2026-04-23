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
