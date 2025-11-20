import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { TokenService } from '../services/token.service';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let tokenService: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    tokenService = TestBed.inject(TokenService);

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    httpMock.verify();
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should add Authorization header when token exists', () => {
    if (typeof window === 'undefined') {
      pending('localStorage not available');
      return;
    }

    // Set up a valid token
    tokenService.setTokens({
      accessToken: 'test-token-123',
      expiresAt: Date.now() + 3600000
    });

    httpClient.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');

    req.flush({});
  });

  it('should not add Authorization header when no token exists', () => {
    httpClient.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({});
  });

  it('should not add Authorization header for login endpoint', () => {
    if (typeof window === 'undefined') {
      pending('localStorage not available');
      return;
    }

    // Set up a token
    tokenService.setTokens({
      accessToken: 'test-token-123',
      expiresAt: Date.now() + 3600000
    });

    httpClient.post('/api/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({});
  });

  it('should not add Authorization header for register endpoint', () => {
    if (typeof window === 'undefined') {
      pending('localStorage not available');
      return;
    }

    // Set up a token
    tokenService.setTokens({
      accessToken: 'test-token-123',
      expiresAt: Date.now() + 3600000
    });

    httpClient.post('/api/register', {}).subscribe();

    const req = httpMock.expectOne('/api/register');
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({});
  });

  it('should handle multiple concurrent requests', () => {
    if (typeof window === 'undefined') {
      pending('localStorage not available');
      return;
    }

    tokenService.setTokens({
      accessToken: 'test-token-456',
      expiresAt: Date.now() + 3600000
    });

    httpClient.get('/api/data1').subscribe();
    httpClient.get('/api/data2').subscribe();
    httpClient.get('/api/data3').subscribe();

    const req1 = httpMock.expectOne('/api/data1');
    const req2 = httpMock.expectOne('/api/data2');
    const req3 = httpMock.expectOne('/api/data3');

    expect(req1.request.headers.get('Authorization')).toBe('Bearer test-token-456');
    expect(req2.request.headers.get('Authorization')).toBe('Bearer test-token-456');
    expect(req3.request.headers.get('Authorization')).toBe('Bearer test-token-456');

    req1.flush({});
    req2.flush({});
    req3.flush({});
  });
});
