import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/layout/auth-layout').then(m => m.AuthLayout),
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout').then(m => m.MainLayout),
    children: [
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
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/time-tracking'
  }
];
