import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  template: `
    <header class="w-full h-full bg-white border-b border-gray-100 flex items-center">
      <div class="flex items-center justify-between w-full px-6 h-full">
        <!-- App Info -->
        <div class="flex items-center">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            <div>
              <h1 class="text-xl font-semibold text-gray-900 m-0 leading-tight">TimeTrack</h1>
              <span class="text-xs text-gray-500 font-normal">{{ userRole }}</span>
            </div>
          </div>
        </div>
        
        <!-- Page Info -->
        <div class="flex-1 text-center">
          <h2 class="text-2xl font-semibold text-gray-900 m-0 leading-tight">{{ pageTitle }}</h2>
          <p class="text-sm text-gray-500 mt-1 mb-0">{{ pageSubtitle }}</p>
        </div>
        
        <!-- User Info -->
        <div class="flex items-center">
          <span class="bg-gradient-to-r from-primary-500 to-purple-500 text-white px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider">
            {{ userRole }}
          </span>
        </div>
      </div>
    </header>
  `
})
export class Header {
  @Input() pageTitle: string = 'Dashboard';
  @Input() pageSubtitle: string = 'Real-time team activity';
  @Input() userRole: string = 'Company Admin';
}