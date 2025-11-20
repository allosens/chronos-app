import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

/**
 * HTTP Interceptor to attach authentication tokens to outgoing requests
 * Adds Authorization header with Bearer token to all API requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getAccessToken();

  // Skip adding token for auth endpoints (login, register, etc.)
  const isAuthEndpoint = req.url.includes('/auth/') || 
                         req.url.includes('/login') || 
                         req.url.includes('/register');

  if (token && !isAuthEndpoint) {
    // Clone the request and add the Authorization header
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
