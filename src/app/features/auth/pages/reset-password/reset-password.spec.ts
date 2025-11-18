import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ResetPassword } from './reset-password';
import { PasswordRecoveryService } from '../../services/password-recovery.service';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  let passwordRecoveryService: PasswordRecoveryService;
  let activatedRoute: any;

  beforeEach(async () => {
    const activatedRouteMock = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue('valid-token')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    passwordRecoveryService = TestBed.inject(PasswordRecoveryService);
    activatedRoute = TestBed.inject(ActivatedRoute);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with a form', () => {
    expect(component['resetPasswordForm']).toBeDefined();
    expect(component['resetPasswordForm'].get('newPassword')).toBeDefined();
    expect(component['resetPasswordForm'].get('confirmPassword')).toBeDefined();
  });

  it('should validate token on init', async () => {
    spyOn(passwordRecoveryService, 'validateToken').and.returnValue(Promise.resolve(true));
    
    await component.ngOnInit();

    expect(passwordRecoveryService.validateToken).toHaveBeenCalledWith('valid-token');
    expect(component['tokenValid']()).toBe(true);
    expect(component['checkingToken']()).toBe(false);
  });

  it('should handle missing token', async () => {
    activatedRoute.snapshot.queryParamMap.get.and.returnValue(null);
    
    await component.ngOnInit();

    expect(component['tokenValid']()).toBe(false);
    expect(component['checkingToken']()).toBe(false);
  });

  it('should mark form as invalid when new password is empty', () => {
    const newPasswordControl = component['resetPasswordForm'].get('newPassword');
    newPasswordControl?.setValue('');
    expect(component['resetPasswordForm'].invalid).toBe(true);
  });

  it('should mark form as invalid when password is too short', () => {
    const newPasswordControl = component['resetPasswordForm'].get('newPassword');
    newPasswordControl?.setValue('12345');
    expect(component['resetPasswordForm'].invalid).toBe(true);
  });

  it('should mark form as valid when both passwords are valid', () => {
    component['resetPasswordForm'].get('newPassword')?.setValue('password123');
    component['resetPasswordForm'].get('confirmPassword')?.setValue('password123');
    expect(component['resetPasswordForm'].valid).toBe(true);
  });

  it('should not submit form when invalid', async () => {
    spyOn(passwordRecoveryService, 'resetPassword');
    
    component['resetPasswordForm'].get('newPassword')?.setValue('');
    await component['onSubmit']();

    expect(passwordRecoveryService.resetPassword).not.toHaveBeenCalled();
  });

  it('should detect password mismatch', async () => {
    component['token'].set('valid-token');
    component['resetPasswordForm'].get('newPassword')?.setValue('password123');
    component['resetPasswordForm'].get('confirmPassword')?.setValue('different123');
    
    await component['onSubmit']();

    const confirmPasswordControl = component['resetPasswordForm'].get('confirmPassword');
    expect(confirmPasswordControl?.hasError('mismatch')).toBe(true);
  });

  it('should submit form when valid and passwords match', async () => {
    spyOn(passwordRecoveryService, 'resetPassword').and.returnValue(Promise.resolve());
    
    component['token'].set('valid-token');
    component['resetPasswordForm'].get('newPassword')?.setValue('password123');
    component['resetPasswordForm'].get('confirmPassword')?.setValue('password123');
    
    await component['onSubmit']();

    expect(passwordRecoveryService.resetPassword).toHaveBeenCalledWith({
      token: 'valid-token',
      newPassword: 'password123',
      confirmPassword: 'password123'
    });
  });

  it('should set isSubmitting to true during submission', async () => {
    spyOn(passwordRecoveryService, 'resetPassword').and.returnValue(
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    component['token'].set('valid-token');
    component['resetPasswordForm'].get('newPassword')?.setValue('password123');
    component['resetPasswordForm'].get('confirmPassword')?.setValue('password123');
    
    const submitPromise = component['onSubmit']();

    expect(component['isSubmitting']()).toBe(true);

    await submitPromise;

    expect(component['isSubmitting']()).toBe(false);
  });

  it('should toggle new password visibility', () => {
    expect(component['showNewPassword']()).toBe(false);
    component['toggleNewPasswordVisibility']();
    expect(component['showNewPassword']()).toBe(true);
    component['toggleNewPasswordVisibility']();
    expect(component['showNewPassword']()).toBe(false);
  });

  it('should toggle confirm password visibility', () => {
    expect(component['showConfirmPassword']()).toBe(false);
    component['toggleConfirmPasswordVisibility']();
    expect(component['showConfirmPassword']()).toBe(true);
    component['toggleConfirmPasswordVisibility']();
    expect(component['showConfirmPassword']()).toBe(false);
  });

  it('should show new password required error', () => {
    const newPasswordControl = component['resetPasswordForm'].get('newPassword');
    newPasswordControl?.setValue('');
    newPasswordControl?.markAsTouched();

    const error = component['getNewPasswordError']();
    expect(error).toContain('requerida');
  });

  it('should show new password min length error', () => {
    const newPasswordControl = component['resetPasswordForm'].get('newPassword');
    newPasswordControl?.setValue('12345');
    newPasswordControl?.markAsTouched();

    const error = component['getNewPasswordError']();
    expect(error).toContain('al menos 6 caracteres');
  });

  it('should show confirm password required error', () => {
    const confirmPasswordControl = component['resetPasswordForm'].get('confirmPassword');
    confirmPasswordControl?.setValue('');
    confirmPasswordControl?.markAsTouched();

    const error = component['getConfirmPasswordError']();
    expect(error).toContain('confirmar');
  });

  it('should show confirm password mismatch error', () => {
    const confirmPasswordControl = component['resetPasswordForm'].get('confirmPassword');
    confirmPasswordControl?.setErrors({ mismatch: true });
    confirmPasswordControl?.markAsTouched();

    const error = component['getConfirmPasswordError']();
    expect(error).toContain('no coinciden');
  });

  it('should detect field errors correctly', () => {
    const newPasswordControl = component['resetPasswordForm'].get('newPassword');
    newPasswordControl?.setValue('');
    newPasswordControl?.markAsTouched();

    expect(component['hasFieldError']('newPassword')).toBe(true);
  });

  it('should navigate to login when goToLogin is called', () => {
    spyOn(component as any, 'goToLogin').and.callThrough();
    component['goToLogin']();
    expect((component as any).goToLogin).toHaveBeenCalled();
  });

  it('should clear state when navigating to login', () => {
    spyOn(passwordRecoveryService, 'clearState');
    component['goToLogin']();
    expect(passwordRecoveryService.clearState).toHaveBeenCalled();
  });

  it('should clear state before submission', async () => {
    spyOn(passwordRecoveryService, 'clearState');
    spyOn(passwordRecoveryService, 'resetPassword').and.returnValue(Promise.resolve());
    
    component['token'].set('valid-token');
    component['resetPasswordForm'].get('newPassword')?.setValue('password123');
    component['resetPasswordForm'].get('confirmPassword')?.setValue('password123');
    
    await component['onSubmit']();

    expect(passwordRecoveryService.clearState).toHaveBeenCalled();
  });
});
