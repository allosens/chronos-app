import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login').then(m => m.Login)
  },
  {
    path: '',
    redirectTo: '/time-tracking',
    pathMatch: 'full'
  },
  {
    path: 'time-tracking',
    loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
  },
  {
    path: 'employees',
    loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
  },
  {
    path: 'approvals',
    loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
  },
  {
    path: 'vacations',
    loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
  },
  {
    path: '**',
    redirectTo: '/time-tracking'
  }
];
