import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionService } from './permission.service';
import { AuthService } from './auth.service';
import { UserRole } from '../models/auth.model';

describe('PermissionService', () => {
  let service: PermissionService;
  let authService: AuthService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    service = TestBed.inject(PermissionService);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Employee role permissions', () => {
    beforeEach(async () => {
      await authService.login({
        email: 'employee@chronos.com',
        password: 'password'
      });
    });

    it('should have Employee role', () => {
      expect(service.hasRole(UserRole.EMPLOYEE)).toBe(true);
    });

    it('should NOT have access to dashboard', () => {
      expect(service.canAccessDashboard()).toBe(false);
    });

    it('should NOT be able to manage employees', () => {
      expect(service.canManageEmployees()).toBe(false);
    });

    it('should NOT be able to approve requests', () => {
      expect(service.canApproveRequests()).toBe(false);
    });

    it('should NOT be able to manage vacations', () => {
      expect(service.canManageVacations()).toBe(false);
    });

    it('should NOT be able to view reports', () => {
      expect(service.canViewReports()).toBe(false);
    });

    it('should NOT be able to access settings', () => {
      expect(service.canAccessSettings()).toBe(false);
    });

    it('should NOT be able to manage company', () => {
      expect(service.canManageCompany()).toBe(false);
    });

    it('should have Employee in allowed roles', () => {
      expect(service.hasAnyRole([UserRole.EMPLOYEE])).toBe(true);
    });

    it('should not have Admin roles', () => {
      expect(service.hasAnyRole([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])).toBe(false);
    });
  });

  describe('Company Admin role permissions', () => {
    beforeEach(async () => {
      await authService.login({
        email: 'company@chronos.com',
        password: 'password'
      });
    });

    it('should have Company Admin role', () => {
      expect(service.hasRole(UserRole.COMPANY_ADMIN)).toBe(true);
    });

    it('should have access to dashboard', () => {
      expect(service.canAccessDashboard()).toBe(true);
    });

    it('should be able to manage employees', () => {
      expect(service.canManageEmployees()).toBe(true);
    });

    it('should be able to approve requests', () => {
      expect(service.canApproveRequests()).toBe(true);
    });

    it('should be able to manage vacations', () => {
      expect(service.canManageVacations()).toBe(true);
    });

    it('should be able to view reports', () => {
      expect(service.canViewReports()).toBe(true);
    });

    it('should be able to access settings', () => {
      expect(service.canAccessSettings()).toBe(true);
    });

    it('should be able to manage company', () => {
      expect(service.canManageCompany()).toBe(true);
    });

    it('should have Company Admin in allowed roles', () => {
      expect(service.hasAnyRole([UserRole.COMPANY_ADMIN])).toBe(true);
    });

    it('should be in admin roles', () => {
      expect(service.hasAnyRole([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])).toBe(true);
    });
  });

  describe('Super Admin role permissions', () => {
    beforeEach(async () => {
      await authService.login({
        email: 'admin@chronos.com',
        password: 'password'
      });
    });

    it('should have Super Admin role', () => {
      expect(service.hasRole(UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('should have access to dashboard', () => {
      expect(service.canAccessDashboard()).toBe(true);
    });

    it('should be able to manage employees', () => {
      expect(service.canManageEmployees()).toBe(true);
    });

    it('should be able to approve requests', () => {
      expect(service.canApproveRequests()).toBe(true);
    });

    it('should be able to manage vacations', () => {
      expect(service.canManageVacations()).toBe(true);
    });

    it('should be able to view reports', () => {
      expect(service.canViewReports()).toBe(true);
    });

    it('should be able to access settings', () => {
      expect(service.canAccessSettings()).toBe(true);
    });

    it('should be able to manage company', () => {
      expect(service.canManageCompany()).toBe(true);
    });

    it('should have Super Admin in allowed roles', () => {
      expect(service.hasAnyRole([UserRole.SUPER_ADMIN])).toBe(true);
    });

    it('should be in admin roles', () => {
      expect(service.hasAnyRole([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])).toBe(true);
    });
  });

  describe('hasAllRoles', () => {
    it('should return true when user has all specified roles', async () => {
      await authService.login({
        email: 'employee@chronos.com',
        password: 'password'
      });
      
      expect(service.hasAllRoles([UserRole.EMPLOYEE])).toBe(true);
    });

    it('should return false when user does not have all specified roles', async () => {
      await authService.login({
        email: 'employee@chronos.com',
        password: 'password'
      });
      
      expect(service.hasAllRoles([UserRole.EMPLOYEE, UserRole.COMPANY_ADMIN])).toBe(false);
    });
  });

  describe('unauthenticated user', () => {
    it('should return undefined for userRole when not authenticated', () => {
      expect(service.userRole()).toBeUndefined();
    });

    it('should return null for permissions when not authenticated', () => {
      expect(service.permissions()).toBeNull();
    });

    it('should return false for all permission checks when not authenticated', () => {
      expect(service.canAccessDashboard()).toBe(false);
      expect(service.canManageEmployees()).toBe(false);
      expect(service.canApproveRequests()).toBe(false);
      expect(service.canManageVacations()).toBe(false);
      expect(service.canViewReports()).toBe(false);
      expect(service.canAccessSettings()).toBe(false);
      expect(service.canManageCompany()).toBe(false);
    });

    it('should return false for hasRole when not authenticated', () => {
      expect(service.hasRole(UserRole.EMPLOYEE)).toBe(false);
    });

    it('should return false for hasAnyRole when not authenticated', () => {
      expect(service.hasAnyRole([UserRole.EMPLOYEE])).toBe(false);
    });
  });
});
