import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BreakControls } from './break-controls';
import { BreakManagementService } from '../../services/break-management.service';
import { TimeTrackingService } from '../../services/time-tracking.service';

describe('BreakControls', () => {
  let component: BreakControls;
  let fixture: ComponentFixture<BreakControls>;
  let breakService: BreakManagementService;
  let timeService: TimeTrackingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreakControls],
      providers: [
        provideZonelessChangeDetection(),
        BreakManagementService,
        TimeTrackingService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BreakControls);
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

  describe('UI rendering', () => {
    it('should not show break buttons when clocked out', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const startButton = compiled.querySelector('button[aria-label="Start a break"]');
      const endButton = compiled.querySelector('button[aria-label="End break and resume work"]');

      expect(startButton).toBeFalsy();
      expect(endButton).toBeFalsy();
    });

    it('should show start break button when working', () => {
      timeService.clockIn();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const startButton = compiled.querySelector('button[aria-label="Start a break"]');

      expect(startButton).toBeTruthy();
      expect(startButton?.textContent).toContain('Take a Break');
    });

    it('should show end break button when on break', () => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const endButton = compiled.querySelector('button[aria-label="End break and resume work"]');

      expect(endButton).toBeTruthy();
      expect(endButton?.textContent).toContain('Resume Work');
    });

    it('should show info message when clocked out', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const infoMessage = compiled.querySelector('.bg-gray-50');

      expect(infoMessage?.textContent).toContain('Clock in to start your work day');
    });
  });

  describe('button interactions', () => {
    it('should call startBreak when start button clicked', () => {
      timeService.clockIn();
      fixture.detectChanges();

      spyOn(breakService, 'startBreak');

      const compiled = fixture.nativeElement as HTMLElement;
      const startButton = compiled.querySelector('button[aria-label="Start a break"]') as HTMLButtonElement;
      startButton?.click();

      expect(breakService.startBreak).toHaveBeenCalled();
    });

    it('should call endBreak when end button clicked', () => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();

      spyOn(breakService, 'endBreak');

      const compiled = fixture.nativeElement as HTMLElement;
      const endButton = compiled.querySelector('button[aria-label="End break and resume work"]') as HTMLButtonElement;
      endButton?.click();

      expect(breakService.endBreak).toHaveBeenCalled();
    });
  });

  describe('break tips', () => {
    it('should show tips when start break is available', () => {
      timeService.clockIn();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tips = compiled.querySelector('.bg-blue-50');

      expect(tips?.textContent).toContain('Break Tips');
      expect(tips?.textContent).toContain('Regular breaks help maintain productivity');
    });

    it('should show different tips when on break', () => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tips = compiled.querySelector('.bg-blue-50');

      expect(tips?.textContent).toContain('Break time is tracked separately');
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-labels on buttons', () => {
      timeService.clockIn();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const startButton = compiled.querySelector('button[aria-label="Start a break"]');

      expect(startButton?.getAttribute('aria-label')).toBe('Start a break');
    });

    it('should have aria-hidden on decorative icons', () => {
      timeService.clockIn();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const icons = compiled.querySelectorAll('span[aria-hidden="true"]');

      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have proper button types', () => {
      timeService.clockIn();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');

      buttons.forEach(button => {
        expect(button.getAttribute('type')).toBe('button');
      });
    });

    it('should have keyboard accessible buttons', () => {
      timeService.clockIn();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const startButton = compiled.querySelector('button[aria-label="Start a break"]') as HTMLButtonElement;

      expect(startButton?.classList.contains('focus:ring-2')).toBe(true);
    });
  });

  describe('visual states', () => {
    it('should use orange color for start break button', () => {
      timeService.clockIn();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const startButton = compiled.querySelector('button[aria-label="Start a break"]');

      expect(startButton?.classList.contains('bg-orange-500')).toBe(true);
    });

    it('should use blue color for end break button', () => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const endButton = compiled.querySelector('button[aria-label="End break and resume work"]');

      expect(endButton?.classList.contains('bg-blue-600')).toBe(true);
    });
  });
});
