import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { 
  createRoleGuard, 
  adminGuard, 
  superAdminGuard,
  adminChildGuard,
  superAdminChildGuard 
} from './role.guard';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

describe('Role Guards', () => {
  let authService: AuthService;
  let router: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree']);
    
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/dashboard' } as RouterStateSnapshot;
    
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('createRoleGuard factory', () => {
    it('should redirect to login when user is not authenticated', () => {
      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);
      
      const guard = createRoleGuard([UserRole.COMPANY_ADMIN]);
      const result = TestBed.runInInjectionContext(() => 
        guard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/dashboard' } }
      );
    });

    it('should allow access when user has required role', async () => {
      await authService.login({
        email: 'company@chronos.com',
        password: 'password'
      });

      const guard = createRoleGuard([UserRole.COMPANY_ADMIN]);
      const result = TestBed.runInInjectionContext(() => 
        guard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple allowed roles', async () => {
      await authService.login({
        email: 'company@chronos.com',
        password: 'password'
      });

      const guard = createRoleGuard([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]);
      const result = TestBed.runInInjectionContext(() => 
        guard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should redirect to time-tracking when user lacks required role', async () => {
      await authService.login({
        email: 'employee@chronos.com',
        password: 'password'
      });

      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const guard = createRoleGuard([UserRole.COMPANY_ADMIN]);
      const result = TestBed.runInInjectionContext(() => 
        guard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/time-tracking']);
    });
  });

  describe('adminGuard', () => {
    it('should allow Company Admin access', async () => {
      await authService.login({
        email: 'company@chronos.com',
        password: 'password'
      });

      const result = TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should allow Super Admin access', async () => {
      await authService.login({
        email: 'admin@chronos.com',
        password: 'password'
      });

      const result = TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should deny Employee access', async () => {
      await authService.login({
        email: 'employee@chronos.com',
        password: 'password'
      });

      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/time-tracking']);
    });

    it('should redirect unauthenticated users to login', () => {
      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/dashboard' } }
      );
    });
  });

  describe('superAdminGuard', () => {
    it('should allow Super Admin access', async () => {
      await authService.login({
        email: 'admin@chronos.com',
        password: 'password'
      });

      const result = TestBed.runInInjectionContext(() => 
        superAdminGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should deny Company Admin access', async () => {
      await authService.login({
        email: 'company@chronos.com',
        password: 'password'
      });

      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => 
        superAdminGuard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/time-tracking']);
    });

    it('should deny Employee access', async () => {
      await authService.login({
        email: 'employee@chronos.com',
        password: 'password'
      });

      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => 
        superAdminGuard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/time-tracking']);
    });
  });

  describe('adminChildGuard', () => {
    it('should allow Company Admin access', async () => {
      await authService.login({
        email: 'company@chronos.com',
        password: 'password'
      });

      const result = TestBed.runInInjectionContext(() => 
        adminChildGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should deny Employee access', async () => {
      await authService.login({
        email: 'employee@chronos.com',
        password: 'password'
      });

      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => 
        adminChildGuard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
    });
  });

  describe('superAdminChildGuard', () => {
    it('should allow Super Admin access', async () => {
      await authService.login({
        email: 'admin@chronos.com',
        password: 'password'
      });

      const result = TestBed.runInInjectionContext(() => 
        superAdminChildGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should deny Company Admin access', async () => {
      await authService.login({
        email: 'company@chronos.com',
        password: 'password'
      });

      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => 
        superAdminChildGuard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
    });
  });

  describe('role changes', () => {
    it('should update access when user role changes', async () => {
      // Login as employee
      await authService.login({
        email: 'employee@chronos.com',
        password: 'password'
      });

      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      let result = TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );
      expect(result).toBe(mockUrlTree);

      // Logout and login as admin
      authService.logout();
      router.createUrlTree.calls.reset();
      
      await authService.login({
        email: 'admin@chronos.com',
        password: 'password'
      });

      result = TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );
      expect(result).toBe(true);
    });
  });
});
