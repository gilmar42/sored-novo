import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterialComponent {
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface IMaterial extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  unitOfMeasure: string;
  unitCost: number;
  weight?: number;
  weightUnit?: string;
  dimensions?: {
    length: number;
    lengthUnit: string;
    width: number;
    widthUnit: string;
    height: number;
    heightUnit: string;
  };
  diameter?: number;
  diameterUnit?: string;
  volume?: number;
  volumeUnit?: string;
  isComposite: boolean;
  components?: IMaterialComponent[];
  calculatedCost?: number;
  itemType: 'material' | 'component';
  size?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialComponentSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
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

const MaterialSchema: Schema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID é obrigatório']
  },
  name: {
    type: String,
    required: [true, 'Nome do material é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  category: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    trim: true
  },
  unitOfMeasure: {
    type: String,
    required: [true, 'Unidade de medida é obrigatória'],
    trim: true,
    enum: ['kg', 'm', 'm²', 'm³', 'un', 'l', 'cm', 'cm²', 'cm³', 'ton']
  },
  unitCost: {
    type: Number,
    required: [true, 'Custo unitário é obrigatório'],
    min: [0, 'Custo unitário não pode ser negativo']
  },
  weight: {
    type: Number,
    min: [0, 'Peso não pode ser negativo']
  },
  weightUnit: {
    type: String,
    enum: ['kg', 'g'],
    default: 'kg'
  },
  dimensions: {
    length: { type: Number, min: 0 },
    lengthUnit: { type: String, enum: ['cm', 'mm', 'm'], default: 'cm' },
    width: { type: Number, min: 0 },
    widthUnit: { type: String, enum: ['cm', 'mm', 'm'], default: 'cm' },
    height: { type: Number, min: 0 },
    heightUnit: { type: String, enum: ['cm', 'mm', 'm'], default: 'cm' }
  },
  diameter: {
    type: Number,
    min: 0
  },
  diameterUnit: {
    type: String,
    enum: ['cm', 'mm', 'pol'],
    default: 'mm'
  },
  volume: {
    type: Number,
    min: 0
  },
  volumeUnit: {
    type: String,
    enum: ['m³', 'cm³', 'l'],
    default: 'm³'
  },
  isComposite: {
    type: Boolean,
    default: false
  },
  components: [MaterialComponentSchema],
  calculatedCost: {
    type: Number,
    min: [0, 'Custo calculado não pode ser negativo']
  },
  itemType: {
    type: String,
    enum: ['material', 'component'],
    default: 'material',
    required: true
  },
  size: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

MaterialSchema.index({ tenantId: 1, name: 1 });
MaterialSchema.index({ tenantId: 1, category: 1 });
MaterialSchema.index({ tenantId: 1, isActive: 1 });

MaterialSchema.pre('save', async function(this: any) {
  if (this.isComposite && this.components && this.components.length > 0) {
    this.calculatedCost = this.components.reduce((total: number, component: IMaterialComponent) => {
      return total + component.totalCost;
    }, 0);
  }
});

export default mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);
