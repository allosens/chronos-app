import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TokenRefreshService } from './token-refresh.service';
import { TokenService } from './token.service';

describe('TokenRefreshService', () => {
  let service: TokenRefreshService;
  let tokenService: jasmine.SpyObj<TokenService>;

  beforeEach(() => {
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', [
      'getTimeUntilExpiration',
      'needsRefresh',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TokenService, useValue: tokenServiceSpy },
      ],
    });
    service = TestBed.inject(TokenRefreshService);
    tokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start auto refresh', () => {
    expect(service.isAutoRefreshEnabled()).toBe(false);

    const mockCallback = jasmine.createSpy('refreshCallback').and.returnValue(Promise.resolve());
    tokenService.getTimeUntilExpiration.and.returnValue(10000);

    service.startAutoRefresh(mockCallback);

    expect(service.isAutoRefreshEnabled()).toBe(true);
  });

  it('should stop auto refresh', () => {
    const mockCallback = jasmine.createSpy('refreshCallback').and.returnValue(Promise.resolve());
    tokenService.getTimeUntilExpiration.and.returnValue(10000);

    service.startAutoRefresh(mockCallback);
    expect(service.isAutoRefreshEnabled()).toBe(true);

    service.stopAutoRefresh();
    expect(service.isAutoRefreshEnabled()).toBe(false);
  });

  it('should check and refresh if needed', async () => {
    const mockCallback = jasmine.createSpy('refreshCallback').and.returnValue(Promise.resolve());
    tokenService.needsRefresh.and.returnValue(true);
    tokenService.getTimeUntilExpiration.and.returnValue(10000);

    service.startAutoRefresh(mockCallback);

    await service.checkAndRefresh();

    expect(mockCallback).toHaveBeenCalled();
  });

  it('should not refresh if not needed', async () => {
    const mockCallback = jasmine.createSpy('refreshCallback').and.returnValue(Promise.resolve());
    tokenService.needsRefresh.and.returnValue(false);

    service.startAutoRefresh(mockCallback);

    await service.checkAndRefresh();

    expect(mockCallback).not.toHaveBeenCalled();
  });
});
