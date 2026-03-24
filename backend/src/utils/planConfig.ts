export type PlanFeatureSet = {
  maxUsers: number;
  maxProjects: number;
  maxMaterials: number;
  apiAccess: boolean;
  advancedReports: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  dataExport: boolean;
};

export type PlanConfig = {
  amount: number;
  trialDays: number;
  features: PlanFeatureSet;
};

const plans: Record<string, PlanConfig> = {
  monthly: {
    amount: 100,
    trialDays: 5,
    features: {
      maxUsers: 5,
      maxProjects: 50,
      maxMaterials: 500,
      apiAccess: true,
      advancedReports: true,
      prioritySupport: false,
      customBranding: false,
      dataExport: true,
    },
  },
  annual: {
    amount: 1100,
    trialDays: 5,
    features: {
      maxUsers: 10,
      maxProjects: 200,
      maxMaterials: 2000,
      apiAccess: true,
      advancedReports: true,
      prioritySupport: true,
      customBranding: true,
      dataExport: true,
    },
  },
};

export const getPlanConfig = (plan: string): PlanConfig => plans[plan] || plans.monthly;
