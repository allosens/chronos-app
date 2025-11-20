import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenService } from '../../../core/services/token.service';
import { UserRole } from '../models/auth.model';

describe('AuthService - Session Persistence', () => {
  let authService: AuthService;
  let tokenService: TokenService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: routerSpy }
      ]
    });

    tokenService = TestBed.inject(TokenService);
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

  describe('Session restoration on page refresh', () => {
    it('should restore session from localStorage with valid token', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      // Set up stored user and valid token (simulating previous login)
      const mockUser = {
        id: '1',
        email: 'test@chronos.com',
        name: 'Test User',
        role: UserRole.EMPLOYEE
      };
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      tokenService.setTokens({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000 // 1 hour from now
      });

      // Create a new service instance (simulating app refresh)
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: Router, useValue: router }
        ]
      });
      const newService = TestBed.inject(AuthService);

      // Verify session is restored
      expect(newService.isAuthenticated()).toBe(true);
      expect(newService.currentUser()).toEqual(mockUser);
    });

    it('should NOT restore session when token is expired', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      // Set up stored user but expired token
      const mockUser = {
        id: '1',
        email: 'test@chronos.com',
        name: 'Test User',
        role: UserRole.EMPLOYEE
      };
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      tokenService.setTokens({
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      });

      // Create a new service instance (simulating app refresh)
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: Router, useValue: router }
        ]
      });
      const newService = TestBed.inject(AuthService);

      // Verify session is NOT restored
      expect(newService.isAuthenticated()).toBe(false);
      expect(newService.currentUser()).toBeNull();
      
      // Verify data was cleared
      expect(localStorage.getItem('auth_user')).toBeNull();
      expect(tokenService.getAccessToken()).toBeNull();
    });

    it('should NOT restore session when token is missing', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      // Set up stored user but no token
      const mockUser = {
        id: '1',
        email: 'test@chronos.com',
        name: 'Test User',
        role: UserRole.EMPLOYEE
      };
      localStorage.setItem('auth_user', JSON.stringify(mockUser));

      // Create a new service instance (simulating app refresh)
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: Router, useValue: router }
        ]
      });
      const newService = TestBed.inject(AuthService);

      // Verify session is NOT restored
      expect(newService.isAuthenticated()).toBe(false);
      expect(newService.currentUser()).toBeNull();
      
      // Verify user data was cleared
      expect(localStorage.getItem('auth_user')).toBeNull();
    });

    it('should NOT restore session when user data is corrupted', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      // Set up corrupted user data and valid token
      localStorage.setItem('auth_user', 'invalid-json{{{');
      tokenService.setTokens({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000
      });

      // Create a new service instance (simulating app refresh)
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: Router, useValue: router }
        ]
      });
      const newService = TestBed.inject(AuthService);

      // Verify session is NOT restored
      expect(newService.isAuthenticated()).toBe(false);
      expect(newService.currentUser()).toBeNull();
      
      // Verify data was cleared
      expect(localStorage.getItem('auth_user')).toBeNull();
      expect(tokenService.getAccessToken()).toBeNull();
    });
  });

  describe('Token storage on login', () => {
    it('should store tokens when user logs in', async () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      authService = TestBed.inject(AuthService);

      await authService.login({
        email: 'employee@chronos.com',
        password: 'password'
      });

      // Verify token was stored
      const token = tokenService.getAccessToken();
      expect(token).toBeTruthy();
      expect(token).toContain('.'); // JWT format check

      // Verify token is not expired
      expect(tokenService.isTokenExpired()).toBe(false);
      expect(tokenService.hasValidToken()).toBe(true);
    });

    it('should store tokens with correct expiration', async () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      authService = TestBed.inject(AuthService);

      await authService.login({
        email: 'admin@chronos.com',
        password: 'password'
      });

      const tokens = tokenService.getTokens();
      expect(tokens).toBeTruthy();
      
      // Token should expire in approximately 24 hours
      const timeRemaining = tokenService.getTimeUntilExpiration();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      // Allow for small timing differences (within 5 seconds)
      expect(timeRemaining).toBeGreaterThan(twentyFourHours - 5000);
      expect(timeRemaining).toBeLessThanOrEqual(twentyFourHours);
    });
  });

  describe('Token cleanup on logout', () => {
    it('should clear all tokens on logout', async () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      authService = TestBed.inject(AuthService);

      // Login first
      await authService.login({
        email: 'employee@chronos.com',
        password: 'password'
      });

      expect(tokenService.getAccessToken()).toBeTruthy();
      expect(localStorage.getItem('auth_user')).toBeTruthy();

      // Logout
      authService.logout();

      // Verify all data is cleared
      expect(tokenService.getAccessToken()).toBeNull();
      expect(tokenService.getRefreshToken()).toBeNull();
      expect(localStorage.getItem('auth_user')).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('Session persistence across multiple refreshes', () => {
    it('should maintain session across multiple service reinitializations', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      // Set up initial session
      const mockUser = {
        id: '1',
        email: 'test@chronos.com',
        name: 'Test User',
        role: UserRole.COMPANY_ADMIN
      };
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      tokenService.setTokens({
        accessToken: 'persistent-token',
        expiresAt: Date.now() + 3600000
      });

      // Simulate first refresh
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: Router, useValue: router }
        ]
      });
      let service = TestBed.inject(AuthService);
      expect(service.isAuthenticated()).toBe(true);

      // Simulate second refresh
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: Router, useValue: router }
        ]
      });
      service = TestBed.inject(AuthService);
      expect(service.isAuthenticated()).toBe(true);

      // Simulate third refresh
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: Router, useValue: router }
        ]
      });
      service = TestBed.inject(AuthService);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).toEqual(mockUser);
    });
  });
});
