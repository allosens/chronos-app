import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../features/auth/services/auth.service';

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
              <span class="text-xs text-gray-500 font-normal">{{ displayUserRole() }}</span>
            </div>
          </div>
        </div>
        
        <!-- Page Info -->
        <div class="flex-1 text-center">
          <h2 class="text-2xl font-semibold text-gray-900 m-0 leading-tight">{{ pageTitle }}</h2>
          <p class="text-sm text-gray-500 mt-1 mb-0">{{ pageSubtitle }}</p>
        </div>
        
        <!-- User Info with Logout -->
        <div class="flex items-center gap-3">
          @if (currentUser()) {
            <div class="text-right mr-2">
              <p class="text-sm font-medium text-gray-900 m-0">{{ currentUser()!.name }}</p>
              <p class="text-xs text-gray-500 m-0">{{ currentUser()!.email }}</p>
            </div>
          }
          <span class="bg-gradient-to-r from-primary-500 to-purple-500 text-white px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider">
            {{ displayUserRole() }}
          </span>
          @if (isAuthenticated()) {
            <button
              (click)="onLogout()"
              class="ml-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              aria-label="Cerrar sesión"
            >
              Cerrar sesión
            </button>
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
  
  private readonly authService = inject(AuthService);
  
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly currentUser = this.authService.currentUser;
  
  protected readonly displayUserRole = computed(() => {
    return this.currentUser()?.role || this.userRole;
  });

  protected onLogout(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.authService.logout();
    }
  }
}