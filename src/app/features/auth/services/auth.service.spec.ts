import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AuthService } from './auth.service';
import { LoginCredentials, UserRole } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(AuthService);
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
      password: 'password123'
    };

    await service.login(credentials);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toBeTruthy();
    expect(service.currentUser()?.email).toBe('admin@chronos.com');
    expect(service.currentUser()?.role).toBe(UserRole.SUPER_ADMIN);
  });

  it('should fail login with invalid credentials', async () => {
    const credentials: LoginCredentials = {
      email: 'invalid@example.com',
      password: 'password123'
    };

    try {
      await service.login(credentials);
      fail('Should have thrown an error');
    } catch (error) {
      expect(service.isAuthenticated()).toBe(false);
      expect(service.error()).toBeTruthy();
    }
  });

  it('should set loading state during login', async () => {
    const credentials: LoginCredentials = {
      email: 'admin@chronos.com',
      password: 'password123'
    };

    const loginPromise = service.login(credentials);
    
    // Should be loading immediately after calling login
    expect(service.isLoading()).toBe(true);
    
    await loginPromise;
    
    // Should not be loading after login completes
    expect(service.isLoading()).toBe(false);
  });

  it('should logout and clear user data', async () => {
    // First login
    await service.login({
      email: 'admin@chronos.com',
      password: 'password123'
    });

    expect(service.isAuthenticated()).toBe(true);

    // Then logout
    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should clear error messages', async () => {
    // Try to login with invalid credentials
    try {
      await service.login({
        email: 'invalid@example.com',
        password: 'password123'
      });
    } catch (error) {
      // Error expected
    }

    expect(service.error()).toBeTruthy();

    service.clearError();

    expect(service.error()).toBeNull();
  });

  it('should load user from localStorage on initialization', () => {
    if (typeof window === 'undefined') {
      pending('localStorage not available in this environment');
      return;
    }

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.EMPLOYEE
    };

    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    // Create a new instance of the service
    const newService = new AuthService();

    expect(newService.isAuthenticated()).toBe(true);
    expect(newService.currentUser()).toEqual(mockUser);
  });
});
