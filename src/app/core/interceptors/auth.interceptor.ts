import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';

/**
 * HTTP Interceptor to attach authentication tokens to outgoing requests
 * Adds Authorization header with Bearer token to all API requests
 * Handles 401 errors by redirecting to login (token refresh is handled by AuthService)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getAccessToken();

  // Skip adding token for auth endpoints (login, register, etc.)
  const pathPart = req.url.split('?')[0];
  const isAuthEndpoint = /\/(auth|login|register|refresh)(\/|$)/.test(pathPart);

  // Clone request with token if available and not an auth endpoint
  let authReq = req;
  if (token && !tokenService.isTokenExpired() && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Add company context if available (for multi-tenant support)
  if (typeof window !== 'undefined' && !isAuthEndpoint) {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.companyId) {
          authReq = authReq.clone({
            setHeaders: {
              'X-Company-Id': user.companyId,
            },
          });
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log authentication errors for debugging
      if (error.status === 401 || error.status === 403) {
        console.error('Authentication error:', {
          status: error.status,
          url: req.url,
          message: error.message,
        });
      }

      return throwError(() => error);
    })
  );
};
