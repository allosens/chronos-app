import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeList } from '../components/employee-list/employee-list';
import { EmployeeForm } from '../components/employee-form/employee-form';
import { Employee } from '../models/employee.model';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, EmployeeList, EmployeeForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-8 max-w-7xl">
      @if (!showForm()) {
        <app-employee-list
          (createEmployee)="onCreateEmployee()"
          (editEmployee)="onEditEmployee($event)"
        />
      } @else {
        <app-employee-form
          [employee]="selectedEmployee()"
          (cancel)="onCancelForm()"
          (saved)="onEmployeeSaved($event)"
        />
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class EmployeeManagement {
  protected showForm = signal(false);
  protected selectedEmployee = signal<Employee | null>(null);

  protected onCreateEmployee(): void {
    this.selectedEmployee.set(null);
    this.showForm.set(true);
  }

  protected onEditEmployee(employee: Employee): void {
    this.selectedEmployee.set(employee);
    this.showForm.set(true);
  }

  protected onCancelForm(): void {
    this.showForm.set(false);
    this.selectedEmployee.set(null);
  }

  protected onEmployeeSaved(employee: Employee): void {
    this.showForm.set(false);
    this.selectedEmployee.set(null);
  }
}
