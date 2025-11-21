import { Component } from '@angular/core';
import { CompanyUsers } from '../../components/company-users/company-users';

@Component({
  selector: 'app-company-detail-page',
  imports: [CompanyUsers],
  template: `
    <div class="container mx-auto px-4 py-6 max-w-7xl">
      <app-company-users />
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CompanyDetailPage {}
