import { Component, input, output, signal, effect, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-time-picker',
  imports: [CommonModule],
  template: `
    <div class="relative">
      <!-- Time Input Display -->
      <div class="relative">
        <input
          type="text"
          [value]="displayValue()"
          (click)="togglePicker()"
          readonly
          [placeholder]="placeholder()"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 cursor-pointer text-center font-medium text-gray-900"
          [class.border-red-500]="hasError()"
          [attr.aria-label]="ariaLabel()"
        />
        <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
          🕐
        </span>
      </div>

      <!-- Time Picker Modal -->
      @if (isOpen()) {
        <div class="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 min-w-[280px]" 
             [class.left-0]="!alignRight()"
             [class.right-0]="alignRight()">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 text-center">
            {{ pickerTitle() || 'Seleccionar hora' }}
          </h3>
          
          <div class="flex items-center justify-center gap-3 mb-4">
            <!-- Hour Column -->
            <div class="flex flex-col items-center">
              <div class="text-xs text-gray-500 font-medium mb-2">HORA</div>
              <div class="relative h-[180px] w-[70px] overflow-hidden">
                <!-- Selection Highlight (behind numbers) -->
                <div class="absolute top-1/2 left-0 right-0 h-[40px] -mt-[20px] bg-gray-100 rounded-lg z-0"></div>
                <!-- Numbers (in front of highlight) -->
                <div 
                  class="absolute inset-0 flex flex-col items-center py-[70px] transition-transform duration-200 ease-out z-10"
                  [style.transform]="'translateY(' + hourScrollOffset() + 'px)'"
                  (wheel)="onHourWheel($event)"
                  (touchstart)="onTouchStart($event, 'hour')"
                  (touchmove)="onTouchMove($event, 'hour')"
                  (touchend)="onTouchEnd('hour')"
                >
                  @for (h of allHours; track h) {
                    <div 
                      class="h-[40px] flex items-center justify-center cursor-pointer transition-all duration-150 relative z-10"
                      [class.text-2xl]="h === selectedHour()"
                      [class.font-bold]="h === selectedHour()"
                      [class.text-gray-900]="h === selectedHour()"
                      [class.text-gray-400]="h !== selectedHour()"
                      [class.text-sm]="h !== selectedHour()"
                      (click)="selectHour(h)"
                    >
                      {{ h.toString().padStart(2, '0') }}
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Separator -->
            <div class="text-3xl font-bold text-gray-900 mb-6">:</div>

            <!-- Minute Column -->
            <div class="flex flex-col items-center">
              <div class="text-xs text-gray-500 font-medium mb-2">MIN</div>
              <div class="relative h-[180px] w-[70px] overflow-hidden">
                <!-- Selection Highlight (behind numbers) -->
                <div class="absolute top-1/2 left-0 right-0 h-[40px] -mt-[20px] bg-gray-100 rounded-lg z-0"></div>
                <!-- Numbers (in front of highlight) -->
                <div 
                  class="absolute inset-0 flex flex-col items-center py-[70px] transition-transform duration-200 ease-out z-10"
                  [style.transform]="'translateY(' + minuteScrollOffset() + 'px)'"
                  (wheel)="onMinuteWheel($event)"
                  (touchstart)="onTouchStart($event, 'minute')"
                  (touchmove)="onTouchMove($event, 'minute')"
                  (touchend)="onTouchEnd('minute')"
                >
                  @for (m of allMinutes; track m) {
                    <div 
                      class="h-[40px] flex items-center justify-center cursor-pointer transition-all duration-150 relative z-10"
                      [class.text-2xl]="m === selectedMinute()"
                      [class.font-bold]="m === selectedMinute()"
                      [class.text-gray-900]="m === selectedMinute()"
                      [class.text-gray-400]="m !== selectedMinute()"
                      [class.text-sm]="m !== selectedMinute()"
                      (click)="selectMinute(m)"
                    >
                      {{ m.toString().padStart(2, '0') }}
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Time Display -->
          <div class="bg-gray-100 rounded-lg py-2.5 px-4 text-center mb-3">
            <div class="text-2xl font-bold text-gray-900">
              {{ selectedHour().toString().padStart(2, '0') }}:{{ selectedMinute().toString().padStart(2, '0') }}
            </div>
          </div>

          <!-- Close Button -->
          <button
            type="button"
            (click)="closePicker()"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Aceptar
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TimePicker {
  // Inputs
  hour = input<string>('');
  minute = input<string>('');
  placeholder = input<string>('--:--');
  ariaLabel = input<string>('Select time');
  pickerTitle = input<string>('Seleccionar hora');
  hasError = input<boolean>(false);
  alignRight = input<boolean>(false);

  // Outputs
  hourChange = output<string>();
  minuteChange = output<string>();

  // State
  isOpen = signal(false);
  selectedHour = signal(0);
  selectedMinute = signal(0);
  hourScrollOffset = signal(0);
  minuteScrollOffset = signal(0);

  // Touch state
  private touchStartY = 0;
  private touchStartOffset = 0;

  // Data
  allHours = Array.from({ length: 24 }, (_, i) => i);
  allMinutes = Array.from({ length: 60 }, (_, i) => i);

  private destroyRef = inject(DestroyRef);
  displayValue = signal('--:--');

  constructor() {
    // Sync external inputs with internal state
    effect(() => {
      const h = parseInt(this.hour() || '0');
      const m = parseInt(this.minute() || '0');
      if (!isNaN(h) && h >= 0 && h < 24) {
        this.selectedHour.set(h);
        this.updateHourScroll(h);
      }
      if (!isNaN(m) && m >= 0 && m < 60) {
        this.selectedMinute.set(m);
        this.updateMinuteScroll(m);
      }
    });

    // Update display value
    effect(() => {
      const h = this.selectedHour();
      const m = this.selectedMinute();
      this.displayValue.set(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      );
    });

    // Listen for clicks outside to close picker
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => {
          fromEvent<MouseEvent>(document, 'click')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
              const target = event.target as HTMLElement;
              if (!target.closest('app-time-picker')) {
                this.isOpen.set(false);
              }
            });
        }, 0);
      }
    });
  }

  togglePicker(): void {
    this.isOpen.update(open => !open);
  }

  closePicker(): void {
    this.isOpen.set(false);
  }

  selectHour(hour: number): void {
    this.selectedHour.set(hour);
    this.updateHourScroll(hour);
    this.hourChange.emit(hour.toString().padStart(2, '0'));
  }

  selectMinute(minute: number): void {
    this.selectedMinute.set(minute);
    this.updateMinuteScroll(minute);
    this.minuteChange.emit(minute.toString().padStart(2, '0'));
  }

  onHourWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 1 : -1;
    const newHour = Math.max(0, Math.min(23, this.selectedHour() + delta));
    this.selectHour(newHour);
  }

  onMinuteWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 1 : -1;
    const newMinute = Math.max(0, Math.min(59, this.selectedMinute() + delta));
    this.selectMinute(newMinute);
  }

  onTouchStart(event: TouchEvent, type: 'hour' | 'minute'): void {
    this.touchStartY = event.touches[0].clientY;
    this.touchStartOffset = type === 'hour' ? this.hourScrollOffset() : this.minuteScrollOffset();
  }

  onTouchMove(event: TouchEvent, type: 'hour' | 'minute'): void {
    event.preventDefault();
    const deltaY = event.touches[0].clientY - this.touchStartY;
    const newOffset = this.touchStartOffset + deltaY;
    
    if (type === 'hour') {
      this.hourScrollOffset.set(newOffset);
    } else {
      this.minuteScrollOffset.set(newOffset);
    }
  }

  onTouchEnd(type: 'hour' | 'minute'): void {
    // Snap to nearest value
    const itemHeight = 40;
    const offset = type === 'hour' ? this.hourScrollOffset() : this.minuteScrollOffset();
    const index = Math.round(-offset / itemHeight);
    
    if (type === 'hour') {
      const newHour = Math.max(0, Math.min(23, index));
      this.selectHour(newHour);
    } else {
      const newMinute = Math.max(0, Math.min(59, index));
      this.selectMinute(newMinute);
    }
  }

  private updateHourScroll(hour: number): void {
    this.hourScrollOffset.set(-hour * 40);
  }

  private updateMinuteScroll(minute: number): void {
    this.minuteScrollOffset.set(-minute * 40);
  }
}
