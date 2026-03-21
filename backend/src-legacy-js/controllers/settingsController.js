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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionInfo = exports.uploadLogo = exports.updateSettings = exports.getSettings = void 0;
const Tenant_1 = __importDefault(require("../models/Tenant"));
const getSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const tenant = yield Tenant_1.default.findById(req.tenant._id);
        if (!tenant) {
            res.status(404).json({ message: 'Empresa não encontrada' });
            return;
        }
        res.json({
            tenant: {
                id: tenant._id,
                name: tenant.name,
                email: tenant.email,
                phone: tenant.phone,
                document: tenant.document,
                address: tenant.address,
                logo: tenant.logo,
                plan: tenant.plan,
                status: tenant.status,
                settings: tenant.settings,
                subscription: tenant.subscription
            }
        });
    }
    catch (error) {
        console.error('Erro ao obter configurações:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getSettings = getSettings;
const updateSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { name, email, phone, address, settings } = req.body;
        const tenant = yield Tenant_1.default.findById(req.tenant._id);
        if (!tenant) {
            res.status(404).json({ message: 'Empresa não encontrada' });
            return;
        }
        if (email && email !== tenant.email) {
            const existingTenant = yield Tenant_1.default.findOne({
                email: email,
                _id: { $ne: req.tenant._id }
            });
            if (existingTenant) {
                res.status(400).json({ message: 'Email já está em uso por outra empresa' });
                return;
            }
        }
        if (name)
            tenant.name = name;
        if (email)
            tenant.email = email;
        if (phone)
            tenant.phone = phone;
        if (address)
            tenant.address = address;
        if (settings) {
            if (settings.defaultMargin !== undefined) {
                tenant.settings.defaultMargin = Math.max(0, Math.min(100, settings.defaultMargin));
            }
            if (settings.currency)
                tenant.settings.currency = settings.currency;
            if (settings.dateFormat)
                tenant.settings.dateFormat = settings.dateFormat;
        }
        yield tenant.save();
        res.json({
            message: 'Configurações atualizadas com sucesso',
            tenant: {
                id: tenant._id,
                name: tenant.name,
                email: tenant.email,
                phone: tenant.phone,
                document: tenant.document,
                address: tenant.address,
                logo: tenant.logo,
                plan: tenant.plan,
                status: tenant.status,
                settings: tenant.settings,
                subscription: tenant.subscription
            }
        });
    }
    catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.updateSettings = updateSettings;
const uploadLogo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: 'Nenhum arquivo enviado' });
            return;
        }
        const tenant = yield Tenant_1.default.findById(req.tenant._id);
        if (!tenant) {
            res.status(404).json({ message: 'Empresa não encontrada' });
            return;
        }
        tenant.logo = req.file.filename;
        yield tenant.save();
        res.json({
            message: 'Logo atualizado com sucesso',
            logo: req.file.filename
        });
    }
    catch (error) {
        console.error('Erro ao fazer upload do logo:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.uploadLogo = uploadLogo;
const getSubscriptionInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const tenant = yield Tenant_1.default.findById(req.tenant._id);
        if (!tenant) {
            res.status(404).json({ message: 'Empresa não encontrada' });
            return;
        }
        const planLimits = {
            starter: {
                maxClients: 50,
                maxMaterials: 100,
                maxBudgets: 200,
                maxUsers: 3
            },
            professional: {
                maxClients: -1,
                maxMaterials: -1,
                maxBudgets: -1,
                maxUsers: 10
            },
            enterprise: {
                maxClients: -1,
                maxMaterials: -1,
                maxBudgets: -1,
                maxUsers: -1
            }
        };
        const currentUsage = yield Promise.all([
            Promise.resolve().then(() => __importStar(require('../models/Client'))).then(({ default: Client }) => Client.countDocuments({ tenantId: req.tenant._id, isActive: true })),
            Promise.resolve().then(() => __importStar(require('../models/Material'))).then(({ default: Material }) => Material.countDocuments({ tenantId: req.tenant._id, isActive: true })),
            Promise.resolve().then(() => __importStar(require('../models/Budget'))).then(({ default: Budget }) => Budget.countDocuments({ tenantId: req.tenant._id })),
            Promise.resolve().then(() => __importStar(require('../models/User'))).then(({ default: User }) => User.countDocuments({ tenantId: req.tenant._id, isActive: true }))
        ]);
        const [clientsCount, materialsCount, budgetsCount, usersCount] = currentUsage;
        const limits = planLimits[tenant.plan];
        res.json({
            plan: tenant.plan,
            subscription: tenant.subscription,
            limits,
            usage: {
                clients: clientsCount,
                materials: materialsCount,
                budgets: budgetsCount,
                users: usersCount
            },
            canUpgrade: tenant.plan !== 'enterprise'
        });
    }
    catch (error) {
        console.error('Erro ao obter informações da assinatura:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getSubscriptionInfo = getSubscriptionInfo;
