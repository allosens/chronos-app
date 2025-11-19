import { Component } from '@angular/core';
import { VacationRequestForm } from '../components/vacation-request/vacation-request-form';
import { VacationList } from '../components/vacation-request/vacation-list';
import { VacationCalendar } from '../components/vacation-request/vacation-calendar';

@Component({
  selector: 'app-vacation-requests',
  standalone: true,
  imports: [VacationRequestForm, VacationList, VacationCalendar],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Time Off Requests</h1>
          <p class="text-gray-600">Manage your vacation days and time off requests</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Request Form -->
          <div>
            <app-vacation-request-form />
          </div>

          <!-- Calendar -->
          <div>
            <app-vacation-calendar />
          </div>
        </div>

        <!-- Requests List -->
        <div>
          <app-vacation-list />
        </div>
      </div>
    </div>
  `
})
export class VacationRequests {}
