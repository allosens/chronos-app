import { inject, PLATFORM_ID } from '@angular/core';
import { Router, type CanActivateFn, type CanActivateChildFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

/**
 * Factory function to create a role-based guard
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Guard function that checks if user has any of the allowed roles
 */
export function createRoleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return (route, state) => {
    const platformId = inject(PLATFORM_ID);
    const authService = inject(AuthService);
    const router = inject(Router);

    // During SSR, allow access to prevent redirect loops
    // The guard will run again on the client side after hydration
    if (isPlatformServer(platformId)) {
        return true;
    }

    // if (!isPlatformBrowser(platformId)) {
    //   return true;
    // }

    const currentUser = authService.currentUser();

    // First check if user is authenticated
    if (!currentUser) {
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Check if user has any of the allowed roles
    if (allowedRoles.includes(currentUser.role)) {
      return true;
    }

    // User doesn't have required role, redirect to unauthorized page or home
    return router.createUrlTree(['/time-tracking']);
  };
}

/**
 * Role guard that allows only Company Admin and Super Admin
 */
export const adminGuard: CanActivateFn = createRoleGuard([
  UserRole.COMPANY_ADMIN,
  UserRole.SUPER_ADMIN
]);

/**
 * Role guard that allows only Super Admin
 */
export const superAdminGuard: CanActivateFn = createRoleGuard([
  UserRole.SUPER_ADMIN
]);

/**
 * Child guard factory for role-based protection
 */
export function createRoleChildGuard(allowedRoles: UserRole[]): CanActivateChildFn {
  const guardFn = createRoleGuard(allowedRoles);
  return (route, state) => guardFn(route, state);
}

/**
 * Child guard that allows only Company Admin and Super Admin
 */
export const adminChildGuard: CanActivateChildFn = createRoleChildGuard([
  UserRole.COMPANY_ADMIN,
  UserRole.SUPER_ADMIN
]);

/**
 * Child guard that allows only Super Admin
 */
export const superAdminChildGuard: CanActivateChildFn = createRoleChildGuard([
  UserRole.SUPER_ADMIN
]);
