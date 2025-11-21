import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CompanyService } from '../../services/company.service';
import { Company, SubscriptionPlan } from '../../models/company.model';

@Component({
  selector: 'app-company-list',
  imports: [CommonModule],
  templateUrl: './company-list.html'
})
export class CompanyList {
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);

  protected readonly companies = this.companyService.companies;
  protected readonly activeCompanies = this.companyService.activeCompanies;
  protected readonly inactiveCompanies = this.companyService.inactiveCompanies;

  protected readonly filterSignal = signal<'all' | 'active' | 'inactive'>('all');

  protected readonly filteredCompanies = computed(() => {
    const filter = this.filterSignal();
    switch (filter) {
      case 'active':
        return this.activeCompanies();
      case 'inactive':
        return this.inactiveCompanies();
      default:
        return this.companies();
    }
  });

  protected setFilter(filter: 'all' | 'active' | 'inactive'): void {
    this.filterSignal.set(filter);
  }

  protected createCompany(): void {
    this.router.navigate(['/companies/new']);
  }

  protected editCompany(company: Company): void {
    this.router.navigate(['/companies', company.id, 'edit']);
  }

  protected viewCompany(company: Company): void {
    this.router.navigate(['/companies', company.id]);
  }

  protected toggleStatus(company: Company): void {
    const action = company.isActive ? 'desactivar' : 'activar';
    if (confirm(`¿Está seguro de ${action} la compañía "${company.name}"?`)) {
      this.companyService.toggleCompanyStatus(company.id);
    }
  }

  protected getPlanBadgeClass(plan: SubscriptionPlan): string {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return 'bg-gray-100 text-gray-800';
      case SubscriptionPlan.STARTER:
        return 'bg-blue-100 text-blue-800';
      case SubscriptionPlan.PROFESSIONAL:
        return 'bg-purple-100 text-purple-800';
      case SubscriptionPlan.ENTERPRISE:
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  protected trackByCompanyId(index: number, company: Company): string {
    return company.id;
  }
}
