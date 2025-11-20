import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CompanyService } from '../../services/company.service';
import { CompanyFormData } from '../../models/company.model';

@Component({
  selector: 'app-company-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-form.html',
  styleUrl: './company-form.css'
})
export class CompanyForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly companyIdSignal = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.companyIdSignal() !== null);
  protected readonly isSubmittingSignal = signal(false);
  protected readonly errorSignal = signal<string | null>(null);

  protected companyForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[\d\s\+\-()]+$/)]],
    address: ['', [Validators.required, Validators.minLength(5)]]
  });

  ngOnInit(): void {
    const companyId = this.route.snapshot.paramMap.get('id');
    if (companyId) {
      this.companyIdSignal.set(companyId);
      this.loadCompany(companyId);
    }
  }

  private loadCompany(id: string): void {
    const company = this.companyService.getCompanyById(id);
    if (company) {
      this.companyForm.patchValue({
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address
      });
    } else {
      this.errorSignal.set('Compañía no encontrada');
      this.router.navigate(['/companies']);
    }
  }

  protected onSubmit(): void {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    this.isSubmittingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const formData: CompanyFormData = this.companyForm.value;
      const companyId = this.companyIdSignal();

      if (companyId) {
        this.companyService.updateCompany(companyId, formData);
      } else {
        this.companyService.createCompany(formData);
      }

      this.router.navigate(['/companies']);
    } catch (error) {
      this.errorSignal.set('Error al guardar la compañía. Por favor, intente nuevamente.');
      this.isSubmittingSignal.set(false);
    }
  }

  protected cancel(): void {
    this.router.navigate(['/companies']);
  }

  protected getFieldError(fieldName: string): string | null {
    const field = this.companyForm.get(fieldName);
    if (!field || !field.touched || !field.errors) {
      return null;
    }

    if (field.errors['required']) {
      return 'Este campo es requerido';
    }
    if (field.errors['email']) {
      return 'Email inválido';
    }
    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }
    if (field.errors['pattern']) {
      return 'Formato inválido';
    }

    return null;
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.companyForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
