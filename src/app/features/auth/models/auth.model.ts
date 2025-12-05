export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string; // Optional for SUPER_ADMIN, required for COMPANY_ADMIN and EMPLOYEE
}

export enum UserRole {
  EMPLOYEE = 'employee',
  COMPANY_ADMIN = 'company_admin',
  SUPER_ADMIN = 'super_admin'
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordRecoveryState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
}
