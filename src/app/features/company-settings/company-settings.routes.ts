import { Routes } from '@angular/router';

export const companySettingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/company-settings-page/company-settings-page').then(m => m.CompanySettingsPage)
  }
];
