export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  subscriptionPlan: SubscriptionPlan;
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

export enum SubscriptionPlan {
  FREE = 'Free',
  STARTER = 'Starter',
  PROFESSIONAL = 'Professional',
  ENTERPRISE = 'Enterprise'
}

export interface SubscriptionDetails {
  plan: SubscriptionPlan;
  maxUsers: number;
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionDetails> = {
  [SubscriptionPlan.FREE]: {
    plan: SubscriptionPlan.FREE,
    maxUsers: 5,
    features: ['Gestión básica de tiempo', 'Reportes mensuales', '5 usuarios'],
    monthlyPrice: 0,
    yearlyPrice: 0
  },
  [SubscriptionPlan.STARTER]: {
    plan: SubscriptionPlan.STARTER,
    maxUsers: 15,
    features: ['Todo de Free', 'Reportes semanales', 'Soporte email', '15 usuarios'],
    monthlyPrice: 29,
    yearlyPrice: 290
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    plan: SubscriptionPlan.PROFESSIONAL,
    maxUsers: 50,
    features: ['Todo de Starter', 'Reportes diarios', 'Soporte prioritario', 'API access', '50 usuarios'],
    monthlyPrice: 99,
    yearlyPrice: 990
  },
  [SubscriptionPlan.ENTERPRISE]: {
    plan: SubscriptionPlan.ENTERPRISE,
    maxUsers: -1, // Unlimited
    features: ['Todo de Professional', 'Usuarios ilimitados', 'Soporte 24/7', 'Integraciones personalizadas', 'SLA garantizado'],
    monthlyPrice: 299,
    yearlyPrice: 2990
  }
};
