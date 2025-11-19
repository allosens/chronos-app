import { Component } from '@angular/core';
import { TimeCorrectionForm } from '../components/time-correction/time-correction-form';
import { TimeCorrectionList } from '../components/time-correction/time-correction-list';

@Component({
  selector: 'app-time-correction-page',
  imports: [TimeCorrectionForm, TimeCorrectionList],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Time Correction Requests</h1>
        <p class="text-gray-600">Request corrections to your time entries when you detect errors</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Form Section -->
        <div>
          <app-time-correction-form />
        </div>

        <!-- List Section -->
        <div>
          <app-time-correction-list />
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TimeCorrectionPage {}
