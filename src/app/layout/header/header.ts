import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../features/auth/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKey()'
  },
  template: `
    <header class="w-full h-full bg-white border-b border-gray-100 flex items-center">
      <div class="flex items-center justify-between w-full px-4 md:px-6 h-full gap-2 md:gap-4">
        <!-- Left Section: Menu Button + App Info -->
        <div class="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <!-- Mobile Menu Button -->
          <button
            (click)="handleToggleMobileMenu()"
            class="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Abrir menú de navegación"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- App Info - Hidden on small screens -->
          <div class="hidden sm:flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            <div>
              <h1 class="text-xl font-semibold text-gray-900 m-0 leading-tight">TimeTrack</h1>
              <span class="text-xs text-gray-500 font-normal hidden md:inline">{{ displayUserRole() }}</span>
            </div>
          </div>
        </div>
        
        <!-- Center Section: Page Info - Hidden on mobile -->
        <div class="hidden md:flex flex-1 text-center">
          <div class="w-full">
            <h2 class="text-xl lg:text-2xl font-semibold text-gray-900 m-0 leading-tight">{{ pageTitle }}</h2>
            <p class="text-sm text-gray-500 mt-1 mb-0 hidden lg:block">{{ pageSubtitle }}</p>
          </div>
        </div>
        
        <!-- Right Section: User Info + Role Badge + Logout -->
        <div class="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <!-- User Info - Hidden on small screens -->
          @if (currentUser()) {
            <div class="text-right mr-2 hidden md:block">
              <p class="text-sm font-medium text-gray-900 m-0">{{ currentUser()!.name }}</p>
              <p class="text-xs text-gray-500 m-0 hidden lg:block">{{ currentUser()!.email }}</p>
            </div>
          }
          
          <!-- Role Badge -->
          <span class="bg-gradient-to-r from-primary-500 to-purple-500 text-white px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs font-medium uppercase tracking-wider">
            {{ displayUserRole() }}
          </span>
          
          <!-- Logout Button -->
          @if (isAuthenticated()) {
            <button
              #logoutButton
              (click)="openLogoutDialog()"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              aria-label="Cerrar sesión"
            >
              <span class="hidden sm:inline">Cerrar sesión</span>
              <span class="sm:hidden">Salir</span>
            </button>
          }
          
          <!-- Logout Confirmation Dialog -->
          @if (showLogoutConfirm()) {
            <div 
              class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
              (click)="closeDialog()"
              (keydown.escape)="closeDialog()"
            >
              <div 
                #dialogContent
                class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full" 
                (click)="$event.stopPropagation()" 
                role="dialog" 
                aria-modal="true" 
                aria-labelledby="logout-dialog-title"
                tabindex="-1"
              >
                <h3 id="logout-dialog-title" class="text-lg font-semibold text-gray-900 mb-4">Confirmar cierre de sesión</h3>
                <p class="text-gray-600 mb-6">¿Estás seguro de que deseas cerrar sesión?</p>
                <div class="flex justify-end gap-3">
                  <button
                    #cancelButton
                    (click)="closeDialog()"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    aria-label="Cancelar"
                  >
                    Cancelar
                  </button>
                  <button
                    (click)="confirmLogout()"
                    class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    aria-label="Confirmar cierre de sesión"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class Header {
  @Input() pageTitle: string = 'Dashboard';
  @Input() pageSubtitle: string = 'Real-time team activity';
  @Input() userRole: string = 'Company Admin';
  
  toggleMobileMenu = output<void>();
  
  private readonly authService = inject(AuthService);
  
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly currentUser = this.authService.currentUser;
  protected readonly showLogoutConfirm = signal(false);
  
  // ViewChild references for focus management
  protected readonly logoutButton = viewChild<ElementRef>('logoutButton');
  protected readonly cancelButton = viewChild<ElementRef>('cancelButton');
  protected readonly dialogContent = viewChild<ElementRef>('dialogContent');
  
  protected readonly displayUserRole = computed(() => {
    return this.currentUser()?.role || this.userRole;
  });

  constructor() {
    // Focus management effect
    effect(() => {
      if (this.showLogoutConfirm()) {
        // Wait for the dialog to be rendered, then focus the first button
        setTimeout(() => {
          const cancelBtn = this.cancelButton();
          if (cancelBtn) {
            cancelBtn.nativeElement.focus();
          }
        }, 0);
      }
    });
  }

  protected handleToggleMobileMenu(): void {
    this.toggleMobileMenu.emit();
  }

  protected openLogoutDialog(): void {
    this.showLogoutConfirm.set(true);
  }

  protected closeDialog(): void {
    this.showLogoutConfirm.set(false);
    // Return focus to logout button
    setTimeout(() => {
      const logoutBtn = this.logoutButton();
      if (logoutBtn) {
        logoutBtn.nativeElement.focus();
      }
    }, 0);
  }

  protected onEscapeKey(): void {
    if (this.showLogoutConfirm()) {
      this.closeDialog();
    }
  }

  protected confirmLogout(): void {
    this.showLogoutConfirm.set(false);
    this.authService.logout();
  }
}