import { Injectable, signal, computed } from '@angular/core';
import { 
  Company, 
  CompanyFormData, 
  CompanyUser, 
  CompanyUserRole, 
  AssignUserRequest,
  SubscriptionPlan
} from '../models/company.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  // Signals for companies and company users
  private companiesSignal = signal<Company[]>([]);
  private companyUsersSignal = signal<CompanyUser[]>([]);
  
  // Public readonly signals
  readonly companies = this.companiesSignal.asReadonly();
  readonly companyUsers = this.companyUsersSignal.asReadonly();

  // Computed signals
  readonly activeCompanies = computed(() => 
    this.companies().filter(company => company.isActive)
  );

  readonly inactiveCompanies = computed(() => 
    this.companies().filter(company => !company.isActive)
  );

  constructor() {
    // Load initial data
    this.loadCompanies();
    this.loadCompanyUsers();
  }

  /**
   * Creates a new company
   */
  createCompany(formData: CompanyFormData): Company {
    const newCompany: Company = {
      id: this.generateId(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      isActive: true,
      subscriptionPlan: SubscriptionPlan.FREE, // Default to free plan
      createdAt: new Date()
    };

    const currentCompanies = this.companiesSignal();
    this.companiesSignal.set([...currentCompanies, newCompany]);
    this.saveCompaniesToLocalStorage();

    return newCompany;
  }

  /**
   * Updates an existing company
   */
  updateCompany(id: string, formData: CompanyFormData): Company | null {
    const currentCompanies = this.companiesSignal();
    const index = currentCompanies.findIndex(c => c.id === id);

    if (index === -1) {
      return null;
    }

    const updatedCompany: Company = {
      ...currentCompanies[index],
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      updatedAt: new Date()
    };

    const updatedCompanies = [...currentCompanies];
    updatedCompanies[index] = updatedCompany;
    this.companiesSignal.set(updatedCompanies);
    this.saveCompaniesToLocalStorage();

    return updatedCompany;
  }

  /**
   * Toggles company active status
   */
  toggleCompanyStatus(id: string): void {
    const currentCompanies = this.companiesSignal();
    const updatedCompanies = currentCompanies.map(company => {
      if (company.id === id) {
        return { 
          ...company, 
          isActive: !company.isActive,
          updatedAt: new Date()
        };
      }
      return company;
    });
    this.companiesSignal.set(updatedCompanies);
    this.saveCompaniesToLocalStorage();
  }

  /**
   * Updates company subscription plan
   */
  updateSubscriptionPlan(id: string, plan: SubscriptionPlan): void {
    const currentCompanies = this.companiesSignal();
    const updatedCompanies = currentCompanies.map(company => {
      if (company.id === id) {
        return { 
          ...company, 
          subscriptionPlan: plan,
          updatedAt: new Date()
        };
      }
      return company;
    });
    this.companiesSignal.set(updatedCompanies);
    this.saveCompaniesToLocalStorage();
  }

  /**
   * Gets company by ID
   */
  getCompanyById(id: string): Company | undefined {
    return this.companies().find(company => company.id === id);
  }

  /**
   * Assigns a user to a company with a specific role
   */
  assignUserToCompany(request: AssignUserRequest, assignedBy: string): CompanyUser {
    // In a real app, this would validate if user exists
    const newAssignment: CompanyUser = {
      id: this.generateId(),
      userId: request.userId,
      companyId: request.companyId,
      userName: `User ${request.userId}`, // Mock name - would come from user service
      userEmail: `user${request.userId}@example.com`, // Mock email
      role: request.role,
      assignedAt: new Date(),
      assignedBy
    };

    const currentUsers = this.companyUsersSignal();
    this.companyUsersSignal.set([...currentUsers, newAssignment]);
    this.saveCompanyUsersToLocalStorage();

    return newAssignment;
  }

  /**
   * Removes a user from a company
   */
  removeUserFromCompany(companyUserId: string): void {
    const currentUsers = this.companyUsersSignal();
    const updatedUsers = currentUsers.filter(u => u.id !== companyUserId);
    this.companyUsersSignal.set(updatedUsers);
    this.saveCompanyUsersToLocalStorage();
  }

  /**
   * Gets users for a specific company
   */
  getUsersByCompany(companyId: string): CompanyUser[] {
    return this.companyUsers().filter(u => u.companyId === companyId);
  }

  /**
   * Updates a user's role in a company
   */
  updateUserRole(companyUserId: string, newRole: CompanyUserRole): void {
    const currentUsers = this.companyUsersSignal();
    const updatedUsers = currentUsers.map(user => {
      if (user.id === companyUserId) {
        return { ...user, role: newRole };
      }
      return user;
    });
    this.companyUsersSignal.set(updatedUsers);
    this.saveCompanyUsersToLocalStorage();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private loadCompanies(): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('chronos-companies');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const companies: Company[] = parsed.map((company: any) => ({
          ...company,
          createdAt: new Date(company.createdAt),
          updatedAt: company.updatedAt ? new Date(company.updatedAt) : undefined
        }));
        this.companiesSignal.set(companies);
      } catch (error) {
        console.error('Error loading companies:', error);
        this.initializeSampleCompanies();
      }
    } else {
      this.initializeSampleCompanies();
    }
  }

  private saveCompaniesToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    const companies = this.companies().map(company => ({
      ...company,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt?.toISOString()
    }));
    localStorage.setItem('chronos-companies', JSON.stringify(companies));
  }

  private loadCompanyUsers(): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('chronos-company-users');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const users: CompanyUser[] = parsed.map((user: any) => ({
          ...user,
          assignedAt: new Date(user.assignedAt)
        }));
        this.companyUsersSignal.set(users);
      } catch (error) {
        console.error('Error loading company users:', error);
        this.initializeSampleCompanyUsers();
      }
    } else {
      this.initializeSampleCompanyUsers();
    }
  }

  private saveCompanyUsersToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    const users = this.companyUsers().map(user => ({
      ...user,
      assignedAt: user.assignedAt.toISOString()
    }));
    localStorage.setItem('chronos-company-users', JSON.stringify(users));
  }

  private initializeSampleCompanies(): void {
    const sampleCompanies: Company[] = [
      {
        id: this.generateId(),
        name: 'Tech Solutions Inc.',
        email: 'contact@techsolutions.com',
        phone: '+1-555-0100',
        address: '123 Tech Street, San Francisco, CA 94102',
        isActive: true,
        subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
      },
      {
        id: this.generateId(),
        name: 'Digital Marketing Co.',
        email: 'info@digitalmarketing.com',
        phone: '+1-555-0200',
        address: '456 Market Ave, New York, NY 10001',
        isActive: true,
        subscriptionPlan: SubscriptionPlan.STARTER,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
      },
      {
        id: this.generateId(),
        name: 'Consulting Group LLC',
        email: 'hello@consultinggroup.com',
        phone: '+1-555-0300',
        address: '789 Business Blvd, Chicago, IL 60601',
        isActive: false,
        subscriptionPlan: SubscriptionPlan.FREE,
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) // 120 days ago
      }
    ];
    this.companiesSignal.set(sampleCompanies);
    this.saveCompaniesToLocalStorage();
  }

  private initializeSampleCompanyUsers(): void {
    const companies = this.companies();
    if (companies.length === 0) return;

    const sampleUsers: CompanyUser[] = [
      {
        id: this.generateId(),
        userId: 'user-001',
        companyId: companies[0].id,
        userName: 'John Admin',
        userEmail: 'john.admin@techsolutions.com',
        role: CompanyUserRole.ADMIN,
        assignedAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
        assignedBy: 'Super Admin'
      },
      {
        id: this.generateId(),
        userId: 'user-002',
        companyId: companies[0].id,
        userName: 'Jane Employee',
        userEmail: 'jane.employee@techsolutions.com',
        role: CompanyUserRole.EMPLOYEE,
        assignedAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
        assignedBy: 'John Admin'
      },
      {
        id: this.generateId(),
        userId: 'user-003',
        companyId: companies[1].id,
        userName: 'Bob Manager',
        userEmail: 'bob.manager@digitalmarketing.com',
        role: CompanyUserRole.ADMIN,
        assignedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
        assignedBy: 'Super Admin'
      }
    ];
    this.companyUsersSignal.set(sampleUsers);
    this.saveCompanyUsersToLocalStorage();
  }
}
