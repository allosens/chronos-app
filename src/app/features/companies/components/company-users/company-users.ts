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
  template: `
    <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100 max-w-7xl mx-auto">
      @if (companySignal(); as company) {
        <div class="flex justify-between items-start mb-8">
          <div>
            <button class="text-blue-600 hover:underline text-sm mb-2" (click)="goBack()" aria-label="Volver a lista de compañías">
              ← Volver
            </button>
            <h2 class="text-3xl font-bold text-gray-900">{{ company.name }}</h2>
            <p class="text-sm text-gray-600 mt-1">Usuarios asignados a esta compañía</p>
          </div>
          <button 
            class="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            (click)="toggleAddForm()"
            [attr.aria-label]="showAddFormSignal() ? 'Cancelar asignación' : 'Asignar nuevo usuario'">
            {{ showAddFormSignal() ? 'Cancelar' : '+ Asignar Usuario' }}
          </button>
        </div>

        @if (errorSignal()) {
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600" role="alert">
            {{ errorSignal() }}
          </div>
        }

        @if (showAddFormSignal()) {
          <div class="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Asignar Usuario a Compañía</h3>
            <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label for="userId" class="block text-sm font-medium text-gray-700 mb-2">
                    ID de Usuario <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="userId"
                    type="text"
                    formControlName="userId"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="user-123"
                    aria-describedby="userId-help"
                  />
                  <span id="userId-help" class="block mt-1 text-xs text-gray-600">
                    Ingrese el ID del usuario a asignar
                  </span>
                </div>

                <div>
                  <label for="role" class="block text-sm font-medium text-gray-700 mb-2">
                    Rol <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    formControlName="role"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    aria-label="Seleccionar rol del usuario">
                    <option [value]="CompanyUserRole.EMPLOYEE">{{ CompanyUserRole.EMPLOYEE }}</option>
                    <option [value]="CompanyUserRole.ADMIN">{{ CompanyUserRole.ADMIN }}</option>
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    class="w-full px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    [disabled]="userForm.invalid || isSubmittingSignal()"
                    aria-label="Asignar usuario">
                    {{ isSubmittingSignal() ? 'Asignando...' : 'Asignar' }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        }

        <div class="bg-white border border-gray-200 rounded-lg p-6">
          @if (companyUsersSignal().length === 0) {
            <div class="text-center py-12">
              <p class="text-gray-600 mb-4">No hay usuarios asignados a esta compañía.</p>
              <button class="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" (click)="toggleAddForm()">
                Asignar Primer Usuario
              </button>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Usuario</th>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Email</th>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Rol</th>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Asignado por</th>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Fecha de asignación</th>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of companyUsersSignal(); track trackByUserId($index, user)) {
                    <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td class="px-4 py-4 text-sm font-medium text-gray-900">{{ user.userName }}</td>
                      <td class="px-4 py-4 text-sm text-gray-600">{{ user.userEmail }}</td>
                      <td class="px-4 py-4 text-sm">
                        <select
                          [value]="user.role"
                          (change)="updateRole(user, $event)"
                          class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          [attr.aria-label]="'Cambiar rol de ' + user.userName">
                          <option [value]="CompanyUserRole.EMPLOYEE">{{ CompanyUserRole.EMPLOYEE }}</option>
                          <option [value]="CompanyUserRole.ADMIN">{{ CompanyUserRole.ADMIN }}</option>
                        </select>
                      </td>
                      <td class="px-4 py-4 text-sm text-gray-900">{{ user.assignedBy }}</td>
                      <td class="px-4 py-4 text-sm text-gray-900">{{ user.assignedAt | date:'short' }}</td>
                      <td class="px-4 py-4 text-sm">
                        <button
                          class="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          (click)="removeUser(user)"
                          [attr.aria-label]="'Remover a ' + user.userName">
                          Remover
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Billing Section -->
        <app-company-billing [companyId]="company.id" />
      } @else {
        <div class="text-center py-12 text-gray-600">
          <p>Cargando...</p>
        </div>
      }
    </div>
  `
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
