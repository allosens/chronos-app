import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SessionService } from './session.service';
import { Router } from '@angular/router';

describe('SessionService', () => {
  let service: SessionService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: Router, useValue: routerSpy }],
    });
    service = TestBed.inject(SessionService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start monitoring session', () => {
    expect(service.isSessionActive()).toBe(false);

    service.startMonitoring();

    expect(service.isSessionActive()).toBe(true);
  });

  it('should stop monitoring session', () => {
    service.startMonitoring();
    expect(service.isSessionActive()).toBe(true);

    service.stopMonitoring();

    expect(service.isSessionActive()).toBe(false);
  });

  it('should record user activity', () => {
    service.startMonitoring();
    const initialTime = service['lastActivityTime']();

    // Wait a bit
    setTimeout(() => {
      service.recordActivity();
      const newTime = service['lastActivityTime']();

      expect(newTime).toBeGreaterThan(initialTime);
    }, 10);
  });

  it('should clear warning', () => {
    service['isWarningShown'].set(true);
    service['sessionWarning'].set('Test warning');

    service.clearWarning();

    expect(service.sessionWarning()).toBeNull();
    expect(service['isWarningShown']()).toBe(false);
  });

  it('should extend session', () => {
    service.startMonitoring();
    service['isWarningShown'].set(true);
    service['sessionWarning'].set('Test warning');

    service.extendSession();

    expect(service.sessionWarning()).toBeNull();
    expect(service['isWarningShown']()).toBe(false);
  });
});
