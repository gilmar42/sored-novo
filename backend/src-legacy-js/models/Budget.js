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
const BudgetMaterialSchema = new mongoose_1.Schema({
    materialId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const BudgetLaborSchema = new mongoose_1.Schema({
    laborId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const BudgetMachineSchema = new mongoose_1.Schema({
    machineId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const BudgetSchema = new mongoose_1.Schema({
    tenantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: [true, 'Tenant ID é obrigatório']
    },
    clientId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
BudgetSchema.pre('validate', function (next) {
    const materialsCost = this.materials.reduce((total, item) => total + item.totalCost, 0);
    const laborCost = this.labor.reduce((total, item) => total + item.totalCost, 0);
    const machinesCost = this.machines.reduce((total, item) => total + item.totalCost, 0);
    const freightCost = this.freightCost || 0;
    const additionalCosts = this.additionalCosts || 0;
    this.subtotal = materialsCost + laborCost + machinesCost + freightCost + additionalCosts;
    this.marginValue = this.subtotal * (this.marginPercentage / 100);
    this.totalCost = this.subtotal;
    this.totalPrice = this.subtotal + this.marginValue;
    next();
});
exports.default = mongoose_1.default.model('Budget', BudgetSchema);
