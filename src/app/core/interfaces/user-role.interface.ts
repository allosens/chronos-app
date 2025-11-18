import { UserRole } from '../../features/auth/models/auth.model';

/**
 * Interface defining permissions for each role
 */
export interface RolePermissions {
  canAccessDashboard: boolean;
  canManageEmployees: boolean;
  canApproveRequests: boolean;
  canManageVacations: boolean;
  canViewReports: boolean;
  canAccessSettings: boolean;
  canManageCompany: boolean;
}

/**
 * Map of roles to their permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.EMPLOYEE]: {
    canAccessDashboard: false,
    canManageEmployees: false,
    canApproveRequests: false,
    canManageVacations: false,
    canViewReports: false,
    canAccessSettings: false,
    canManageCompany: false
  },
  [UserRole.COMPANY_ADMIN]: {
    canAccessDashboard: true,
    canManageEmployees: true,
    canApproveRequests: true,
    canManageVacations: true,
    canViewReports: true,
    canAccessSettings: true,
    canManageCompany: true
  },
  [UserRole.SUPER_ADMIN]: {
    canAccessDashboard: true,
    canManageEmployees: true,
    canApproveRequests: true,
    canManageVacations: true,
    canViewReports: true,
    canAccessSettings: true,
    canManageCompany: true
  }
};
