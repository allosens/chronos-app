import { Component, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService } from '../../services/billing.service';
import { Invoice, InvoiceStatus } from '../../models/billing.model';

@Component({
  selector: 'app-company-billing',
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-gray-200 rounded-lg p-6 mt-8">
      <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h3 class="text-xl font-semibold text-gray-900">Billing</h3>
        <div class="flex gap-8">
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-600 uppercase font-medium">Total Billed:</span>
            <span class="text-xl font-semibold text-gray-900">\${{ totalBilled() | number:'1.2-2' }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-600 uppercase font-medium">Outstanding:</span>
            <span class="text-xl font-semibold text-red-600">\${{ outstandingAmount() | number:'1.2-2' }}</span>
          </div>
        </div>
      </div>

      @if (invoices().length === 0) {
        <div class="text-center py-8 text-gray-600">
          <p>No invoices registered for this company.</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Number</th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Date</th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Due Date</th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Amount</th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Status</th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (invoice of invoices(); track trackByInvoiceId($index, invoice)) {
                <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-4 text-sm font-medium text-blue-600">{{ invoice.invoiceNumber }}</td>
                  <td class="px-4 py-4 text-sm text-gray-900">{{ invoice.invoiceDate | date:'mediumDate' }}</td>
                  <td class="px-4 py-4 text-sm text-gray-900">{{ invoice.dueDate | date:'mediumDate' }}</td>
                  <td class="px-4 py-4 text-sm font-semibold text-gray-900">{{ invoice.currency }} {{ invoice.amount | number:'1.2-2' }}</td>
                  <td class="px-4 py-4 text-sm">
                    <span [class]="getStatusBadgeClass(invoice.status)" class="px-3 py-1 rounded-full text-xs font-medium">
                      {{ invoice.status }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-sm">
                    @if (invoice.status === InvoiceStatus.PENDING || invoice.status === InvoiceStatus.OVERDUE) {
                      <button
                        class="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        (click)="markAsPaid(invoice)"
                        [attr.aria-label]="'Mark invoice ' + invoice.invoiceNumber + ' as paid'">
                        Mark as Paid
                      </button>
                    }
                    @if (invoice.status === InvoiceStatus.PAID) {
                      <span class="text-gray-600 text-sm">Paid on {{ invoice.paidAt | date:'mediumDate' }}</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class CompanyBilling {
  private readonly billingService = inject(BillingService);

  readonly companyId = input.required<string>();
  readonly InvoiceStatus = InvoiceStatus;

  protected readonly invoices = computed(() => 
    this.billingService.getInvoicesByCompany(this.companyId())
  );

  protected readonly totalBilled = computed(() => 
    this.billingService.getTotalBilledAmount(this.companyId())
  );

  protected readonly outstandingAmount = computed(() => 
    this.billingService.getOutstandingAmount(this.companyId())
  );

  protected getStatusBadgeClass(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'bg-green-100 text-green-800';
      case InvoiceStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case InvoiceStatus.OVERDUE:
        return 'bg-red-100 text-red-800';
      case InvoiceStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }

  protected markAsPaid(invoice: Invoice): void {
    if (confirm(`¿Mark invoice ${invoice.invoiceNumber} as paid?`)) {
      this.billingService.updateInvoiceStatus(invoice.id, InvoiceStatus.PAID);
    }
  }

  protected trackByInvoiceId(index: number, invoice: Invoice): string {
    return invoice.id;
  }
}
