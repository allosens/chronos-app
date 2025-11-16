import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, Header, Sidebar],
  template: `
    <div class="flex h-screen bg-gray-50 font-sans">
      <!-- Sidebar -->
      <app-sidebar class="w-60 flex-shrink-0 bg-white border-r border-gray-100 shadow-sm"></app-sidebar>
      
      <!-- Content wrapper -->
      <div class="flex flex-col flex-1 min-w-0">
        <!-- Header -->
        <app-header class="h-20 flex-shrink-0 bg-white border-b border-gray-100 shadow-sm"></app-header>
        
        <!-- Main content -->
        <main class="flex-1 p-6 overflow-y-auto bg-gray-50">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class MainLayout {
}