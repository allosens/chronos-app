/**
 * Employee models and types for employee management
 */

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface Employee {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  phoneNumber?: string;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
  deactivatedAt?: Date;
  deactivatedBy?: string;
}

export interface EmployeeFormData {
  email: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  phoneNumber?: string;
}

export interface EmployeeFilters {
  status?: EmployeeStatus;
  searchTerm?: string;
  department?: string;
}

export interface EmployeePagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
