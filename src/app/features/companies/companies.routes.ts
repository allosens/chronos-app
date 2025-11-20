import { Routes } from '@angular/router';

export const companiesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/company-list/company-list').then(m => m.CompanyList)
  },
  {
    path: 'new',
    loadComponent: () => import('./components/company-form/company-form').then(m => m.CompanyForm)
  },
  {
    path: ':id',
    data: { prerender: false },
    loadComponent: () => import('./components/company-users/company-users').then(m => m.CompanyUsers)
  },
  {
    path: ':id/edit',
    data: { prerender: false },
    loadComponent: () => import('./components/company-form/company-form').then(m => m.CompanyForm)
  }
];
