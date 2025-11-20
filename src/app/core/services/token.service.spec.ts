import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TokenService, AuthTokens } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(TokenService);

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

  describe('setTokens and getTokens', () => {
    it('should store and retrieve tokens', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      const tokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000 // 1 hour from now
      };

      service.setTokens(tokens);
      const retrieved = service.getTokens();

      expect(retrieved).toEqual(tokens);
    });

    it('should store tokens without refresh token', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      const tokens: AuthTokens = {
        accessToken: 'test-access-token',
        expiresAt: Date.now() + 3600000
      };

      service.setTokens(tokens);
      const retrieved = service.getTokens();

      expect(retrieved?.accessToken).toBe(tokens.accessToken);
      expect(retrieved?.expiresAt).toBe(tokens.expiresAt);
      expect(retrieved?.refreshToken).toBeUndefined();
    });

    it('should return null when no tokens are stored', () => {
      const tokens = service.getTokens();
      expect(tokens).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('should retrieve access token', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      const tokens: AuthTokens = {
        accessToken: 'test-access-token',
        expiresAt: Date.now() + 3600000
      };

      service.setTokens(tokens);
      expect(service.getAccessToken()).toBe('test-access-token');
    });

    it('should return null when no access token exists', () => {
      expect(service.getAccessToken()).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should retrieve refresh token when present', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      const tokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000
      };

      service.setTokens(tokens);
      expect(service.getRefreshToken()).toBe('test-refresh-token');
    });

    it('should return null when no refresh token exists', () => {
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid future token', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      const tokens: AuthTokens = {
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000 // 1 hour from now
      };

      service.setTokens(tokens);
      expect(service.isTokenExpired()).toBe(false);
    });

    it('should return true for expired token', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      const tokens: AuthTokens = {
        accessToken: 'test-token',
        expiresAt: Date.now() - 1000 // 1 second ago
      };

      service.setTokens(tokens);
      expect(service.isTokenExpired()).toBe(true);
    });

    it('should return true when no token exists', () => {
      expect(service.isTokenExpired()).toBe(true);
    });

    it('should return true when token expires within buffer period', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      // Token expires in 2 minutes (less than 5 minute buffer)
      const tokens: AuthTokens = {
        accessToken: 'test-token',
        expiresAt: Date.now() + (2 * 60 * 1000)
      };

      service.setTokens(tokens);
      expect(service.isTokenExpired()).toBe(true);
    });
  });

  describe('hasValidToken', () => {
    it('should return true for valid token', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      const tokens: AuthTokens = {
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000
      };

      service.setTokens(tokens);
      expect(service.hasValidToken()).toBe(true);
    });

    it('should return false for expired token', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      const tokens: AuthTokens = {
        accessToken: 'test-token',
        expiresAt: Date.now() - 1000
      };

      service.setTokens(tokens);
      expect(service.hasValidToken()).toBe(false);
    });

    it('should return false when no token exists', () => {
      expect(service.hasValidToken()).toBe(false);
    });
  });

  describe('clearTokens', () => {
    it('should remove all stored tokens', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      const tokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000
      };

      service.setTokens(tokens);
      expect(service.getTokens()).not.toBeNull();

      service.clearTokens();
      expect(service.getTokens()).toBeNull();
      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('getTimeUntilExpiration', () => {
    it('should return correct time remaining', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      const oneHourMs = 3600000;
      const tokens: AuthTokens = {
        accessToken: 'test-token',
        expiresAt: Date.now() + oneHourMs
      };

      service.setTokens(tokens);
      const timeRemaining = service.getTimeUntilExpiration();

      // Allow for small timing differences
      expect(timeRemaining).toBeGreaterThan(oneHourMs - 1000);
      expect(timeRemaining).toBeLessThanOrEqual(oneHourMs);
    });

    it('should return 0 for expired token', () => {
      if (typeof window === 'undefined') {
        pending('localStorage not available');
        return;
      }

      const tokens: AuthTokens = {
        accessToken: 'test-token',
        expiresAt: Date.now() - 1000
      };

      service.setTokens(tokens);
      expect(service.getTimeUntilExpiration()).toBe(0);
    });

    it('should return 0 when no token exists', () => {
      expect(service.getTimeUntilExpiration()).toBe(0);
    });
  });
});
