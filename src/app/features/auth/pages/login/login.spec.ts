import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Login } from './login';
import { AuthService } from '../../services/auth.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'clearError'], {
      error: jasmine.createSpy().and.returnValue(null),
      isLoading: jasmine.createSpy().and.returnValue(false)
    });

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component['loginForm'].get('email')?.value).toBe('');
    expect(component['loginForm'].get('password')?.value).toBe('');
  });

  it('should validate email field as required', () => {
    const emailControl = component['loginForm'].get('email');
    emailControl?.setValue('');
    emailControl?.markAsTouched();
    
    expect(emailControl?.hasError('required')).toBe(true);
  });

  it('should validate email field format', () => {
    const emailControl = component['loginForm'].get('email');
    emailControl?.setValue('invalid-email');
    emailControl?.markAsTouched();
    
    expect(emailControl?.hasError('email')).toBe(true);
  });

  it('should validate password field as required', () => {
    const passwordControl = component['loginForm'].get('password');
    passwordControl?.setValue('');
    passwordControl?.markAsTouched();
    
    expect(passwordControl?.hasError('required')).toBe(true);
  });

  it('should validate password minimum length', () => {
    const passwordControl = component['loginForm'].get('password');
    passwordControl?.setValue('12345');
    passwordControl?.markAsTouched();
    
    expect(passwordControl?.hasError('minlength')).toBe(true);
  });

  it('should accept valid email and password', () => {
    component['loginForm'].setValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(component['loginForm'].valid).toBe(true);
  });

  it('should call authService.login on valid form submission', async () => {
    authService.login.and.returnValue(Promise.resolve());
    
    component['loginForm'].setValue({
      email: 'test@example.com',
      password: 'password123'
    });

    await component['onSubmit']();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('should not call authService.login on invalid form submission', async () => {
    component['loginForm'].setValue({
      email: 'invalid-email',
      password: '123'
    });

    await component['onSubmit']();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should toggle password visibility', () => {
    expect(component['showPassword']()).toBe(false);
    
    component['togglePasswordVisibility']();
    expect(component['showPassword']()).toBe(true);
    
    component['togglePasswordVisibility']();
    expect(component['showPassword']()).toBe(false);
  });

  it('should return correct email error messages', () => {
    const emailControl = component['loginForm'].get('email');
    
    // Required error
    emailControl?.setValue('');
    emailControl?.markAsTouched();
    expect(component['getEmailError']()).toBe('El correo electrónico es requerido');
    
    // Invalid email error
    emailControl?.setValue('invalid-email');
    expect(component['getEmailError']()).toBe('El correo electrónico no es válido');
    
    // No error when valid
    emailControl?.setValue('test@example.com');
    expect(component['getEmailError']()).toBe('');
  });

  it('should return correct password error messages', () => {
    const passwordControl = component['loginForm'].get('password');
    
    // Required error
    passwordControl?.setValue('');
    passwordControl?.markAsTouched();
    expect(component['getPasswordError']()).toBe('La contraseña es requerida');
    
    // Min length error
    passwordControl?.setValue('12345');
    expect(component['getPasswordError']()).toBe('La contraseña debe tener al menos 6 caracteres');
    
    // No error when valid
    passwordControl?.setValue('password123');
    expect(component['getPasswordError']()).toBe('');
  });

  it('should set isSubmitting flag during login', async () => {
    authService.login.and.returnValue(new Promise(resolve => setTimeout(resolve, 100)));
    
    component['loginForm'].setValue({
      email: 'test@example.com',
      password: 'password123'
    });

    const submitPromise = component['onSubmit']();
    expect(component['isSubmitting']()).toBe(true);
    
    await submitPromise;
    expect(component['isSubmitting']()).toBe(false);
  });

  it('should handle login errors gracefully', async () => {
    authService.login.and.returnValue(Promise.reject(new Error('Login failed')));
    
    component['loginForm'].setValue({
      email: 'test@example.com',
      password: 'wrongpassword'
    });

    await component['onSubmit']();

    expect(component['isSubmitting']()).toBe(false);
  });
});
