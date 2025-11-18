import { Component, signal, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { PasswordRecoveryService } from '../../services/password-recovery.service';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {
  private readonly passwordRecoveryService = inject(PasswordRecoveryService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly resetPasswordForm: FormGroup;
  protected readonly isSubmitting = signal(false);
  protected readonly showNewPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
  protected readonly token = signal<string | null>(null);
  protected readonly tokenValid = signal(false);
  protected readonly checkingToken = signal(true);

  // Expose service signals
  protected readonly recoveryState = this.passwordRecoveryService.recoveryState;

  constructor() {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  async ngOnInit(): Promise<void> {
    // Get token from query params
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    this.token.set(tokenParam);

    if (!tokenParam) {
      this.tokenValid.set(false);
      this.checkingToken.set(false);
      return;
    }

    // Validate token
    try {
      const isValid = await this.passwordRecoveryService.validateToken(tokenParam);
      this.tokenValid.set(isValid);
    } catch (error) {
      console.error('Token validation failed:', error);
      this.tokenValid.set(false);
    } finally {
      this.checkingToken.set(false);
    }
  }

  /**
   * Toggle new password visibility
   */
  protected toggleNewPasswordVisibility(): void {
    this.showNewPassword.update(show => !show);
  }

  /**
   * Toggle confirm password visibility
   */
  protected toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(show => !show);
  }

  /**
   * Handle reset password form submission
   */
  protected async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid || this.isSubmitting() || !this.token()) {
      this.markFormGroupTouched(this.resetPasswordForm);
      return;
    }

    // Check if passwords match
    const { newPassword, confirmPassword } = this.resetPasswordForm.value;
    if (newPassword !== confirmPassword) {
      this.resetPasswordForm.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }

    this.isSubmitting.set(true);
    this.passwordRecoveryService.clearState();

    try {
      await this.passwordRecoveryService.resetPassword({
        token: this.token()!,
        newPassword,
        confirmPassword
      });
      
      // Success - form will show success message with redirect option
    } catch (error) {
      // Error is handled by the service
      console.error('Password reset failed:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Navigate back to login
   */
  protected goToLogin(): void {
    this.passwordRecoveryService.clearState();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Mark all form controls as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get error message for new password field
   */
  protected getNewPasswordError(): string {
    const control = this.resetPasswordForm.get('newPassword');
    if (!control?.touched) return '';

    if (control.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (control.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  /**
   * Get error message for confirm password field
   */
  protected getConfirmPasswordError(): string {
    const control = this.resetPasswordForm.get('confirmPassword');
    if (!control?.touched) return '';

    if (control.hasError('required')) {
      return 'Debes confirmar la contraseña';
    }
    if (control.hasError('mismatch')) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  /**
   * Check if a form field has errors and is touched
   */
  protected hasFieldError(fieldName: string): boolean {
    const control = this.resetPasswordForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
