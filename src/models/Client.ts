import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  document?: string; // CPF ou CNPJ
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  observations?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID é obrigatório']
  },
  name: {
    type: String,
    required: [true, 'Nome do cliente é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  phone: {
    type: String,
    trim: true
  },
  document: {
    type: String,
    trim: true
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
  observations: {
    type: String,
    maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

ClientSchema.index({ tenantId: 1, name: 1 });
ClientSchema.index({ tenantId: 1, email: 1 });
ClientSchema.index({ tenantId: 1, document: 1 });
ClientSchema.index({ tenantId: 1, isActive: 1 });

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
