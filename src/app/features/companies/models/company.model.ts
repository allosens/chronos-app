export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CompanyFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface CompanyUser {
  id: string;
  userId: string;
  companyId: string;
  userName: string;
  userEmail: string;
  role: CompanyUserRole;
  assignedAt: Date;
  assignedBy: string;
}

export enum CompanyUserRole {
  ADMIN = 'Company Admin',
  EMPLOYEE = 'Employee'
}

export interface AssignUserRequest {
  userId: string;
  companyId: string;
  role: CompanyUserRole;
}
