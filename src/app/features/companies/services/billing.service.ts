import { Injectable, signal, computed } from '@angular/core';
import { Invoice, InvoiceStatus, InvoiceItem, BillingFormData } from '../models/billing.model';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  // Signals for invoices
  private invoicesSignal = signal<Invoice[]>([]);
  
  // Public readonly signals
  readonly invoices = this.invoicesSignal.asReadonly();

  // Computed signals
  readonly pendingInvoices = computed(() => 
    this.invoices().filter(invoice => invoice.status === InvoiceStatus.PENDING)
  );

  readonly paidInvoices = computed(() => 
    this.invoices().filter(invoice => invoice.status === InvoiceStatus.PAID)
  );

  readonly overdueInvoices = computed(() => 
    this.invoices().filter(invoice => invoice.status === InvoiceStatus.OVERDUE)
  );

  constructor() {
    this.loadInvoices();
  }

  /**
   * Gets invoices for a specific company
   */
  getInvoicesByCompany(companyId: string): Invoice[] {
    return this.invoices().filter(invoice => invoice.companyId === companyId);
  }

  /**
   * Gets invoice by ID
   */
  getInvoiceById(id: string): Invoice | undefined {
    return this.invoices().find(invoice => invoice.id === id);
  }

  /**
   * Creates a new invoice
   */
  createInvoice(companyId: string, formData: BillingFormData, items: InvoiceItem[]): Invoice {
    const newInvoice: Invoice = {
      id: this.generateId(),
      companyId,
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: new Date(formData.invoiceDate),
      dueDate: new Date(formData.dueDate),
      amount: formData.amount,
      currency: formData.currency,
      status: InvoiceStatus.PENDING,
      items,
      notes: formData.notes,
      createdAt: new Date()
    };

    const currentInvoices = this.invoicesSignal();
    this.invoicesSignal.set([...currentInvoices, newInvoice]);
    this.saveInvoicesToLocalStorage();

    return newInvoice;
  }

  /**
   * Updates invoice status
   */
  updateInvoiceStatus(id: string, status: InvoiceStatus): void {
    const currentInvoices = this.invoicesSignal();
    const updatedInvoices = currentInvoices.map(invoice => {
      if (invoice.id === id) {
        return { 
          ...invoice, 
          status,
          paidAt: status === InvoiceStatus.PAID ? new Date() : invoice.paidAt
        };
      }
      return invoice;
    });
    this.invoicesSignal.set(updatedInvoices);
    this.saveInvoicesToLocalStorage();
  }

  /**
   * Calculates total amount for a company
   */
  getTotalBilledAmount(companyId: string): number {
    return this.getInvoicesByCompany(companyId)
      .reduce((total, invoice) => total + invoice.amount, 0);
  }

  /**
   * Calculates outstanding amount for a company
   */
  getOutstandingAmount(companyId: string): number {
    return this.getInvoicesByCompany(companyId)
      .filter(invoice => invoice.status === InvoiceStatus.PENDING || invoice.status === InvoiceStatus.OVERDUE)
      .reduce((total, invoice) => total + invoice.amount, 0);
  }

  private generateId(): string {
    return `inv-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private loadInvoices(): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('chronos-invoices');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const invoices: Invoice[] = parsed.map((invoice: any) => ({
          ...invoice,
          invoiceDate: new Date(invoice.invoiceDate),
          dueDate: new Date(invoice.dueDate),
          createdAt: new Date(invoice.createdAt),
          paidAt: invoice.paidAt ? new Date(invoice.paidAt) : undefined
        }));
        this.invoicesSignal.set(invoices);
      } catch (error) {
        console.error('Error loading invoices:', error);
        this.initializeSampleInvoices();
      }
    } else {
      this.initializeSampleInvoices();
    }
  }

  private saveInvoicesToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    const invoices = this.invoices().map(invoice => ({
      ...invoice,
      invoiceDate: invoice.invoiceDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      paidAt: invoice.paidAt?.toISOString()
    }));
    localStorage.setItem('chronos-invoices', JSON.stringify(invoices));
  }

  private initializeSampleInvoices(): void {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    const sampleInvoices: Invoice[] = [
      {
        id: this.generateId(),
        companyId: 'sample-company-1',
        invoiceNumber: 'INV-2025-001',
        invoiceDate: lastMonth,
        dueDate: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000),
        amount: 1500.00,
        currency: 'USD',
        status: InvoiceStatus.PAID,
        items: [
          {
            id: '1',
            description: 'Monthly subscription - 10 users',
            quantity: 1,
            unitPrice: 1500.00,
            total: 1500.00
          }
        ],
        createdAt: lastMonth,
        paidAt: new Date(lastMonth.getTime() + 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.generateId(),
        companyId: 'sample-company-1',
        invoiceNumber: 'INV-2025-002',
        invoiceDate: today,
        dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        amount: 1500.00,
        currency: 'USD',
        status: InvoiceStatus.PENDING,
        items: [
          {
            id: '2',
            description: 'Monthly subscription - 10 users',
            quantity: 1,
            unitPrice: 1500.00,
            total: 1500.00
          }
        ],
        createdAt: today
      }
    ];
    this.invoicesSignal.set(sampleInvoices);
    this.saveInvoicesToLocalStorage();
  }
}
