import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';
import { PageTitleService } from '../core/services/page-title.service';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, Header, Sidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-screen bg-gray-50 font-sans">
      <!-- Mobile Overlay -->
      @if (isMobileMenuOpen()) {
        <div 
          class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          (click)="closeMobileMenu()"
          aria-hidden="true"
        ></div>
      }
      
      <!-- Sidebar - Desktop: Always visible, Mobile: Drawer -->
      <app-sidebar 
        [class]="sidebarClasses()"
        [isMobileMenuOpen]="isMobileMenuOpen()"
        (closeMobileMenu)="closeMobileMenu()"
      ></app-sidebar>
      
      <!-- Content wrapper -->
      <div class="flex flex-col flex-1 min-w-0">
        <!-- Header -->
        <app-header 
          class="h-16 lg:h-20 flex-shrink-0 bg-white border-b border-gray-100 shadow-sm"
          (toggleMobileMenu)="toggleMobileMenu()"
        ></app-header>
        
        <!-- Main content -->
        <main class="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class MainLayout {
  // Inject PageTitleService to initialize it
  private readonly pageTitleService = inject(PageTitleService);
  
  protected readonly isMobileMenuOpen = signal(false);

  protected sidebarClasses(): string {
    const baseClasses = 'w-60 flex-shrink-0 bg-white border-r border-gray-100 shadow-sm';
    const mobileClasses = 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0';
    const visibilityClasses = this.isMobileMenuOpen() ? 'translate-x-0' : '-translate-x-full';
    
    return `${baseClasses} ${mobileClasses} ${visibilityClasses}`;
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}