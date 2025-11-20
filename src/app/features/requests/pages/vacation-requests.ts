import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacationRequestForm } from '../components/vacation-request/vacation-request-form';
import { VacationList } from '../components/vacation-request/vacation-list';
import { VacationCalendar } from '../components/vacation-request/vacation-calendar';

@Component({
  selector: 'app-vacation-requests',
  standalone: true,
  imports: [CommonModule, VacationRequestForm, VacationList, VacationCalendar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Time Off Requests</h1>
          <p class="text-gray-600">Manage your vacation days and time off requests</p>
        </div>

        <!-- Tab Navigation -->
        <div class="bg-white rounded-t-xl shadow-lg border border-gray-100 border-b-0">
          <div class="flex border-b border-gray-200">
            <button
              (click)="activeTab.set('new-request')"
              [class.border-b-2]="activeTab() === 'new-request'"
              [class.border-blue-600]="activeTab() === 'new-request'"
              [class.text-blue-600]="activeTab() === 'new-request'"
              [class.font-semibold]="activeTab() === 'new-request'"
              [class.text-gray-600]="activeTab() !== 'new-request'"
              class="px-6 py-4 text-sm font-medium transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="button"
              aria-label="New Request tab"
            >
              📝 New Request
            </button>
            <button
              (click)="activeTab.set('my-requests')"
              [class.border-b-2]="activeTab() === 'my-requests'"
              [class.border-blue-600]="activeTab() === 'my-requests'"
              [class.text-blue-600]="activeTab() === 'my-requests'"
              [class.font-semibold]="activeTab() === 'my-requests'"
              [class.text-gray-600]="activeTab() !== 'my-requests'"
              class="px-6 py-4 text-sm font-medium transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="button"
              aria-label="My Requests tab"
            >
              📋 My Requests
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="bg-white rounded-b-xl shadow-lg border border-gray-100 border-t-0 p-6">
          @if (activeTab() === 'new-request') {
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Request Form -->
              <div>
                <app-vacation-request-form />
              </div>

              <!-- Calendar -->
              <div>
                <app-vacation-calendar />
              </div>
            </div>
          }

          @if (activeTab() === 'my-requests') {
            <div>
              <app-vacation-list />
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class VacationRequests {
  protected activeTab = signal<'new-request' | 'my-requests'>('new-request');
}
