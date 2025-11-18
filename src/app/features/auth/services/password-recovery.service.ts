import { Injectable, signal } from '@angular/core';
import { 
  ForgotPasswordRequest, 
  ResetPasswordRequest, 
  PasswordRecoveryState 
} from '../models/auth.model';

interface RecoveryToken {
  token: string;
  email: string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordRecoveryService {
  // Password recovery state signal
  private recoveryStateSignal = signal<PasswordRecoveryState>({
    isLoading: false,
    error: null,
    success: false,
    message: null
  });

  // Public readonly signal
  readonly recoveryState = this.recoveryStateSignal.asReadonly();

  /**
   * Token expiration time in milliseconds (15 minutes)
   */
  private readonly TOKEN_EXPIRATION_MS = 15 * 60 * 1000;

  /**
   * LocalStorage key for recovery tokens
   */
  private readonly STORAGE_KEY = 'password_recovery_tokens';

  /**
   * Get all recovery tokens from localStorage
   */
  private getTokensFromStorage(): Map<string, RecoveryToken> {
    if (typeof window === 'undefined') {
      return new Map();
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return new Map();
      }

      const parsed = JSON.parse(stored);
      return new Map(Object.entries(parsed));
    } catch (error) {
      console.error('Error reading recovery tokens from storage:', error);
      return new Map();
    }
  }

  /**
   * Save recovery tokens to localStorage
   */
  private saveTokensToStorage(tokens: Map<string, RecoveryToken>): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const obj = Object.fromEntries(tokens);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Error saving recovery tokens to storage:', error);
    }
  }

  /**
   * Clean up expired tokens from storage.
   * Called before token validation to ensure expired tokens are removed.
   * @private
   */
  private cleanExpiredTokens(): void {
    const tokens = this.getTokensFromStorage();
    const now = Date.now();
    let hasExpired = false;

    tokens.forEach((tokenData, token) => {
      if (now > tokenData.expiresAt) {
        tokens.delete(token);
        hasExpired = true;
      }
    });

    if (hasExpired) {
      this.saveTokensToStorage(tokens);
    }
  }

  /**
   * Request password recovery for a user
   * For now, this is a mock implementation - to be replaced with real API call
   */
  async requestPasswordRecovery(request: ForgotPasswordRequest): Promise<void> {
    this.recoveryStateSignal.set({
      isLoading: true,
      error: null,
      success: false,
      message: null
    });

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate a mock recovery token
      const token = this.generateToken();
      const expiresAt = Date.now() + this.TOKEN_EXPIRATION_MS;

      // Store the token in localStorage
      const tokens = this.getTokensFromStorage();
      tokens.set(token, {
        token,
        email: request.email,
        expiresAt
      });
      this.saveTokensToStorage(tokens);

      // In a real implementation, this would send an email with a link
      console.log(`Password recovery link: /auth/reset-password?token=${token}`);

      this.recoveryStateSignal.set({
        isLoading: false,
        error: null,
        success: true,
        message: `Se ha enviado un correo electrónico a ${request.email} con instrucciones para recuperar tu contraseña.`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar la solicitud';
      this.recoveryStateSignal.set({
        isLoading: false,
        error: errorMessage,
        success: false,
        message: null
      });
      throw error;
    }
  }

  /**
   * Reset password with a valid token
   * For now, this is a mock implementation - to be replaced with real API call
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    this.recoveryStateSignal.set({
      isLoading: true,
      error: null,
      success: false,
      message: null
    });

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clean expired tokens first
      this.cleanExpiredTokens();

      // Get tokens from storage
      const tokens = this.getTokensFromStorage();
      const tokenData = tokens.get(request.token);
      
      if (!tokenData) {
        throw new Error('Token inválido o expirado');
      }

      // Check if token has expired
      if (Date.now() > tokenData.expiresAt) {
        tokens.delete(request.token);
        this.saveTokensToStorage(tokens);
        throw new Error('El token ha expirado. Por favor, solicita un nuevo enlace de recuperación.');
      }


      // Validate password strength
      if (request.newPassword.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      // Remove the used token
      tokens.delete(request.token);
      this.saveTokensToStorage(tokens);

      // In a real implementation, this would update the password in the backend
      console.log(`Password reset successfully for email: ${tokenData.email}`);

      this.recoveryStateSignal.set({
        isLoading: false,
        error: null,
        success: true,
        message: 'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al restablecer la contraseña';
      this.recoveryStateSignal.set({
        isLoading: false,
        error: errorMessage,
        success: false,
        message: null
      });
      throw error;
    }
  }

  /**
   * Validate if a token is valid and not expired
   */
  async validateToken(token: string): Promise<boolean> {
    // Clean expired tokens first
    this.cleanExpiredTokens();

    const tokens = this.getTokensFromStorage();
    const tokenData = tokens.get(token);
    
    if (!tokenData) {
      return false;
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiresAt) {
      tokens.delete(token);
      this.saveTokensToStorage(tokens);
      return false;
    }

    return true;
  }

  /**
   * Clear recovery state
   */
  clearState(): void {
    this.recoveryStateSignal.set({
      isLoading: false,
      error: null,
      success: false,
      message: null
    });
  }

  /**
   * Generate a mock recovery token
   */
  private generateToken(): string {
    // Use a cryptographically secure random UUID for the token
    return crypto.randomUUID();
  }
}
