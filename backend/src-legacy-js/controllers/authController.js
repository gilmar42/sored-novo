"use strict";
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
exports.logout = exports.getProfile = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Tenant_1 = __importDefault(require("../models/Tenant"));
const logger_1 = __importDefault(require("../utils/logger"));
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantName, tenantEmail, tenantDocument, userName, userEmail, userPassword } = req.body;
        const normalizedTenantEmail = tenantEmail.trim().toLowerCase();
        const normalizedUserEmail = userEmail.trim().toLowerCase();
        const existingTenant = yield Tenant_1.default.findOne({ email: normalizedTenantEmail });
        if (existingTenant) {
            res.status(400).json({ message: 'Empresa já cadastrada com este email' });
            return;
        }
        const existingUser = yield User_1.default.findOne({ email: normalizedUserEmail });
        if (existingUser) {
            res.status(400).json({ message: 'Usuário já cadastrado com este email' });
            return;
        }
        const tenant = new Tenant_1.default(Object.assign(Object.assign({ name: tenantName, email: normalizedTenantEmail }, (tenantDocument && { document: tenantDocument })), { plan: 'starter', status: 'active', settings: {
                defaultMargin: 30,
                currency: 'BRL',
                dateFormat: 'DD/MM/YYYY'
            } }));
        yield tenant.save();
        const user = new User_1.default({
            tenantId: tenant._id,
            name: userName,
            email: normalizedUserEmail,
            password: userPassword,
            role: 'admin',
            permissions: [
                'clients:read', 'clients:write', 'clients:delete',
                'materials:read', 'materials:write', 'materials:delete',
                'labor:read', 'labor:write', 'labor:delete',
                'machines:read', 'machines:write', 'machines:delete',
                'budgets:read', 'budgets:write', 'budgets:delete',
                'reports:read', 'settings:read', 'settings:write',
                'users:read', 'users:write', 'users:delete'
            ]
        });
        yield user.save();
        const token = jsonwebtoken_1.default.sign({
            userId: user._id,
            tenantId: tenant._id
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        res.status(201).json({
            message: 'Empresa e usuário cadastrados com sucesso',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            },
            tenant: {
                id: tenant._id,
                name: tenant.name,
                email: tenant.email,
                plan: tenant.plan,
                settings: tenant.settings
            }
        });
    }
    catch (error) {
        logger_1.default.error('Erro no registro', { error: error === null || error === void 0 ? void 0 : error.message });
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.trim().toLowerCase();
        logger_1.default.info('Tentativa de login', { email: normalizedEmail, ip: req.ip });
        const user = yield User_1.default.findOne({ email: normalizedEmail }).select('+password').populate('tenantId');
        logger_1.default.debug('Usuário consultado', {
            email: normalizedEmail,
            found: !!user,
            isActive: user === null || user === void 0 ? void 0 : user.isActive
        });
        if (!user) {
            logger_1.default.warn('Tentativa de login com usuário não encontrado', { email: normalizedEmail, ip: req.ip });
            res.status(401).json({ message: 'Usuário não encontrado' });
            return;
        }
        if (!user.isActive) {
            logger_1.default.warn('Tentativa de login com usuário inativo', { userId: user._id, email: normalizedEmail });
            res.status(401).json({ message: 'Sua conta de usuário está inativa' });
            return;
        }
        const isPasswordValid = yield user.comparePassword(password);
        if (!isPasswordValid) {
            logger_1.default.warn('Tentativa de login com senha incorreta', { userId: user._id, email: normalizedEmail, ip: req.ip });
            res.status(401).json({ message: 'Senha incorreta' });
            return;
        }
        logger_1.default.info('Login bem-sucedido', { userId: user._id, email: normalizedEmail });
        const tenant = user.tenantId;
        console.log('Tenant:', tenant ? { id: tenant._id, name: tenant.name, status: tenant.status } : 'Nenhum tenant');
        if (!tenant || tenant.status !== 'active') {
            res.status(401).json({ message: 'Acesso negado: a empresa vinculada está inativa ou não foi encontrada' });
            return;
        }
        user.lastLogin = new Date();
        yield user.save();
        const token = jsonwebtoken_1.default.sign({
            userId: user._id,
            tenantId: tenant._id
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                lastLogin: user.lastLogin
            },
            tenant: {
                id: tenant._id,
                name: tenant.name,
                email: tenant.email,
                plan: tenant.plan,
                settings: tenant.settings
            }
        });
    }
    catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.login = login;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.tenant) {
            res.status(401).json({ message: 'Usuário não autenticado' });
            return;
        }
        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                permissions: req.user.permissions,
                lastLogin: req.user.lastLogin
            },
            tenant: {
                id: req.tenant._id,
                name: req.tenant.name,
                email: req.tenant.email,
                plan: req.tenant.plan,
                settings: req.tenant.settings
            }
        });
    }
    catch (error) {
        console.error('Erro ao obter perfil:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getProfile = getProfile;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json({ message: 'Logout realizado com sucesso' });
    }
    catch (error) {
        console.error('Erro no logout:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.logout = logout;
