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
