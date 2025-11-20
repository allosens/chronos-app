import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, PLATFORM_ID } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard, authChildGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('Auth Guards', () => {
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
    
    // Mock route and state
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/dashboard' } as RouterStateSnapshot;
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', async () => {
      // Login user
      await authService.login({
        email: 'employee@chronos.com',
        password: 'password'
      });

      const result = TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should redirect to login when user is not authenticated', () => {
      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/dashboard' } }
      );
    });

    it('should include return URL in query params', () => {
      const customState = { url: '/settings' } as RouterStateSnapshot;
      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, customState)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/settings' } }
      );
    });

    it('should allow access during SSR (server-side rendering)', () => {
      // Mock server platform
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: Router, useValue: router },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      const result = TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );

      // Should allow access during SSR to prevent redirect loops
      expect(result).toBe(true);
      // Router should not be called during SSR
      expect(router.createUrlTree).not.toHaveBeenCalled();
    });
  });

  describe('authChildGuard', () => {
    it('should allow access when user is authenticated', async () => {
      await authService.login({
        email: 'admin@chronos.com',
        password: 'password'
      });

      const result = TestBed.runInInjectionContext(() => 
        authChildGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should redirect to login when user is not authenticated', () => {
      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => 
        authChildGuard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/dashboard' } }
      );
    });

    it('should behave the same as authGuard', async () => {
      await authService.login({
        email: 'company@chronos.com',
        password: 'password'
      });

      const guardResult = TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );
      
      const childGuardResult = TestBed.runInInjectionContext(() => 
        authChildGuard(mockRoute, mockState)
      );

      expect(guardResult).toBe(childGuardResult);
    });

    it('should allow access during SSR', () => {
      // Mock server platform
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: Router, useValue: router },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      const result = TestBed.runInInjectionContext(() => 
        authChildGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });
  });

  describe('guard behavior after logout', () => {
    it('should deny access after user logs out', async () => {
      // Login
      await authService.login({
        email: 'employee@chronos.com',
        password: 'password'
      });

      // Verify access is granted
      let result = TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );
      expect(result).toBe(true);

      // Logout
      authService.logout();

      // Verify access is denied
      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);
      
      result = TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );
      
      expect(result).toBe(mockUrlTree);
    });
  });
});
