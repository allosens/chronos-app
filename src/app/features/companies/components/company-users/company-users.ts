import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CompanyService } from '../../services/company.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Company, CompanyUser, CompanyUserRole } from '../../models/company.model';
import { CompanyBilling } from '../company-billing/company-billing';

@Component({
  selector: 'app-company-users',
  imports: [CommonModule, ReactiveFormsModule, CompanyBilling],
  templateUrl: './company-users.html',
  styleUrl: './company-users.css'
})
export class CompanyUsers implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly companySignal = signal<Company | null>(null);
  protected readonly companyUsersSignal = signal<CompanyUser[]>([]);
  protected readonly showAddFormSignal = signal(false);
  protected readonly isSubmittingSignal = signal(false);
  protected readonly errorSignal = signal<string | null>(null);

  protected readonly CompanyUserRole = CompanyUserRole;

  protected userForm: FormGroup = this.fb.group({
    userId: ['', [Validators.required]],
    role: [CompanyUserRole.EMPLOYEE, [Validators.required]]
  });

  ngOnInit(): void {
    const companyId = this.route.snapshot.paramMap.get('id');
    if (companyId) {
      this.loadCompany(companyId);
      this.loadUsers(companyId);
    }
  }

  private loadCompany(id: string): void {
    const company = this.companyService.getCompanyById(id);
    if (company) {
      this.companySignal.set(company);
    } else {
      this.errorSignal.set('Compañía no encontrada');
      this.router.navigate(['/companies']);
    }
  }

  private loadUsers(companyId: string): void {
    const users = this.companyService.getUsersByCompany(companyId);
    this.companyUsersSignal.set(users);
  }

  protected toggleAddForm(): void {
    this.showAddFormSignal.update(show => !show);
    if (!this.showAddFormSignal()) {
      this.userForm.reset({ role: CompanyUserRole.EMPLOYEE });
      this.errorSignal.set(null);
    }
  }

  protected onSubmit(): void {
    if (this.userForm.invalid || !this.companySignal()) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmittingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const currentUser = this.authService.currentUser();
      const company = this.companySignal();
      
      if (!currentUser || !company) {
        throw new Error('Usuario o compañía no encontrados');
      }

      this.companyService.assignUserToCompany(
        {
          userId: this.userForm.value.userId,
          companyId: company.id,
          role: this.userForm.value.role
        },
        currentUser.name
      );

      this.loadUsers(company.id);
      this.toggleAddForm();
    } catch (error) {
      this.errorSignal.set('Error al asignar usuario. Por favor, intente nuevamente.');
    } finally {
      this.isSubmittingSignal.set(false);
    }
  }

  protected removeUser(companyUser: CompanyUser): void {
    if (confirm(`¿Está seguro de remover a ${companyUser.userName} de la compañía?`)) {
      this.companyService.removeUserFromCompany(companyUser.id);
      const company = this.companySignal();
      if (company) {
        this.loadUsers(company.id);
      }
    }
  }

  protected updateRole(companyUser: CompanyUser, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newRole = select.value as CompanyUserRole;
    this.companyService.updateUserRole(companyUser.id, newRole);
    const company = this.companySignal();
    if (company) {
      this.loadUsers(company.id);
    }
  }

  protected goBack(): void {
    this.router.navigate(['/companies']);
  }

  protected trackByUserId(index: number, user: CompanyUser): string {
    return user.id;
  }
}
