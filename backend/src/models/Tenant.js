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
const TenantSchema = new mongoose_1.Schema({
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
        set: (v) => (v && v.trim() !== '' ? v.trim() : undefined)
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
exports.default = mongoose_1.default.model('Tenant', TenantSchema);
