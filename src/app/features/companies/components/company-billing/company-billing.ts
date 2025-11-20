import { Component, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService } from '../../services/billing.service';
import { Invoice, InvoiceStatus } from '../../models/billing.model';

@Component({
  selector: 'app-company-billing',
  imports: [CommonModule],
  templateUrl: './company-billing.html',
  styleUrl: './company-billing.css'
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

  protected getStatusClass(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'status-paid';
      case InvoiceStatus.PENDING:
        return 'status-pending';
      case InvoiceStatus.OVERDUE:
        return 'status-overdue';
      case InvoiceStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return 'status-draft';
    }
  }

  protected markAsPaid(invoice: Invoice): void {
    if (confirm(`¿Marcar factura ${invoice.invoiceNumber} como pagada?`)) {
      this.billingService.updateInvoiceStatus(invoice.id, InvoiceStatus.PAID);
    }
  }

  protected trackByInvoiceId(index: number, invoice: Invoice): string {
    return invoice.id;
  }
}
