import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginCredentials, UserRole } from '../models/auth.model';
import { LoginResponse } from '../models/api.model';
import { environment } from '../../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let router: jasmine.SpyObj<Router>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });
    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    // Clean up localStorage after each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    // Verify no outstanding HTTP requests
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with unauthenticated state', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('should successfully login with valid credentials', async () => {
    const credentials: LoginCredentials = {
      email: 'admin@chronos.com',
      password: 'password123',
    };

    const mockResponse: LoginResponse = {
      user: {
        id: '1',
        email: 'admin@chronos.com',
        name: 'Admin User',
        role: 'super_admin',
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };

    const loginPromise = service.login(credentials);

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: credentials.email,
      password: credentials.password,
    });

    req.flush(mockResponse);

    await loginPromise;

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toBeTruthy();
    expect(service.currentUser()?.email).toBe('admin@chronos.com');
    expect(service.currentUser()?.role).toBe(UserRole.SUPER_ADMIN);
  });

  it('should fail login with invalid credentials', async () => {
    const credentials: LoginCredentials = {
      email: 'invalid@example.com',
      password: 'password123',
    };

    const loginPromise = service.login(credentials);

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    try {
      await loginPromise;
      fail('Should have thrown an error');
    } catch (error) {
      expect(service.isAuthenticated()).toBe(false);
      expect(service.error()).toBeTruthy();
    }
  });

  it('should set loading state during login', () => {
    const credentials: LoginCredentials = {
      email: 'admin@chronos.com',
      password: 'password123',
    };

    service.login(credentials);

    // Should be loading immediately after calling login
    expect(service.isLoading()).toBe(true);

    // Cancel the request
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({}, { status: 500, statusText: 'Error' });
  });

  it('should logout and clear user data', async () => {
    if (typeof window === 'undefined') {
      pending('localStorage not available');
      return;
    }

    // Set up a logged-in state manually
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.EMPLOYEE,
    };

    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    localStorage.setItem('auth_access_token', 'mock-token');
    localStorage.setItem('auth_refresh_token', 'mock-refresh');
    localStorage.setItem('auth_expires_at', String(Date.now() + 3600000));

    // Reinitialize service to pick up the stored data
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    const newService = TestBed.inject(AuthService);
    const newHttpMock = TestBed.inject(HttpTestingController);

    expect(newService.isAuthenticated()).toBe(true);

    // Then logout
    const logoutPromise = newService.logout();

    // Expect logout API call
    const req = newHttpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    req.flush({});

    await logoutPromise;

    expect(newService.isAuthenticated()).toBe(false);
    expect(newService.currentUser()).toBeNull();

    newHttpMock.verify();
  });

  it('should clear error messages', async () => {
    // Try to login with invalid credentials
    const loginPromise = service.login({
      email: 'invalid@example.com',
      password: 'password123',
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ message: 'Invalid' }, { status: 401, statusText: 'Unauthorized' });

    try {
      await loginPromise;
    } catch (error) {
      // Error expected
    }

    expect(service.error()).toBeTruthy();

    service.clearError();

    expect(service.error()).toBeNull();
  });

  it('should refresh token successfully', async () => {
    if (typeof window === 'undefined') {
      pending('localStorage not available');
      return;
    }

    // Set up tokens
    localStorage.setItem('auth_refresh_token', 'mock-refresh-token');

    const mockResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
    };

    const refreshPromise = service.refreshToken();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'mock-refresh-token' });

    req.flush(mockResponse);

    await refreshPromise;

    // Verify tokens were updated
    const storedToken = localStorage.getItem('auth_access_token');
    expect(storedToken).toBe('new-access-token');
  });
});
