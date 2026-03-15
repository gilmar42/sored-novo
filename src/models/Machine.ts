import mongoose, { Schema, Document } from 'mongoose';

export interface IMachine extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  costPerHour: number;
  energyCost?: number;
  maintenanceCost?: number;
  category?: string;
  specifications?: {
    power?: string;
    capacity?: string;
    dimensions?: string;
    weight?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MachineSchema: Schema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID é obrigatório']
  },
  name: {
    type: String,
    required: [true, 'Nome da máquina é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  costPerHour: {
    type: Number,
    required: [true, 'Custo por hora é obrigatório'],
    min: [0, 'Custo por hora não pode ser negativo']
  },
  energyCost: {
    type: Number,
    min: [0, 'Custo de energia não pode ser negativo']
  },
  maintenanceCost: {
    type: Number,
    min: [0, 'Custo de manutenção não pode ser negativo']
  },
  category: {
    type: String,
    trim: true,
    enum: ['torno', 'fresadora', 'corte', 'prensa', 'dobradeira', 'solda', 'usinagem', 'cnc', 'outros']
  },
  specifications: {
    power: { type: String },
    capacity: { type: String },
    dimensions: { type: String },
    weight: { type: String }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

MachineSchema.index({ tenantId: 1, name: 1 });
MachineSchema.index({ tenantId: 1, category: 1 });
MachineSchema.index({ tenantId: 1, isActive: 1 });

export default mongoose.models.Machine || mongoose.model<IMachine>('Machine', MachineSchema);
