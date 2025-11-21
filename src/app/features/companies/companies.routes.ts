import { Routes } from '@angular/router';

export const companiesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/companies-page/companies-page').then(m => m.CompaniesPage)
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/company-form-page/company-form-page').then(m => m.CompanyFormPage)
  },
  {
    path: ':id',
    data: { prerender: false },
    loadComponent: () => import('./pages/company-detail-page/company-detail-page').then(m => m.CompanyDetailPage)
  },
  {
    path: ':id/edit',
    data: { prerender: false },
    loadComponent: () => import('./pages/company-form-page/company-form-page').then(m => m.CompanyFormPage)
  }
];
