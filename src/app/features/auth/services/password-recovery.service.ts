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

  // Store recovery tokens in memory (mock implementation)
  private recoveryTokens = new Map<string, RecoveryToken>();

  /**
   * Token expiration time in milliseconds (15 minutes)
   */
  private readonly TOKEN_EXPIRATION_MS = 15 * 60 * 1000;

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

      // Store the token
      this.recoveryTokens.set(token, {
        token,
        email: request.email,
        expiresAt
      });

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

      // Validate token
      const tokenData = this.recoveryTokens.get(request.token);
      
      if (!tokenData) {
        throw new Error('Token inválido o expirado');
      }

      // Check if token has expired
      if (Date.now() > tokenData.expiresAt) {
        this.recoveryTokens.delete(request.token);
        throw new Error('El token ha expirado. Por favor, solicita un nuevo enlace de recuperación.');
      }

      // Validate password match
      if (request.newPassword !== request.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      // Validate password strength
      if (request.newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Remove the used token
      this.recoveryTokens.delete(request.token);

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
    const tokenData = this.recoveryTokens.get(token);
    
    if (!tokenData) {
      return false;
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiresAt) {
      this.recoveryTokens.delete(token);
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
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
