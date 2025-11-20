import { Component } from '@angular/core';
import { CompanyList } from '../components/company-list/company-list';

@Component({
  selector: 'app-companies-page',
  imports: [CompanyList],
  template: `
    <div class="container mx-auto px-4 py-6 max-w-7xl">
      <app-company-list />
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CompaniesPage {}
