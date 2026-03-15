import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  tenantId: mongoose.Types.ObjectId;
  plan: 'monthly' | 'annual';
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate: Date;
  nextBillingDate: Date;
  amount: number;
  currency: string;
  paymentMethod: 'credit_card' | 'pix' | 'bank_transfer';
  mercadoPagoPaymentId?: string;
  mercadoPagoSubscriptionId?: string;
  autoRenew: boolean;
  trialDaysUsed: number;
  trialDaysTotal: number;
  features: {
    maxUsers: number;
    maxProjects: number;
    maxMaterials: number;
    apiAccess: boolean;
    advancedReports: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    dataExport: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['monthly', 'annual'],
    required: true,
    default: 'monthly'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'trial'],
    required: true,
    default: 'trial'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'BRL'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'pix', 'bank_transfer'],
    required: true
  },
  mercadoPagoPaymentId: {
    type: String,
    sparse: true
  },
  mercadoPagoSubscriptionId: {
    type: String,
    sparse: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  trialDaysUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  trialDaysTotal: {
    type: Number,
    default: 14,
    min: 0
  },
  features: {
    maxUsers: {
      type: Number,
      required: true,
      default: 1
    },
    maxProjects: {
      type: Number,
      required: true,
      default: 10
    },
    maxMaterials: {
      type: Number,
      required: true,
      default: 100
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    advancedReports: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    dataExport: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Métodos estáticos para obter configurações de planos
export const getPlanConfig = function(plan: string) {
  const plans: Record<string, any> = {
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
        dataExport: true
      }
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
        dataExport: true
      }
    }
  };
  
  return plans[plan] || plans.monthly;
};

// Use existing model if available
export default mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
