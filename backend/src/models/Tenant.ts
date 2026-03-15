import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string; // CNPJ
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
    defaultMargin: number; // Default profit margin in percentage
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

const TenantSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Nome da empresa é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  phone: {
    type: String,
    trim: true
  },
  document: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    set: (v: string) => (v && v.trim() !== '' ? v.trim() : undefined)
  },
  address: {
    street: { type: String, required: false },
    number: { type: String, required: false },
    complement: { type: String, required: false },
    neighborhood: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    zipCode: { type: String, required: false }
  },
  logo: {
    type: String,
    required: false
  },
  plan: {
    type: String,
    enum: ['starter', 'professional', 'enterprise'],
    default: 'starter'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  settings: {
    defaultMargin: {
      type: Number,
      default: 30,
      min: 0,
      max: 100
    },
    currency: {
      type: String,
      default: 'BRL'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    }
  },
  subscription: {
    planId: { type: String, required: false },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'cancelled'],
      default: 'inactive'
    },
    currentPeriodStart: { type: Date, required: false },
    currentPeriodEnd: { type: Date, required: false },
    cancelAtPeriodEnd: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

TenantSchema.index({ email: 1 });
TenantSchema.index({ document: 1 });
TenantSchema.index({ status: 1 });

export default mongoose.model<ITenant>('Tenant', TenantSchema);
