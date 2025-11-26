import { Routes } from '@angular/router';
import { authGuard, authChildGuard } from './features/auth/guards/auth.guard';
import { adminGuard, superAdminGuard } from './features/auth/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/layout/auth-layout').then(m => m.AuthLayout),
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout').then(m => m.MainLayout),
    canMatch: [authGuard],
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
        path: 'my-requests',
        data: { title: 'My Requests', subtitle: 'View your time tracking requests' },
        loadComponent: () => import('./features/requests/pages/vacation-requests').then(m => m.VacationRequests)
      },
      {
        path: 'time-corrections',
        data: { title: 'Time Corrections', subtitle: 'Manage your time correction requests' },
        loadComponent: () => import('./features/requests/pages/time-correction-page').then(m => m.TimeCorrectionPage)
      },
      {
        path: 'dashboard',
        canMatch: [adminGuard],
        data: { title: 'Dashboard', subtitle: 'Real-time team activity' },
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'employees',
        canMatch: [adminGuard],
        data: { title: 'Employees', subtitle: 'Manage your team members' },
        loadComponent: () => import('./features/employees/pages/employee-management').then(m => m.EmployeeManagement)
      },
      {
        path: 'approvals',
        canMatch: [adminGuard],
        data: { title: 'Approvals', subtitle: 'Review and approve requests' },
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'vacations',
        canMatch: [adminGuard],
        data: { title: 'Vacation Management', subtitle: 'Review and manage vacation requests' },
        loadComponent: () => import('./features/requests/pages/vacation-management/vacation-management-page').then(m => m.VacationManagementPage)
      },
      {
        path: 'reports',
        canMatch: [adminGuard],
        data: { title: 'Reports', subtitle: 'View detailed analytics and reports' },
        loadComponent: () => import('./features/time-tracking/pages/time-tracking').then(m => m.TimeTracking) // Temporary redirect
      },
      {
        path: 'settings',
        canMatch: [adminGuard],
        data: { title: 'Company Settings', subtitle: 'Configure company settings' },
        loadComponent: () => import('./features/company-settings/pages/company-settings-page/company-settings-page').then(m => m.CompanySettingsPage)
      },
      {
        path: 'companies',
        canMatch: [superAdminGuard],
        data: { title: 'Companies', subtitle: 'Manage companies in the system' },
        loadChildren: () => import('./features/companies/companies.routes').then(m => m.companiesRoutes)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/time-tracking'
  }
];
