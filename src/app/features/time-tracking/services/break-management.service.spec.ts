import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BreakManagementService } from './break-management.service';
import { TimeTrackingService } from './time-tracking.service';

describe('BreakManagementService', () => {
  let service: BreakManagementService;
  let timeTrackingService: TimeTrackingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        BreakManagementService,
        TimeTrackingService
      ]
    });

    service = TestBed.inject(BreakManagementService);
    timeTrackingService = TestBed.inject(TimeTrackingService);
  });

  afterEach(() => {
    // Clean up localStorage
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('currentBreak', () => {
    it('should return null when not on break', () => {
      expect(service.currentBreak()).toBeNull();
    });

    it('should return current break when on break', () => {
      timeTrackingService.clockIn();
      timeTrackingService.startBreak();

      const currentBreak = service.currentBreak();
      expect(currentBreak).toBeTruthy();
      expect(currentBreak?.endTime).toBeUndefined();
    });
  });

  describe('todayBreaks', () => {
    it('should return empty array when no breaks', () => {
      expect(service.todayBreaks()).toEqual([]);
    });

    it('should return all breaks for today', () => {
      timeTrackingService.clockIn();
      timeTrackingService.startBreak();
      timeTrackingService.endBreak();
      timeTrackingService.startBreak();

      const breaks = service.todayBreaks();
      expect(breaks.length).toBe(2);
    });
  });

  describe('completedBreaks', () => {
    it('should return only completed breaks', () => {
      timeTrackingService.clockIn();
      timeTrackingService.startBreak();
      timeTrackingService.endBreak();
      timeTrackingService.startBreak();

      const completed = service.completedBreaks();
      expect(completed.length).toBe(1);
      expect(completed[0].endTime).toBeTruthy();
    });
  });

  describe('totalBreakTime', () => {
    it('should calculate total break time correctly', () => {
      timeTrackingService.clockIn();
      
      // First break
      timeTrackingService.startBreak();
      const entry = timeTrackingService.currentTimeEntry();
      if (entry) {
        const breaks = [...entry.breaks];
        breaks[0].endTime = new Date(breaks[0].startTime.getTime() + 5 * 60 * 1000); // 5 minutes
        breaks[0].duration = 5;
        timeTrackingService['currentTimeEntrySignal'].set({
          ...entry,
          breaks,
          status: 'working' as any
        });
      }

      const totalTime = service.totalBreakTime();
      expect(totalTime).toBe(5);
    });
  });

  describe('canStartBreak', () => {
    it('should return false when clocked out', () => {
      expect(service.canStartBreak()).toBe(false);
    });

    it('should return true when working', () => {
      timeTrackingService.clockIn();
      expect(service.canStartBreak()).toBe(true);
    });

    it('should return false when already on break', () => {
      timeTrackingService.clockIn();
      timeTrackingService.startBreak();
      expect(service.canStartBreak()).toBe(false);
    });
  });

  describe('canEndBreak', () => {
    it('should return false when not on break', () => {
      expect(service.canEndBreak()).toBe(false);
    });

    it('should return true when on break', () => {
      timeTrackingService.clockIn();
      timeTrackingService.startBreak();
      expect(service.canEndBreak()).toBe(true);
    });
  });

  describe('startBreak', () => {
    it('should start break when working', async () => {
      timeTrackingService.clockIn();
      
      // Skip confirmation for testing
      const result = await service.startBreak(true);
      
      expect(result).toBe(true);
      expect(timeTrackingService.isOnBreak()).toBe(true);
    });

    it('should not start break when not working', async () => {
      const result = await service.startBreak(true);
      
      expect(result).toBe(false);
      expect(timeTrackingService.isOnBreak()).toBe(false);
    });

    it('should add notification when break starts', async () => {
      timeTrackingService.clockIn();
      await service.startBreak(true);
      
      const notifications = service.notifications();
      expect(notifications.length).toBeGreaterThan(0);
    });
  });

  describe('endBreak', () => {
    it('should end break when on break', async () => {
      timeTrackingService.clockIn();
      timeTrackingService.startBreak();
      
      // Skip confirmation for testing
      const result = await service.endBreak(true);
      
      expect(result).toBe(true);
      expect(timeTrackingService.isWorking()).toBe(true);
    });

    it('should not end break when not on break', async () => {
      timeTrackingService.clockIn();
      
      const result = await service.endBreak(true);
      
      expect(result).toBe(false);
    });

    it('should add notification when break ends', async () => {
      timeTrackingService.clockIn();
      timeTrackingService.startBreak();
      await service.endBreak(true);
      
      const notifications = service.notifications();
      expect(notifications.length).toBeGreaterThan(0);
    });
  });

  describe('notifications', () => {
    it('should start with empty notifications', () => {
      expect(service.notifications()).toEqual([]);
    });

    it('should clear all notifications', () => {
      timeTrackingService.clockIn();
      service.startBreak(true);
      
      expect(service.notifications().length).toBeGreaterThan(0);
      
      service.clearNotifications();
      expect(service.notifications()).toEqual([]);
    });
  });

  describe('hasLongBreak', () => {
    it('should return false when not on break', () => {
      expect(service.hasLongBreak()).toBe(false);
    });

    it('should return false for short breaks', () => {
      timeTrackingService.clockIn();
      timeTrackingService.startBreak();
      
      expect(service.hasLongBreak()).toBe(false);
    });
  });

  describe('formattedBreakDuration', () => {
    it('should format break duration correctly', () => {
      expect(service.formattedBreakDuration()).toBeTruthy();
    });
  });

  describe('formattedTotalBreakTime', () => {
    it('should format total break time correctly', () => {
      const formatted = service.formattedTotalBreakTime();
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });
});
