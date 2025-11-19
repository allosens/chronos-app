import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BreakHistory } from './break-history';
import { BreakManagementService } from '../../services/break-management.service';
import { TimeTrackingService } from '../../services/time-tracking.service';
import { BreakEntry } from '../../models/time-tracking.model';

describe('BreakHistory', () => {
  let component: BreakHistory;
  let fixture: ComponentFixture<BreakHistory>;
  let breakService: BreakManagementService;
  let timeService: TimeTrackingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreakHistory],
      providers: [
        provideZonelessChangeDetection(),
        BreakManagementService,
        TimeTrackingService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BreakHistory);
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

  describe('empty state', () => {
    it('should show empty state when no breaks', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const emptyState = compiled.textContent;

      expect(emptyState).toContain('No breaks recorded today');
    });

    it('should display empty state icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent;

      expect(content).toContain('📋');
    });

    it('should show helpful message', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('.text-gray-400');

      expect(message?.textContent).toContain('Your break history will appear here');
    });
  });

  describe('with breaks', () => {
    beforeEach(() => {
      timeService.clockIn();
      timeService.startBreak();
      timeService.endBreak();
      fixture.detectChanges();
    });

    it('should display break count in header', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const header = compiled.querySelector('.text-sm.text-gray-500');

      expect(header?.textContent).toContain('1 break');
    });

    it('should show break cards', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const breakCards = compiled.querySelectorAll('.border.rounded-lg');

      expect(breakCards.length).toBeGreaterThan(0);
    });

    it('should display break start time', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent;

      expect(content).toContain('Start:');
    });

    it('should display break end time for completed breaks', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent;

      expect(content).toContain('End:');
    });

    it('should show total break time in summary', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const summary = compiled.querySelector('.border-t.border-gray-200');

      expect(summary?.textContent).toContain('Total break time:');
    });
  });

  describe('active break', () => {
    beforeEach(() => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();
    });

    it('should highlight active break', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const activeBreak = compiled.querySelector('.border-orange-300');

      expect(activeBreak).toBeTruthy();
    });

    it('should show "In progress" for active break', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent;

      expect(content).toContain('In progress');
    });

    it('should display active break label', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const content = compiled.textContent;

      expect(content).toContain('Active Break');
    });
  });

  describe('break icons', () => {
    it('should show yellow icon for active breaks', () => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();

      const icon = component['getBreakIcon'](breakService.currentBreak()!);
      expect(icon).toBe('🟡');
    });

    it('should show green icon for short breaks', () => {
      const shortBreak: BreakEntry = {
        id: '1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 5
      };

      const icon = component['getBreakIcon'](shortBreak);
      expect(icon).toBe('🟢');
    });

    it('should show orange icon for medium breaks', () => {
      const mediumBreak: BreakEntry = {
        id: '1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 12
      };

      const icon = component['getBreakIcon'](mediumBreak);
      expect(icon).toBe('🟠');
    });

    it('should show red icon for long breaks', () => {
      const longBreak: BreakEntry = {
        id: '1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 20
      };

      const icon = component['getBreakIcon'](longBreak);
      expect(icon).toBe('🔴');
    });
  });

  describe('break labels', () => {
    it('should label active breaks correctly', () => {
      timeService.clockIn();
      timeService.startBreak();

      const label = component['getBreakLabel'](breakService.currentBreak()!);
      expect(label).toBe('Active Break');
    });

    it('should label quick breaks correctly', () => {
      const quickBreak: BreakEntry = {
        id: '1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 5
      };

      const label = component['getBreakLabel'](quickBreak);
      expect(label).toBe('Quick Break');
    });

    it('should label standard breaks correctly', () => {
      const standardBreak: BreakEntry = {
        id: '1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 12
      };

      const label = component['getBreakLabel'](standardBreak);
      expect(label).toBe('Standard Break');
    });

    it('should label extended breaks correctly', () => {
      const extendedBreak: BreakEntry = {
        id: '1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 20
      };

      const label = component['getBreakLabel'](extendedBreak);
      expect(label).toBe('Extended Break');
    });
  });

  describe('average break duration', () => {
    it('should calculate average correctly', () => {
      timeService.clockIn();
      
      // Simulate two completed breaks
      timeService.startBreak();
      const entry = timeService.currentTimeEntry();
      if (entry) {
        const breaks = [...entry.breaks];
        breaks[0].endTime = new Date();
        breaks[0].duration = 10;
        
        timeService['currentTimeEntrySignal'].set({
          ...entry,
          breaks,
          status: 'working' as any
        });
      }

      timeService.startBreak();
      const entry2 = timeService.currentTimeEntry();
      if (entry2) {
        const breaks = [...entry2.breaks];
        breaks[1].endTime = new Date();
        breaks[1].duration = 20;
        
        timeService['currentTimeEntrySignal'].set({
          ...entry2,
          breaks,
          status: 'working' as any
        });
      }

      fixture.detectChanges();

      const average = component['averageBreakDuration']();
      expect(average).toBe(15); // (10 + 20) / 2
    });

    it('should return 0 when no completed breaks', () => {
      const average = component['averageBreakDuration']();
      expect(average).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('should have semantic heading', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const heading = compiled.querySelector('h3');

      expect(heading?.textContent).toContain('Today\'s Breaks');
    });

    it('should use aria-hidden for decorative icons', () => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const icons = compiled.querySelectorAll('span[aria-hidden="true"]');

      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('visual styling', () => {
    it('should use proper color for active breaks', () => {
      timeService.clockIn();
      timeService.startBreak();
      fixture.detectChanges();

      const cardClass = component['getBreakCardClass'](breakService.currentBreak()!);
      expect(cardClass).toContain('border-orange-300');
      expect(cardClass).toContain('bg-orange-50');
    });

    it('should use neutral color for completed breaks', () => {
      const completedBreak: BreakEntry = {
        id: '1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 5
      };

      const cardClass = component['getBreakCardClass'](completedBreak);
      expect(cardClass).toContain('border-gray-200');
      expect(cardClass).toContain('bg-white');
    });
  });

  describe('duration badges', () => {
    it('should color-code duration badges', () => {
      const shortBreak: BreakEntry = {
        id: '1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 5
      };

      const badgeClass = component['getDurationBadgeClass'](shortBreak);
      expect(badgeClass).toContain('bg-green-100');
      expect(badgeClass).toContain('text-green-700');
    });
  });

  describe('break order', () => {
    it('should show breaks in reverse chronological order', () => {
      timeService.clockIn();
      timeService.startBreak();
      timeService.endBreak();
      
      // Add a small delay to ensure different timestamps
      setTimeout(() => {
        timeService.startBreak();
        fixture.detectChanges();

        const breaks = component['allBreaks']();
        expect(breaks.length).toBe(2);
        // Most recent should be first
        expect(breaks[0].endTime).toBeUndefined();
      }, 10);
    });
  });
});
