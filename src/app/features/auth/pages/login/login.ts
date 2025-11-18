import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly loginForm: FormGroup;
  protected readonly isSubmitting = signal(false);
  protected readonly showPassword = signal(false);

  // Expose auth service signals
  protected readonly authError = this.authService.error;
  protected readonly isLoading = this.authService.isLoading;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Toggle password visibility
   */
  protected togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }

  /**
   * Handle login form submission
   */
  protected async onSubmit(): Promise<void> {
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isSubmitting.set(true);
    this.authService.clearError();

    try {
      await this.authService.login(this.loginForm.value);
    } catch (error) {
      // Error is handled by the service
      console.error('Login failed:', error);
    } finally {
      this.isSubmitting.set(false);
    }
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
    const emailControl = this.loginForm.get('email');
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
   * Get error message for password field
   */
  protected getPasswordError(): string {
    const passwordControl = this.loginForm.get('password');
    if (!passwordControl?.touched) return '';

    if (passwordControl.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (passwordControl.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  /**
   * Check if a form field has errors and is touched
   */
  protected hasFieldError(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
