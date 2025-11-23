import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, firstValueFrom } from 'rxjs';
import { LoginCredentials, AuthUser, AuthState, UserRole } from '../models/auth.model';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
} from '../models/api.model';
import { TokenService, AuthTokens } from '../../../core/services/token.service';
import { TokenRefreshService } from '../../../core/services/token-refresh.service';
import { SessionService } from './session.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly tokenRefreshService = inject(TokenRefreshService);
  private readonly sessionService = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);

  private refreshTokenPromise: Promise<void> | null = null;
  
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

    // Listen for session timeout events
    if (typeof window !== 'undefined') {
      window.addEventListener('session-timeout', () => {
        this.handleSessionTimeout();
      });
    }

    // Set up cleanup
    this.destroyRef.onDestroy(() => {
      this.sessionService.stopMonitoring();
      this.tokenRefreshService.stopAutoRefresh();
    });
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
        this.authStateSignal.update((state) => ({
          ...state,
          user,
          isAuthenticated: true,
        }));

        // Start monitoring for existing session
        this.sessionService.startMonitoring();
        this.tokenRefreshService.startAutoRefresh(() => this.refreshToken());
      } catch (error) {
        // Invalid stored data, clear it
        this.clearSessionData();
      }
    } else if (storedUser || this.tokenService.getAccessToken()) {
      // Only clear if there's actually data to clear
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
    
    // Ensure auth state is reset
    this.authStateSignal.update(state => ({
      ...state,
      user: null,
      isAuthenticated: false
    }));
  }

  /**
   * Authenticate user with credentials
   * Connects to real backend API
   */
  async login(credentials: LoginCredentials): Promise<void> {
    this.authStateSignal.update((state) => ({ ...state, isLoading: true, error: null }));

    try {
      const loginRequest: LoginRequest = {
        email: credentials.email,
        password: credentials.password,
      };

      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, loginRequest).pipe(
          catchError((error: HttpErrorResponse) => {
            return throwError(() => this.handleHttpError(error));
          })
        )
      );

      // Map API response to AuthUser
      const user: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: this.mapRoleFromApi(response.user.role),
        companyId: response.user.companyId,
      };

      // Calculate expiration timestamp
      const expiresAt = Date.now() + response.expiresIn * 1000;

      // Store tokens
      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt,
      };

      if (typeof window !== 'undefined') {
        this.tokenService.setTokens(tokens);
        localStorage.setItem('auth_user', JSON.stringify(user));
      }

      this.authStateSignal.update((state) => ({
        ...state,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));

      // Start session monitoring
      this.sessionService.startMonitoring();

      // Start auto token refresh
      this.tokenRefreshService.startAutoRefresh(() => this.refreshToken());

      // Redirect based on user role
      this.redirectAfterLogin(user.role);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.authStateSignal.update((state) => ({
        ...state,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
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
  async logout(): Promise<void> {
    // Try to revoke refresh token on server
    const refreshToken = this.tokenService.getRefreshToken();
    if (refreshToken && typeof window !== 'undefined') {
      try {
        const logoutRequest: LogoutRequest = { refreshToken };
        await firstValueFrom(
          this.http.post(`${environment.apiUrl}/auth/logout`, logoutRequest).pipe(
            catchError(() => {
              // Ignore logout errors, we'll clear local state anyway
              return throwError(() => new Error('Logout failed'));
            })
          )
        );
      } catch {
        // Silently fail - we'll clear local state anyway
      }
    }

    // Stop session monitoring
    this.sessionService.stopMonitoring();

    // Stop auto token refresh
    this.tokenRefreshService.stopAutoRefresh();

    // Clear all session data
    this.clearSessionData();

    this.authStateSignal.set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Redirect to login
    this.router.navigate(['/auth/login']);
  }

  /**
   * Clear any authentication errors
   */
  clearError(): void {
    this.authStateSignal.update((state) => ({ ...state, error: null }));
  }

  /**
   * Refresh the access token using refresh token
   * Returns a promise that resolves when refresh is complete
   */
  async refreshToken(): Promise<void> {
    // If refresh is already in progress, wait for it
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.tokenService.setRefreshInProgress(true);

    this.refreshTokenPromise = (async () => {
      try {
        const request: RefreshTokenRequest = { refreshToken };

        const response = await firstValueFrom(
          this.http.post<RefreshTokenResponse>(`${environment.apiUrl}/auth/refresh`, request).pipe(
            catchError((error: HttpErrorResponse) => {
              return throwError(() => this.handleHttpError(error));
            })
          )
        );

        // Calculate new expiration
        const expiresAt = Date.now() + response.expiresIn * 1000;

        // Update tokens
        const tokens: AuthTokens = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt,
        };

        if (typeof window !== 'undefined') {
          this.tokenService.setTokens(tokens);
        }
      } catch (error) {
        // If refresh fails, logout user
        await this.logout();
        throw error;
      } finally {
        this.tokenService.setRefreshInProgress(false);
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  /**
   * Map API role string to UserRole enum
   */
  private mapRoleFromApi(role: string): UserRole {
    const roleMap: Record<string, UserRole> = {
      super_admin: UserRole.SUPER_ADMIN,
      company_admin: UserRole.COMPANY_ADMIN,
      employee: UserRole.EMPLOYEE,
    };
    return roleMap[role.toLowerCase()] || UserRole.EMPLOYEE;
  }

  /**
   * Handle HTTP errors and return user-friendly messages
   */
  private handleHttpError(error: HttpErrorResponse): Error {
    let errorMessage = 'Ha ocurrido un error. Por favor, intenta de nuevo.';

    // Check if error is due to parsing HTML as JSON
    if (error.error instanceof ProgressEvent || typeof error.error === 'string') {
      errorMessage = 'El servidor no está disponible o la API no está configurada correctamente. Verifica que el backend esté corriendo en localhost:3001.';
    } else if (error.status === 0) {
      // Network error or CORS
      errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo y que el proxy esté configurado correctamente.';
    } else if (error.status === 401) {
      errorMessage = 'Credenciales inválidas. Por favor, verifica tu email y contraseña.';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permiso para realizar esta acción.';
    } else if (error.status === 404) {
      errorMessage = 'El endpoint de autenticación no fue encontrado. Verifica que la API esté implementada correctamente.';
    } else if (error.status >= 500) {
      errorMessage = 'Error del servidor. Por favor, intenta más tarde.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    // Log detailed error for debugging
    console.error('Auth error:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error,
      url: error.url,
    });

    return new Error(errorMessage);
  }

  /**
   * Handle session timeout
   */
  private handleSessionTimeout(): void {
    this.logout();
  }
}
