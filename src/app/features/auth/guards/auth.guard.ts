import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Router, type CanActivateFn, type CanActivateChildFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes that require authentication
 * Redirects to login if user is not authenticated
 * 
 * Note: During SSR, this guard always allows access since localStorage is not available.
 * Authentication will be re-checked on the client side after hydration.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router = inject(Router);

  // During SSR, allow access to prevent redirect loops
  // The guard will run again on the client side after hydration
  if (isPlatformServer(platformId)) {
    console.log('AuthGuard: Running on server, allowing access');
    return true;
  }

  const isAuthenticated = authService.isAuthenticated();
  console.log('AuthGuard: Client side check, isAuthenticated:', isAuthenticated);

  if (isAuthenticated) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  const returnUrl = state.url;
  
  console.log('AuthGuard: Redirecting to login, attempted URL:', returnUrl);
  
  // Redirect to login page
  return router.createUrlTree(['/auth/login'], { 
    queryParams: { returnUrl } 
  });
};

/**
 * Child guard to protect child routes that require authentication
 * Uses the same logic as authGuard
 */
export const authChildGuard: CanActivateChildFn = (route, state) => {
  return authGuard(route, state);
};
