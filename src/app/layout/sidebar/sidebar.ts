import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavigationItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="h-full bg-white border-r border-gray-100 flex flex-col">
      <!-- Navigation -->
      <nav class="flex-1 p-4">
        <ul class="space-y-2">
          <li 
            *ngFor="let item of navigationItems" 
            class="relative"
          >
            <a 
              [routerLink]="item.route" 
              class="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors group"
              routerLinkActive="bg-primary-50 text-primary-600 font-medium"
              [routerLinkActiveOptions]="{exact: false}"
            >
              <span class="text-lg">{{ item.icon }}</span>
              <span class="flex-1 font-medium">{{ item.label }}</span>
              <span 
                *ngIf="item.badge" 
                class="bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-1 rounded-full min-w-[20px] text-center"
              >
                {{ item.badge }}
              </span>
            </a>
          </li>
        </ul>
      </nav>
      
      <!-- User Profile -->
      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div class="w-10 h-10 bg-primary-500 text-white rounded-lg flex items-center justify-center font-semibold text-sm">
            AU
          </div>
          <div class="flex-1 min-w-0">
            <span class="block text-sm font-medium text-gray-900 truncate">Admin User</span>
            <span class="block text-xs text-gray-500 truncate">admin@company.com</span>
          </div>
        </div>
      </div>
    </aside>
  `,
})
export class Sidebar {
  navigationItems: NavigationItem[] = [
    {
      icon: '📊',
      label: 'Dashboard',
      route: '/dashboard'
    },
    {
      icon: '👥',
      label: 'Employees',
      route: '/employees'
    },
    {
      icon: '✓',
      label: 'Approvals',
      route: '/approvals',
      badge: 2
    },
    {
      icon: '🌴',
      label: 'Vacations',
      route: '/vacations'
    },
    {
      icon: '📈',
      label: 'Reports',
      route: '/reports'
    },
    {
      icon: '⚙️',
      label: 'Settings',
      route: '/settings'
    }
  ];
}