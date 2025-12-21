import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TimeCorrectionList } from './time-correction-list';
import { TimeCorrectionService } from '../../services/time-correction.service';
import { TimeCorrectionApiService } from '../../services/time-correction-api.service';
import { TimeCorrectionStatus, TimeCorrectionRequest } from '../../models/time-correction.model';

describe('TimeCorrectionList', () => {
  let component: TimeCorrectionList;
  let fixture: ComponentFixture<TimeCorrectionList>;
  let service: jasmine.SpyObj<TimeCorrectionService>;

  const mockRequests: TimeCorrectionRequest[] = [
    {
      id: 'req-1',
      userId: 'user-1',
      companyId: 'company-1',
      workSessionId: 'session-1',
      requestedClockIn: '2024-01-15T09:00:00Z',
      reason: 'First request',
      status: TimeCorrectionStatus.PENDING,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'req-2',
      userId: 'user-1',
      companyId: 'company-1',
      workSessionId: 'session-2',
      requestedClockOut: '2024-01-15T17:00:00Z',
      reason: 'Second request',
      status: TimeCorrectionStatus.APPROVED,
      createdAt: '2024-01-15T11:00:00Z'
    },
    {
      id: 'req-3',
      userId: 'user-1',
      companyId: 'company-1',
      workSessionId: 'session-3',
      requestedClockIn: '2024-01-15T08:30:00Z',
      reason: 'Third request',
      status: TimeCorrectionStatus.DENIED,
      createdAt: '2024-01-15T12:00:00Z'
    }
  ];

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('TimeCorrectionService', [
      'loadRequests'
    ], {
      requests: signal(mockRequests),
      pendingRequests: signal(mockRequests.filter(r => r.status === TimeCorrectionStatus.PENDING)),
      approvedRequests: signal(mockRequests.filter(r => r.status === TimeCorrectionStatus.APPROVED)),
      rejectedRequests: signal(mockRequests.filter(r => r.status === TimeCorrectionStatus.DENIED)),
      isLoading: signal(false),
      error: signal(null)
    });

    await TestBed.configureTestingModule({
      imports: [TimeCorrectionList],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TimeCorrectionService, useValue: serviceSpy },
        TimeCorrectionApiService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TimeCorrectionList);
    component = fixture.componentInstance;
    service = TestBed.inject(TimeCorrectionService) as jasmine.SpyObj<TimeCorrectionService>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('filter buttons', () => {
    it('should default to "all" filter', () => {
      expect(component['currentFilter']()).toBe('all');
    });

    it('should change filter when button is clicked', () => {
      component['setFilter']('pending');
      expect(component['currentFilter']()).toBe('pending');

      component['setFilter']('approved');
      expect(component['currentFilter']()).toBe('approved');

      component['setFilter']('rejected');
      expect(component['currentFilter']()).toBe('rejected');

      component['setFilter']('all');
      expect(component['currentFilter']()).toBe('all');
    });
  });

  describe('filtered requests', () => {
    it('should show all requests by default', () => {
      const filtered = component['filteredRequests']();
      expect(filtered.length).toBe(3);
    });

    it('should filter pending requests', () => {
      component['setFilter']('pending');
      const filtered = component['filteredRequests']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe(TimeCorrectionStatus.PENDING);
    });

    it('should filter approved requests', () => {
      component['setFilter']('approved');
      const filtered = component['filteredRequests']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe(TimeCorrectionStatus.APPROVED);
    });

    it('should filter rejected requests', () => {
      component['setFilter']('rejected');
      const filtered = component['filteredRequests']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe(TimeCorrectionStatus.DENIED);
    });
  });

  describe('loading and error states', () => {
    it('should show loading state', () => {
      (service.isLoading as any).set(true);
      fixture.detectChanges();

      expect(component['isLoading']()).toBe(true);
    });

    it('should show error state', () => {
      (service.error as any).set('Test error');
      fixture.detectChanges();

      expect(component['error']()).toBe('Test error');
    });

    it('should retry loading on error', async () => {
      service.loadRequests.and.resolveTo();
      await component['retryLoad']();
      expect(service.loadRequests).toHaveBeenCalled();
    });
  });

  describe('formatting methods', () => {
    it('should format dates', () => {
      const formatted = component['formatDate']('2024-01-15');
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
    });

    it('should format times', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const formatted = component['formatTime'](date);
      expect(formatted).toBeTruthy();
    });

    it('should format relative times', () => {
      const date = new Date();
      const formatted = component['formatRelativeTime'](date);
      expect(formatted).toBeTruthy();
    });

    it('should handle null times', () => {
      const formatted = component['formatTime'](null);
      expect(formatted).toBe('N/A');
    });
  });
});
