import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PasswordRecoveryService } from './password-recovery.service';
import { ForgotPasswordRequest, ResetPasswordRequest } from '../models/auth.model';

describe('PasswordRecoveryService', () => {
  let service: PasswordRecoveryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection()
      ]
    });
    service = TestBed.inject(PasswordRecoveryService);
    
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

  it('should start with default recovery state', () => {
    const state = service.recoveryState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.success).toBe(false);
    expect(state.message).toBeNull();
  });

  describe('requestPasswordRecovery', () => {
    it('should successfully request password recovery', async () => {
      const request: ForgotPasswordRequest = {
        email: 'test@example.com'
      };

      await service.requestPasswordRecovery(request);

      const state = service.recoveryState();
      expect(state.success).toBe(true);
      expect(state.error).toBeNull();
      expect(state.message).toContain('test@example.com');
      expect(state.isLoading).toBe(false);
    });

    it('should set loading state during request', async () => {
      const request: ForgotPasswordRequest = {
        email: 'test@example.com'
      };

      const recoveryPromise = service.requestPasswordRecovery(request);
      
      // Should be loading immediately after calling
      expect(service.recoveryState().isLoading).toBe(true);
      
      await recoveryPromise;
      
      // Should not be loading after request completes
      expect(service.recoveryState().isLoading).toBe(false);
    });
  });

  describe('resetPassword', () => {
    // Helper function to get token from localStorage
    const getTokenFromStorage = (): string | null => {
      if (typeof window === 'undefined') return null;
      const stored = localStorage.getItem('password_recovery_tokens');
      if (!stored) return null;
      const tokens = JSON.parse(stored);
      return Object.keys(tokens)[0] || null;
    };

    it('should successfully reset password with valid token', async () => {
      // First request a password recovery to generate a token
      const forgotRequest: ForgotPasswordRequest = {
        email: 'test@example.com'
      };
      await service.requestPasswordRecovery(forgotRequest);

      // Get the token from localStorage
      const token = getTokenFromStorage();
      expect(token).toBeTruthy();

      const resetRequest: ResetPasswordRequest = {
        token: token!,
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123'
      };

      service.clearState(); // Clear success state from previous request
      await service.resetPassword(resetRequest);

      const state = service.recoveryState();
      expect(state.success).toBe(true);
      expect(state.error).toBeNull();
      expect(state.message).toContain('exitosamente');
    });

    it('should fail with invalid token', async () => {
      const resetRequest: ResetPasswordRequest = {
        token: 'invalid-token',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123'
      };

      try {
        await service.resetPassword(resetRequest);
        fail('Should have thrown an error');
      } catch (error) {
        const state = service.recoveryState();
        expect(state.success).toBe(false);
        expect(state.error).toBeTruthy();
        expect(state.error).toContain('inválido');
      }
    });

    it('should fail when passwords do not match', async () => {
      // First request a password recovery to generate a token
      await service.requestPasswordRecovery({ email: 'test@example.com' });
      const token = getTokenFromStorage();
      expect(token).toBeTruthy();

      const resetRequest: ResetPasswordRequest = {
        token: token!,
        newPassword: 'newPassword123',
        confirmPassword: 'differentPassword'
      };

      service.clearState();
      try {
        await service.resetPassword(resetRequest);
        fail('Should have thrown an error');
      } catch (error) {
        const state = service.recoveryState();
        expect(state.success).toBe(false);
        expect(state.error).toContain('no coinciden');
      }
    });

    it('should fail when password is too short', async () => {
      // First request a password recovery to generate a token
      await service.requestPasswordRecovery({ email: 'test@example.com' });
      const token = getTokenFromStorage();
      expect(token).toBeTruthy();

      const resetRequest: ResetPasswordRequest = {
        token: token!,
        newPassword: '12345',
        confirmPassword: '12345'
      };

      service.clearState();
      try {
        await service.resetPassword(resetRequest);
        fail('Should have thrown an error');
      } catch (error) {
        const state = service.recoveryState();
        expect(state.success).toBe(false);
        expect(state.error).toContain('al menos 6 caracteres');
      }
    });

    it('should remove token after successful reset', async () => {
      // First request a password recovery to generate a token
      await service.requestPasswordRecovery({ email: 'test@example.com' });
      const token = getTokenFromStorage();
      expect(token).toBeTruthy();

      const resetRequest: ResetPasswordRequest = {
        token: token!,
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123'
      };

      service.clearState();
      await service.resetPassword(resetRequest);

      // Token should be removed after use
      const isValid = await service.validateToken(token!);
      expect(isValid).toBe(false);
    });
  });

  describe('validateToken', () => {
    // Helper function to get token from localStorage (same as above)
    const getTokenFromStorage = (): string | null => {
      if (typeof window === 'undefined') return null;
      const stored = localStorage.getItem('password_recovery_tokens');
      if (!stored) return null;
      const tokens = JSON.parse(stored);
      return Object.keys(tokens)[0] || null;
    };

    it('should return true for valid token', async () => {
      // First request a password recovery to generate a token
      await service.requestPasswordRecovery({ email: 'test@example.com' });
      const token = getTokenFromStorage();
      expect(token).toBeTruthy();

      const isValid = await service.validateToken(token!);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid token', async () => {
      const isValid = await service.validateToken('invalid-token');
      expect(isValid).toBe(false);
    });

    it('should return false for expired token', async () => {
      // First request a password recovery to generate a token
      await service.requestPasswordRecovery({ email: 'test@example.com' });
      const token = getTokenFromStorage();
      expect(token).toBeTruthy();

      // Manually expire the token in localStorage
      const stored = localStorage.getItem('password_recovery_tokens');
      if (stored) {
        const tokens = JSON.parse(stored);
        const tokenData = tokens[token!];
        tokenData.expiresAt = Date.now() - 1000; // Set expiry to 1 second ago
        localStorage.setItem('password_recovery_tokens', JSON.stringify(tokens));
      }

      const isValid = await service.validateToken(token!);
      expect(isValid).toBe(false);
    });
  });

  describe('clearState', () => {
    it('should clear recovery state', async () => {
      // First request a password recovery to set some state
      await service.requestPasswordRecovery({ email: 'test@example.com' });
      
      expect(service.recoveryState().success).toBe(true);

      // Clear state
      service.clearState();

      const state = service.recoveryState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.success).toBe(false);
      expect(state.message).toBeNull();
    });
  });
});
