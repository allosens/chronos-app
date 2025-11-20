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
        data: { title: 'Time Tracking', subtitle: 'Log and manage your work hours' },
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking)
      },
      {
        path: 'history',
        data: { title: 'History', subtitle: 'View your time tracking history' },
        loadComponent: () => import('./features/time-tracking/pages/time-history').then(m => m.TimeHistory)
      },
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        data: { title: 'Dashboard', subtitle: 'Real-time team activity' },
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'employees',
        canActivate: [adminGuard],
        data: { title: 'Employees', subtitle: 'Manage your team members' },
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'approvals',
        canActivate: [adminGuard],
        data: { title: 'Approvals', subtitle: 'Review and approve requests' },
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'vacations',
        canActivate: [adminGuard],
        data: { title: 'Vacations', subtitle: 'Manage vacation requests' },
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'reports',
        canActivate: [adminGuard],
        data: { title: 'Reports', subtitle: 'View detailed analytics and reports' },
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'settings',
        canActivate: [adminGuard],
        data: { title: 'Settings', subtitle: 'Configure application settings' },
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/time-tracking'
  }
];
