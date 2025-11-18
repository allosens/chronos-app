export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export enum UserRole {
  EMPLOYEE = 'Usuario',
  COMPANY_ADMIN = 'Company Admin',
  SUPER_ADMIN = 'Super Admin'
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
