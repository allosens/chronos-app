import { Injectable, signal, computed } from '@angular/core';
import { LoginCredentials, AuthUser, AuthState, UserRole } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Auth state signals
  private authStateSignal = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  });

  // Public readonly signals
  readonly authState = this.authStateSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.authStateSignal().isAuthenticated);
  readonly currentUser = computed(() => this.authStateSignal().user);
  readonly isLoading = computed(() => this.authStateSignal().isLoading);
  readonly error = computed(() => this.authStateSignal().error);

  constructor() {
    // Check for existing session on service initialization
    this.checkExistingSession();
  }

  /**
   * Check if there's an existing session in storage
   */
  private checkExistingSession(): void {
    if (typeof window === 'undefined') return;
    
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const user: AuthUser = JSON.parse(storedUser);
        this.authStateSignal.update(state => ({
          ...state,
          user,
          isAuthenticated: true
        }));
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('auth_user');
      }
    }
  }

  /**
   * Authenticate user with credentials
   * For now, this is a mock implementation - to be replaced with real API call
   */
  async login(credentials: LoginCredentials): Promise<void> {
    this.authStateSignal.update(state => ({ ...state, isLoading: true, error: null }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock authentication logic - replace with real API call
      const mockUser = this.getMockUser(credentials.email);
      
      if (!mockUser) {
        throw new Error('Credenciales inválidas');
      }

      // Store user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(mockUser));
      }

      this.authStateSignal.update(state => ({
        ...state,
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }));

      // Redirect based on user role (only in browser environment)
      this.redirectAfterLogin(mockUser.role);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.authStateSignal.update(state => ({
        ...state,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }

  /**
   * Mock user data - to be replaced with real API
   */
  private getMockUser(email: string): AuthUser | null {
    const mockUsers: Record<string, AuthUser> = {
      'admin@chronos.com': {
        id: '1',
        email: 'admin@chronos.com',
        name: 'Admin User',
        role: UserRole.SUPER_ADMIN
      },
      'company@chronos.com': {
        id: '2',
        email: 'company@chronos.com',
        name: 'Company Admin',
        role: UserRole.COMPANY_ADMIN
      },
      'employee@chronos.com': {
        id: '3',
        email: 'employee@chronos.com',
        name: 'Employee User',
        role: UserRole.EMPLOYEE
      }
    };

    return mockUsers[email] || null;
  }

  /**
   * Redirect user after successful login based on their role
   * Only redirects in browser environment
   */
  private redirectAfterLogin(role: UserRole): void {
    // Skip redirect in test environment or SSR
    if (typeof window === 'undefined' || this.isTestEnvironment()) {
      return;
    }
    
    const redirectMap: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: '/dashboard',
      [UserRole.COMPANY_ADMIN]: '/dashboard',
      [UserRole.EMPLOYEE]: '/time-tracking'
    };

    const redirectPath = redirectMap[role] || '/time-tracking';
    window.location.href = redirectPath;
  }

  /**
   * Log out the current user
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
    }

    this.authStateSignal.set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });

    // Redirect to login (only in browser environment)
    if (typeof window !== 'undefined' && !this.isTestEnvironment()) {
      window.location.href = '/login';
    }
  }

  /**
   * Clear any authentication errors
   */
  clearError(): void {
    this.authStateSignal.update(state => ({ ...state, error: null }));
  }

  /**
   * Check if running in test environment
   */
  private isTestEnvironment(): boolean {
    return typeof window !== 'undefined' && 
           (window as any).jasmine !== undefined;
  }
}
