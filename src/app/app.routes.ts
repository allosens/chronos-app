import { Routes } from '@angular/router';
import { authGuard, authChildGuard } from './features/auth/guards/auth.guard';
import { adminGuard } from './features/auth/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/layout/auth-layout').then(m => m.AuthLayout),
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout').then(m => m.MainLayout),
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
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
        path: 'history',
        loadComponent: () => import('./features/time-tracking/pages/time-history').then(m => m.TimeHistory)
      },
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'employees',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'approvals',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'vacations',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'reports',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'settings',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/time-tracking'
  }
];
