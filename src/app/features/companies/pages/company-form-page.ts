import { Component } from '@angular/core';
import { CompanyForm } from '../components/company-form/company-form';

@Component({
  selector: 'app-company-form-page',
  imports: [CompanyForm],
  template: `
    <div class="container mx-auto px-4 py-6 max-w-7xl">
      <app-company-form />
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CompanyFormPage {}
