import { inject } from '@angular/core';
import { Router, type CanActivateFn, type CanActivateChildFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  const returnUrl = state.url;
  
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
