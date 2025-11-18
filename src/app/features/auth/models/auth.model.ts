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
