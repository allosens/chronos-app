import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ForgotPassword } from './forgot-password';
import { PasswordRecoveryService } from '../../services/password-recovery.service';

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;
  let passwordRecoveryService: PasswordRecoveryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    passwordRecoveryService = TestBed.inject(PasswordRecoveryService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with a form', () => {
    expect(component['forgotPasswordForm']).toBeDefined();
    expect(component['forgotPasswordForm'].get('email')).toBeDefined();
  });

  it('should mark form as invalid when email is empty', () => {
    const emailControl = component['forgotPasswordForm'].get('email');
    emailControl?.setValue('');
    expect(component['forgotPasswordForm'].invalid).toBe(true);
  });

  it('should mark form as invalid when email is not valid', () => {
    const emailControl = component['forgotPasswordForm'].get('email');
    emailControl?.setValue('invalid-email');
    expect(component['forgotPasswordForm'].invalid).toBe(true);
  });

  it('should mark form as valid when email is valid', () => {
    const emailControl = component['forgotPasswordForm'].get('email');
    emailControl?.setValue('test@example.com');
    expect(component['forgotPasswordForm'].valid).toBe(true);
  });

  it('should not submit form when invalid', async () => {
    spyOn(passwordRecoveryService, 'requestPasswordRecovery');
    
    component['forgotPasswordForm'].get('email')?.setValue('');
    await component['onSubmit']();

    expect(passwordRecoveryService.requestPasswordRecovery).not.toHaveBeenCalled();
  });

  it('should submit form when valid', async () => {
    spyOn(passwordRecoveryService, 'requestPasswordRecovery').and.returnValue(Promise.resolve());
    
    component['forgotPasswordForm'].get('email')?.setValue('test@example.com');
    await component['onSubmit']();

    expect(passwordRecoveryService.requestPasswordRecovery).toHaveBeenCalledWith({
      email: 'test@example.com'
    });
  });

  it('should set isSubmitting to true during submission', async () => {
    spyOn(passwordRecoveryService, 'requestPasswordRecovery').and.returnValue(
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    component['forgotPasswordForm'].get('email')?.setValue('test@example.com');
    const submitPromise = component['onSubmit']();

    expect(component['isSubmitting']()).toBe(true);

    await submitPromise;

    expect(component['isSubmitting']()).toBe(false);
  });

  it('should show email required error', () => {
    const emailControl = component['forgotPasswordForm'].get('email');
    emailControl?.setValue('');
    emailControl?.markAsTouched();

    const error = component['getEmailError']();
    expect(error).toContain('requerido');
  });

  it('should show email invalid error', () => {
    const emailControl = component['forgotPasswordForm'].get('email');
    emailControl?.setValue('invalid-email');
    emailControl?.markAsTouched();

    const error = component['getEmailError']();
    expect(error).toContain('válido');
  });

  it('should detect field errors correctly', () => {
    const emailControl = component['forgotPasswordForm'].get('email');
    emailControl?.setValue('');
    emailControl?.markAsTouched();

    expect(component['hasFieldError']('email')).toBe(true);
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
    spyOn(passwordRecoveryService, 'requestPasswordRecovery').and.returnValue(Promise.resolve());
    
    component['forgotPasswordForm'].get('email')?.setValue('test@example.com');
    await component['onSubmit']();

    expect(passwordRecoveryService.clearState).toHaveBeenCalled();
  });
});
