import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginCredentials, AuthUser, AuthState, UserRole } from '../models/auth.model';
import { TokenService, AuthTokens } from '../../../core/services/token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  
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
   * Validates both user data and token expiration
   */
  private checkExistingSession(): void {
    if (typeof window === 'undefined') return;
    
    const storedUser = localStorage.getItem('auth_user');
    const hasValidToken = this.tokenService.hasValidToken();
    
    if (storedUser && hasValidToken) {
      try {
        const user: AuthUser = JSON.parse(storedUser);
        this.authStateSignal.update(state => ({
          ...state,
          user,
          isAuthenticated: true
        }));
      } catch (error) {
        // Invalid stored data, clear it
        this.clearSessionData();
      }
    } else {
      // Token expired or missing, clear session
      this.clearSessionData();
    }
  }

  /**
   * Clear all session data from storage
   */
  private clearSessionData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('auth_user');
    this.tokenService.clearTokens();
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

      // Generate mock JWT tokens
      // In production, these would come from the backend API
      const tokens: AuthTokens = {
        accessToken: this.generateMockToken(mockUser),
        refreshToken: this.generateMockRefreshToken(mockUser),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
      };

      // Store tokens and user data
      if (typeof window !== 'undefined') {
        this.tokenService.setTokens(tokens);
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
   * Generate a mock JWT access token
   * In production, this would come from the backend
   */
  private generateMockToken(user: AuthUser): string {
    // Mock JWT token format: header.payload.signature
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const signature = btoa('mock-signature-' + user.id);
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Generate a mock refresh token
   * In production, this would come from the backend
   */
  private generateMockRefreshToken(user: AuthUser): string {
    return btoa(`refresh-token-${user.id}-${Date.now()}`);
  }

  /**
   * Redirect user after successful login based on their role
   */
  private redirectAfterLogin(role: UserRole): void {
    const redirectMap: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: '/dashboard',
      [UserRole.COMPANY_ADMIN]: '/dashboard',
      [UserRole.EMPLOYEE]: '/time-tracking'
    };

    const redirectPath = redirectMap[role] || '/time-tracking';
    this.router.navigate([redirectPath]);
  }

  /**
   * Log out the current user
   */
  logout(): void {
    // Clear all session data
    this.clearSessionData();

    this.authStateSignal.set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });

    // Redirect to login
    this.router.navigate(['/auth/login']);
  }

  /**
   * Clear any authentication errors
   */
  clearError(): void {
    this.authStateSignal.update(state => ({ ...state, error: null }));
  }
}
