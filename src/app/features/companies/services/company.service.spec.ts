import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CompanyService } from './company.service';
import { CompanyFormData, CompanyUserRole } from '../models/company.model';

describe('CompanyService', () => {
  let service: CompanyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CompanyService
      ]
    });
    service = TestBed.inject(CompanyService);
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createCompany', () => {
    it('should create a new company', () => {
      const formData: CompanyFormData = {
        name: 'Test Company',
        email: 'test@company.com',
        phone: '+1-555-0400',
        address: '123 Test St'
      };

      const company = service.createCompany(formData);

      expect(company).toBeTruthy();
      expect(company.name).toBe(formData.name);
      expect(company.email).toBe(formData.email);
      expect(company.phone).toBe(formData.phone);
      expect(company.address).toBe(formData.address);
      expect(company.isActive).toBe(true);
      expect(company.id).toBeTruthy();
      expect(company.createdAt).toBeInstanceOf(Date);
    });

    it('should add the company to the companies signal', () => {
      const initialCount = service.companies().length;
      const formData: CompanyFormData = {
        name: 'Test Company',
        email: 'test@company.com',
        phone: '+1-555-0400',
        address: '123 Test St'
      };

      service.createCompany(formData);

      expect(service.companies().length).toBe(initialCount + 1);
    });
  });

  describe('updateCompany', () => {
    it('should update an existing company', () => {
      const formData: CompanyFormData = {
        name: 'Original Company',
        email: 'original@company.com',
        phone: '+1-555-0400',
        address: '123 Original St'
      };

      const company = service.createCompany(formData);
      
      const updatedFormData: CompanyFormData = {
        name: 'Updated Company',
        email: 'updated@company.com',
        phone: '+1-555-0500',
        address: '456 Updated Ave'
      };

      const updated = service.updateCompany(company.id, updatedFormData);

      expect(updated).toBeTruthy();
      expect(updated?.name).toBe(updatedFormData.name);
      expect(updated?.email).toBe(updatedFormData.email);
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent company', () => {
      const formData: CompanyFormData = {
        name: 'Test',
        email: 'test@test.com',
        phone: '+1-555-0400',
        address: '123 Test'
      };

      const updated = service.updateCompany('non-existent-id', formData);

      expect(updated).toBeNull();
    });
  });

  describe('toggleCompanyStatus', () => {
    it('should toggle company active status', () => {
      const formData: CompanyFormData = {
        name: 'Test Company',
        email: 'test@company.com',
        phone: '+1-555-0400',
        address: '123 Test St'
      };

      const company = service.createCompany(formData);
      expect(company.isActive).toBe(true);

      service.toggleCompanyStatus(company.id);
      const updated = service.getCompanyById(company.id);
      expect(updated?.isActive).toBe(false);

      service.toggleCompanyStatus(company.id);
      const toggled = service.getCompanyById(company.id);
      expect(toggled?.isActive).toBe(true);
    });
  });

  describe('assignUserToCompany', () => {
    it('should assign a user to a company', () => {
      const formData: CompanyFormData = {
        name: 'Test Company',
        email: 'test@company.com',
        phone: '+1-555-0400',
        address: '123 Test St'
      };

      const company = service.createCompany(formData);
      const assignment = service.assignUserToCompany(
        {
          userId: 'test-user-id',
          companyId: company.id,
          role: CompanyUserRole.ADMIN
        },
        'super-admin'
      );

      expect(assignment).toBeTruthy();
      expect(assignment.userId).toBe('test-user-id');
      expect(assignment.companyId).toBe(company.id);
      expect(assignment.role).toBe(CompanyUserRole.ADMIN);
      expect(assignment.assignedBy).toBe('super-admin');
    });
  });

  describe('removeUserFromCompany', () => {
    it('should remove a user from a company', () => {
      const formData: CompanyFormData = {
        name: 'Test Company',
        email: 'test@company.com',
        phone: '+1-555-0400',
        address: '123 Test St'
      };

      const company = service.createCompany(formData);
      const assignment = service.assignUserToCompany(
        {
          userId: 'test-user-id',
          companyId: company.id,
          role: CompanyUserRole.ADMIN
        },
        'super-admin'
      );

      const initialCount = service.companyUsers().length;
      service.removeUserFromCompany(assignment.id);

      expect(service.companyUsers().length).toBe(initialCount - 1);
      expect(service.getUsersByCompany(company.id).length).toBe(0);
    });
  });

  describe('getUsersByCompany', () => {
    it('should return users for a specific company', () => {
      const formData1: CompanyFormData = {
        name: 'Company 1',
        email: 'company1@test.com',
        phone: '+1-555-0400',
        address: '123 Test St'
      };

      const formData2: CompanyFormData = {
        name: 'Company 2',
        email: 'company2@test.com',
        phone: '+1-555-0500',
        address: '456 Test Ave'
      };

      const company1 = service.createCompany(formData1);
      const company2 = service.createCompany(formData2);

      service.assignUserToCompany(
        { userId: 'user1', companyId: company1.id, role: CompanyUserRole.ADMIN },
        'super-admin'
      );

      service.assignUserToCompany(
        { userId: 'user2', companyId: company1.id, role: CompanyUserRole.EMPLOYEE },
        'super-admin'
      );

      service.assignUserToCompany(
        { userId: 'user3', companyId: company2.id, role: CompanyUserRole.ADMIN },
        'super-admin'
      );

      const company1Users = service.getUsersByCompany(company1.id);
      const company2Users = service.getUsersByCompany(company2.id);

      expect(company1Users.length).toBe(2);
      expect(company2Users.length).toBe(1);
    });
  });

  describe('updateUserRole', () => {
    it('should update a user role in a company', () => {
      const formData: CompanyFormData = {
        name: 'Test Company',
        email: 'test@company.com',
        phone: '+1-555-0400',
        address: '123 Test St'
      };

      const company = service.createCompany(formData);
      const assignment = service.assignUserToCompany(
        {
          userId: 'test-user-id',
          companyId: company.id,
          role: CompanyUserRole.EMPLOYEE
        },
        'super-admin'
      );

      service.updateUserRole(assignment.id, CompanyUserRole.ADMIN);

      const users = service.getUsersByCompany(company.id);
      const updatedUser = users.find(u => u.id === assignment.id);

      expect(updatedUser?.role).toBe(CompanyUserRole.ADMIN);
    });
  });
});
