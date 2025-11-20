import { Component, input, output,  inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PermissionService } from '../../features/auth/services/permission.service';
import { AuthService } from '../../features/auth/services/auth.service';

interface NavigationItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
  showForEmployee?: boolean; // If true, shown to all roles including Employee
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="h-full bg-white border-r border-gray-100 flex flex-col">
      <!-- Mobile Header with Close Button -->
      <div class="lg:hidden flex items-center justify-between p-4 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <h2 class="text-xl font-semibold text-gray-900">TimeTrack</h2>
        </div>
        <button
          (click)="handleCloseMobileMenu()"
          class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Cerrar menú"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 overflow-y-auto">
        <ul class="space-y-2">
          @for (item of visibleNavigationItems(); track item.route) {
            <li class="relative">
              <a 
                [routerLink]="item.route"
                [attr.aria-label]="item.label"
                class="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors group"
                routerLinkActive="bg-primary-50 text-primary-600 font-medium"
                [routerLinkActiveOptions]="{exact: false}"
              >
                <span class="text-lg" aria-hidden="true">{{ item.icon }}</span>
                <span class="flex-1 font-medium">{{ item.label }}</span>
                @if (item.badge) {
                  <span 
                    class="bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-1 rounded-full min-w-[20px] text-center"
                    [attr.aria-label]="item.badge + ' pending items'"
                  >
                    {{ item.badge }}
                  </span>
                }
              </a>
            </li>
          }
        </ul>
      </nav>
      
      <!-- User Profile -->
      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div class="w-10 h-10 bg-primary-500 text-white rounded-lg flex items-center justify-center font-semibold text-sm">
            {{ userInitials() }}
          </div>
          <div class="flex-1 min-w-0">
            <span class="block text-sm font-medium text-gray-900 truncate">{{ userName() }}</span>
            <span class="block text-xs text-gray-500 truncate">{{ userEmail() }}</span>
          </div>
        </div>
      </div>
    </aside>
  `,
})
export class Sidebar {
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  isMobileMenuOpen = input<boolean>(false);
  closeMobileMenu = output<void>();

  navigationItems: NavigationItem[] = [
    {
      icon: '📊',
      label: 'Dashboard',
      route: '/dashboard',
      showForEmployee: false
    },
    {
      icon: '⏰',
      label: 'Time Tracking',
      route: '/time-tracking',
      showForEmployee: true
    },
    {
      icon: '📅',
      label: 'History',
      route: '/history',
      showForEmployee: true
    },
    {
      icon: '✏️',
      label: 'Time Corrections',
      route: '/time-corrections',
      showForEmployee: true
    },
    {
      icon: '🌴',
      label: 'My Requests',
      route: '/my-requests',
      showForEmployee: true
    },
    {
      icon: '👥',
      label: 'Employees',
      route: '/employees',
      showForEmployee: false
    },
    {
      icon: '✓',
      label: 'Approvals',
      route: '/approvals',
      showForEmployee: false
    },
    {
      icon: '🌴',
      label: 'Vacations',
      route: '/vacations',
      showForEmployee: false
    },
    {
      icon: '📈',
      label: 'Reports',
      route: '/reports',
      showForEmployee: false
    },
    {
      icon: '⚙️',
      label: 'Settings',
      route: '/settings',
      showForEmployee: false
    }
  ];

  /**
   * Computed property that filters navigation items based on user role
   */
  visibleNavigationItems = computed(() => {
    const permissions = this.permissionService.permissions();
    if (!permissions) {
      return [];
    }

    return this.navigationItems.filter(item => {
      // If item is marked to show for all roles (including Employee), show it
      if (item.showForEmployee) {
        return true;
      }

      // Otherwise, check specific permissions based on the route
      switch (item.route) {
        case '/dashboard':
          return permissions.canAccessDashboard;
        case '/employees':
          return permissions.canManageEmployees;
        case '/approvals':
          return permissions.canApproveRequests;
        case '/vacations':
          return permissions.canManageVacations;
        case '/reports':
          return permissions.canViewReports;
        case '/settings':
          return permissions.canAccessSettings;
        default:
          // Unknown routes should not be visible by default for security
          return false;
      }
    });
  });

  /**
   * Get current user's initials
   */
  userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user || !user.name || !user.name.trim()) return 'U';
    
    const names = user.name.trim().split(' ').filter(n => n.length > 0);
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.trim().substring(0, 2).toUpperCase() || 'U';
  });

  /**
   * Get current user's name
   */
  userName = computed(() => {
    return this.authService.currentUser()?.name ?? 'User';
  });

  /**
   * Get current user's email
   */
  userEmail = computed(() => {
    return this.authService.currentUser()?.email ?? '';
  });

  protected handleCloseMobileMenu(): void {
    this.closeMobileMenu.emit();
  }

  protected handleNavigationClick(): void {
    // Close mobile menu when navigation item is clicked
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu.emit();
    }
  }
}