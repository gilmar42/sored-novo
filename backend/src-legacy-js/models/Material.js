"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const MaterialComponentSchema = new mongoose_1.Schema({
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
const MaterialSchema = new mongoose_1.Schema({
    tenantId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
MaterialSchema.pre('save', function (next) {
    if (this.isComposite && this.components && this.components.length > 0) {
        this.calculatedCost = this.components.reduce((total, component) => {
            return total + component.totalCost;
        }, 0);
    }
    next();
});
exports.default = mongoose_1.default.model('Material', MaterialSchema);
