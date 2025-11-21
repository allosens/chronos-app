import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CompanyService } from '../../services/company.service';
import { CompanyFormData } from '../../models/company.model';

@Component({
  selector: 'app-company-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100 max-w-2xl mx-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-900">{{ isEditMode() ? 'Edit Company' : 'New Company' }}</h2>
        <p class="text-sm text-gray-600 mt-1">{{ isEditMode() ? 'Update company information' : 'Complete new company information' }}</p>
      </div>

      @if (errorSignal()) {
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600" role="alert">
          {{ errorSignal() }}
        </div>
      }

      <form [formGroup]="companyForm" (ngSubmit)="onSubmit()" class="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
            Company Name <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            formControlName="name"
            [class]="isFieldInvalid('name') ? 'w-full px-4 py-2.5 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors' : 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'"
            placeholder="e.g., Tech Solutions Inc."
            aria-describedby="name-error"
          />
          @if (getFieldError('name')) {
            <span id="name-error" class="block mt-1 text-sm text-red-600" role="alert">
              {{ getFieldError('name') }}
            </span>
          }
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Email <span class="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            formControlName="email"
            [class]="isFieldInvalid('email') ? 'w-full px-4 py-2.5 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors' : 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'"
            placeholder="contact@company.com"
            aria-describedby="email-error"
          />
          @if (getFieldError('email')) {
            <span id="email-error" class="block mt-1 text-sm text-red-600" role="alert">
              {{ getFieldError('email') }}
            </span>
          }
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
            Phone <span class="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            formControlName="phone"
            [class]="isFieldInvalid('phone') ? 'w-full px-4 py-2.5 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors' : 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'"
            placeholder="+1-555-0100"
            aria-describedby="phone-error"
          />
          @if (getFieldError('phone')) {
            <span id="phone-error" class="block mt-1 text-sm text-red-600" role="alert">
              {{ getFieldError('phone') }}
            </span>
          }
        </div>

        <div>
          <label for="address" class="block text-sm font-medium text-gray-700 mb-2">
            Address <span class="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            formControlName="address"
            [class]="isFieldInvalid('address') ? 'w-full px-4 py-2.5 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-vertical min-h-[80px]' : 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical min-h-[80px]'"
            placeholder="123 Main Street, City, Country"
            rows="3"
            aria-describedby="address-error"
          ></textarea>
          @if (getFieldError('address')) {
            <span id="address-error" class="block mt-1 text-sm text-red-600" role="alert">
              {{ getFieldError('address') }}
            </span>
          }
        </div>

        <div class="flex gap-4 justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            class="px-5 py-2.5 bg-gray-100 text-gray-900 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            (click)="cancel()"
            [disabled]="isSubmittingSignal()"
            aria-label="Cancel and return">
            Cancel
          </button>
          <button
            type="submit"
            class="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            [disabled]="companyForm.invalid || isSubmittingSignal()"
            aria-label="{{ isEditMode() ? 'Update company' : 'Create company' }}">
            {{ isSubmittingSignal() ? 'Saving...' : (isEditMode() ? 'Update' : 'Create Company') }}
          </button>
        </div>
      </form>
    </div>
  `
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
      this.errorSignal.set('Company not found');
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
      this.errorSignal.set('Error saving company. Please try again.');
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
      return 'This field is required';
    }
    if (field.errors['email']) {
      return 'Invalid email';
    }
    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Must have at least ${minLength} characters`;
    }
    if (field.errors['pattern']) {
      return 'Invalid format';
    }

    return null;
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.companyForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
