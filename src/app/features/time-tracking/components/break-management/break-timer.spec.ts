import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BreakTimer } from './break-timer';
import { BreakManagementService } from '../../services/break-management.service';
import { TimeTrackingService } from '../../services/time-tracking.service';

describe('BreakTimer', () => {
  let component: BreakTimer;
  let fixture: ComponentFixture<BreakTimer>;
  let breakService: BreakManagementService;
  let timeService: TimeTrackingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreakTimer],
      providers: [
        provideZonelessChangeDetection(),
        BreakManagementService,
        TimeTrackingService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BreakTimer);
    component = fixture.componentInstance;
    breakService = TestBed.inject(BreakManagementService);
    timeService = TestBed.inject(TimeTrackingService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('when not on break', () => {
    it('should show no active break message', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('.text-gray-500');

      expect(message?.textContent).toContain('No active break');
    });

    it('should display relaxed emoji', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const emoji = compiled.textContent;

      expect(emoji).toContain('😌');
    });

    it('should show completed breaks count when available', () => {
      timeService.clockIn();
      timeService.startBreak();
      timeService.endBreak();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const breakCount = compiled.textContent;

      expect(breakCount).toContain('1 break taken today');
    });
  });

  describe('when on break', () => {
    beforeEach(() => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();
    });

    it('should show break timer', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const timer = compiled.querySelector('.text-5xl');

      expect(timer).toBeTruthy();
      expect(timer?.textContent).toMatch(/\d{2}:\d{2}/);
    });

    it('should show break start time', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const startTime = compiled.querySelector('.bg-orange-50');

      expect(startTime?.textContent).toContain('Started at');
    });

    it('should show quick stats', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const stats = compiled.querySelectorAll('.bg-gray-50');

      expect(stats.length).toBeGreaterThanOrEqual(2);
    });

    it('should display breaks today count', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent;

      expect(content).toContain('Breaks Today');
    });

    it('should display total break time', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent;

      expect(content).toContain('Total Break Time');
    });
  });

  describe('timer color coding', () => {
    it('should use orange color for normal breaks', () => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const timer = compiled.querySelector('.text-5xl');

      expect(timer?.classList.contains('text-orange-600')).toBe(true);
    });
  });

  describe('long break warning', () => {
    it('should not show warning for short breaks', () => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const warning = compiled.querySelector('.bg-yellow-50');

      expect(warning).toBeFalsy();
    });
  });

  describe('timer formatting', () => {
    it('should format duration correctly', () => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();

      const formatted = component['formattedDuration']();
      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('accessibility', () => {
    it('should have aria-hidden on decorative elements', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const decorative = compiled.querySelectorAll('[aria-hidden="true"]');

      expect(decorative.length).toBeGreaterThan(0);
    });

    it('should have semantic headings', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const heading = compiled.querySelector('h3');

      expect(heading?.textContent).toContain('Break Timer');
    });
  });

  describe('clocked out state', () => {
    it('should show clock in message when clocked out', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.textContent;

      expect(message).toContain('Clock in to start tracking breaks');
    });
  });

  describe('break statistics', () => {
    it('should show correct break count', () => {
      timeService.clockIn();
      timeService.startBreak();
      timeService.endBreak();
      timeService.startBreak();
      fixture.detectChanges();

      const count = breakService.todayBreaks().length;
      expect(count).toBe(2);
    });

    it('should calculate completed breaks correctly', () => {
      timeService.clockIn();
      timeService.startBreak();
      timeService.endBreak();
      timeService.startBreak();
      fixture.detectChanges();

      const completed = breakService.completedBreaks().length;
      expect(completed).toBe(1);
    });
  });

  describe('responsive layout', () => {
    it('should have responsive grid for stats', () => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const grid = compiled.querySelector('.grid-cols-2');

      expect(grid).toBeTruthy();
    });
  });

  describe('visual feedback', () => {
    it('should have rounded corners', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('.rounded-xl');

      expect(container).toBeTruthy();
    });

    it('should have shadow for depth', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('.shadow-lg');

      expect(container).toBeTruthy();
    });
  });
});
