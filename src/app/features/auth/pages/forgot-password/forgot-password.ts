import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordRecoveryService } from '../../services/password-recovery.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  private readonly passwordRecoveryService = inject(PasswordRecoveryService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly forgotPasswordForm: FormGroup;
  protected readonly isSubmitting = signal(false);

  // Expose service signals
  protected readonly recoveryState = this.passwordRecoveryService.recoveryState;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Handle forgot password form submission
   */
  protected async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.invalid || this.isSubmitting()) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.isSubmitting.set(true);
    this.passwordRecoveryService.clearState();

    try {
      await this.passwordRecoveryService.requestPasswordRecovery(
        this.forgotPasswordForm.value
      );
      
      // Form will remain showing success message
      // User can submit again with different email or navigate away
    } catch (error) {
      // Error is handled by the service
      console.error('Password recovery request failed:', error);
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
   * Get error message for email field
   */
  protected getEmailError(): string {
    const emailControl = this.forgotPasswordForm.get('email');
    if (!emailControl?.touched) return '';

    if (emailControl.hasError('required')) {
      return 'El correo electrónico es requerido';
    }
    if (emailControl.hasError('email')) {
      return 'El correo electrónico no es válido';
    }
    return '';
  }

  /**
   * Check if a form field has errors and is touched
   */
  protected hasFieldError(fieldName: string): boolean {
    const control = this.forgotPasswordForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
