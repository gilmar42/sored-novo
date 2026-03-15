export interface PopulatedBudget {
  _id: string;
  tenantId: string;
  clientId: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  number: string;
  title: string;
  description?: string;
  materials: Array<{
    materialId: {
      _id: string;
      name: string;
      unitOfMeasure: string;
    };
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  labor: Array<{
    laborId: {
      _id: string;
      name: string;
    };
    hours: number;
    costPerHour: number;
    totalCost: number;
  }>;
  machines: Array<{
    machineId: {
      _id: string;
      name: string;
    };
    hours: number;
    costPerHour: number;
    totalCost: number;
  }>;
  freightCost?: number;
  additionalCosts?: number;
  subtotal: number;
  marginPercentage: number;
  marginValue: number;
  totalCost: number;
  totalPrice: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'completed';
  validityDays: number;
  observations?: string;
  pdfPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PopulatedTenant {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  document: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  logo?: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  settings: {
    defaultMargin: number;
    currency: string;
    dateFormat: string;
  };
  subscription?: {
    planId: string;
    status: 'active' | 'inactive' | 'cancelled';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
