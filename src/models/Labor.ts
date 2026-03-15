import mongoose, { Schema, Document } from 'mongoose';

export interface ILabor extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  costPerHour: number;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LaborSchema: Schema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID é obrigatório']
  },
  name: {
    type: String,
    required: [true, 'Nome da função é obrigatório'],
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
  category: {
    type: String,
    trim: true,
    enum: ['producao', 'montagem', 'solda', 'usinagem', 'manutencao', 'engenharia', 'administrativo', 'outros']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

LaborSchema.index({ tenantId: 1, name: 1 });
LaborSchema.index({ tenantId: 1, category: 1 });
LaborSchema.index({ tenantId: 1, isActive: 1 });

export default mongoose.models.Labor || mongoose.model<ILabor>('Labor', LaborSchema);
