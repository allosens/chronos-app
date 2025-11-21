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
 * Admin permissions shared by COMPANY_ADMIN and SUPER_ADMIN roles
 * Both admin roles currently have identical permissions
 */
const ADMIN_PERMISSIONS: RolePermissions = {
  canAccessDashboard: true,
  canManageEmployees: true,
  canApproveRequests: true,
  canManageVacations: true,
  canViewReports: true,
  canAccessSettings: true,
  canManageCompany: false  // Company management is exclusive to SUPER_ADMIN
};

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
  [UserRole.COMPANY_ADMIN]: ADMIN_PERMISSIONS,
  [UserRole.SUPER_ADMIN]: {
    ...ADMIN_PERMISSIONS,
    canManageCompany: true  // Only SUPER_ADMIN can manage companies
  }
};
