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
const MachineSchema = new mongoose_1.Schema({
    tenantId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
exports.default = mongoose_1.default.model('Machine', MachineSchema);
