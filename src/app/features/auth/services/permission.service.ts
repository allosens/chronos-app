import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { UserRole } from '../models/auth.model';
import { ROLE_PERMISSIONS, RolePermissions } from '../../../core/interfaces/user-role.interface';

/**
 * Service for managing role-based permissions
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly authService = inject(AuthService);

  /**
   * Current user's role
   */
  readonly userRole = computed(() => this.authService.currentUser()?.role);

  /**
   * Current user's permissions based on their role
   */
  readonly permissions = computed<RolePermissions | null>(() => {
    const role = this.userRole();
    return role ? ROLE_PERMISSIONS[role] : null;
  });

  /**
   * Check if user has a specific role
   */
  hasRole(role: UserRole): boolean {
    const currentRole = this.userRole();
    return currentRole === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const currentRole = this.userRole();
    return currentRole ? roles.includes(currentRole) : false;
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(roles: UserRole[]): boolean {
    const currentRole = this.userRole();
    if (!currentRole) return false;
    return roles.every(role => role === currentRole);
  }

  /**
   * Check if user can access dashboard
   */
  canAccessDashboard(): boolean {
    return this.permissions()?.canAccessDashboard ?? false;
  }

  /**
   * Check if user can manage employees
   */
  canManageEmployees(): boolean {
    return this.permissions()?.canManageEmployees ?? false;
  }

  /**
   * Check if user can approve requests
   */
  canApproveRequests(): boolean {
    return this.permissions()?.canApproveRequests ?? false;
  }

  /**
   * Check if user can manage vacations
   */
  canManageVacations(): boolean {
    return this.permissions()?.canManageVacations ?? false;
  }

  /**
   * Check if user can view reports
   */
  canViewReports(): boolean {
    return this.permissions()?.canViewReports ?? false;
  }

  /**
   * Check if user can access settings
   */
  canAccessSettings(): boolean {
    return this.permissions()?.canAccessSettings ?? false;
  }

  /**
   * Check if user can manage company
   */
  canManageCompany(): boolean {
    return this.permissions()?.canManageCompany ?? false;
  }
}
