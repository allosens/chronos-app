import { Routes } from '@angular/router';

export const employeesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/employee-management').then(m => m.EmployeeManagement)
  }
];
