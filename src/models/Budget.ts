import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetMaterial {
  materialId: mongoose.Types.ObjectId;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface IBudgetLabor {
  laborId: mongoose.Types.ObjectId;
  hours: number;
  costPerHour: number;
  totalCost: number;
}

export interface IBudgetMachine {
  machineId: mongoose.Types.ObjectId;
  hours: number;
  costPerHour: number;
  totalCost: number;
}

export interface IBudget extends Document {
  tenantId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  number: string;
  title: string;
  description?: string;
  materials: IBudgetMaterial[];
  labor: IBudgetLabor[];
  machines: IBudgetMachine[];
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

const BudgetMaterialSchema: Schema = new Schema({
  materialId: {
    type: Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantidade não pode ser negativa']
  },
  unitCost: {
    type: Number,
    required: true,
    min: [0, 'Custo unitário não pode ser negativo']
  },
  totalCost: {
    type: Number,
    required: true,
    min: [0, 'Custo total não pode ser negativo']
  }
});

const BudgetLaborSchema: Schema = new Schema({
  laborId: {
    type: Schema.Types.ObjectId,
    ref: 'Labor',
    required: true
  },
  hours: {
    type: Number,
    required: true,
    min: [0, 'Horas não podem ser negativas']
  },
  costPerHour: {
    type: Number,
    required: true,
    min: [0, 'Custo por hora não pode ser negativo']
  },
  totalCost: {
    type: Number,
    required: true,
    min: [0, 'Custo total não pode ser negativo']
  }
});

const BudgetMachineSchema: Schema = new Schema({
  machineId: {
    type: Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  hours: {
    type: Number,
    required: true,
    min: [0, 'Horas não podem ser negativas']
  },
  costPerHour: {
    type: Number,
    required: true,
    min: [0, 'Custo por hora não pode ser negativo']
  },
  totalCost: {
    type: Number,
    required: true,
    min: [0, 'Custo total não pode ser negativo']
  }
});

const BudgetSchema: Schema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID é obrigatório']
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Cliente é obrigatório']
  },
  number: {
    type: String,
    required: [true, 'Número do orçamento é obrigatório'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Título do orçamento é obrigatório'],
    trim: true,
    maxlength: [200, 'Título não pode ter mais de 200 caracteres']
  },
  description: {
    type: String,
    maxlength: [1000, 'Descrição não pode ter mais de 1000 caracteres']
  },
  materials: [BudgetMaterialSchema],
  labor: [BudgetLaborSchema],
  machines: [BudgetMachineSchema],
  freightCost: {
    type: Number,
    min: [0, 'Custo de frete não pode ser negativo'],
    default: 0
  },
  additionalCosts: {
    type: Number,
    min: [0, 'Custos adicionais não podem ser negativos'],
    default: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal não pode ser negativo']
  },
  marginPercentage: {
    type: Number,
    required: true,
    min: [0, 'Margem não pode ser negativa'],
    max: [100, 'Margem não pode ser maior que 100%']
  },
  marginValue: {
    type: Number,
    required: true,
    min: [0, 'Valor da margem não pode ser negativo']
  },
  totalCost: {
    type: Number,
    required: true,
    min: [0, 'Custo total não pode ser negativo']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Preço total não pode ser negativo']
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'approved', 'rejected', 'completed'],
    default: 'draft'
  },
  validityDays: {
    type: Number,
    required: true,
    min: [1, 'Validade deve ser de pelo menos 1 dia'],
    default: 30
  },
  observations: {
    type: String,
    maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
  },
  pdfPath: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  autoIndex: false
});

BudgetSchema.index({ tenantId: 1, number: 1 }, { unique: true });
BudgetSchema.index({ tenantId: 1, clientId: 1 });
BudgetSchema.index({ tenantId: 1, status: 1 });
BudgetSchema.index({ tenantId: 1, createdAt: -1 });

BudgetSchema.pre('validate', async function(this: any) {
  const materialsCost = (this.materials || []).reduce((total: number, item: any) => total + (item.totalCost || 0), 0);
  const laborCost = (this.labor || []).reduce((total: number, item: any) => total + (item.totalCost || 0), 0);
  const machinesCost = (this.machines || []).reduce((total: number, item: any) => total + (item.totalCost || 0), 0);
  const freightCost = this.freightCost || 0;
  const additionalCosts = this.additionalCosts || 0;
  
  this.subtotal = materialsCost + laborCost + machinesCost + freightCost + additionalCosts;
  this.marginValue = this.subtotal * (this.marginPercentage / 100);
  this.totalCost = this.subtotal;
  this.totalPrice = this.subtotal + this.marginValue;
});

export default mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);
