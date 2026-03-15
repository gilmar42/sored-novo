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
exports.requireRole = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Tenant_1 = __importDefault(require("../models/Tenant"));
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Token não fornecido ou formato inválido' });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.userId).select('+password');
        if (!user || !user.isActive) {
            res.status(401).json({ message: 'Usuário não encontrado ou inativo' });
            return;
        }
        const tenant = yield Tenant_1.default.findById(decoded.tenantId);
        if (!tenant || tenant.status !== 'active') {
            res.status(401).json({ message: 'Empresa não encontrada ou inativa' });
            return;
        }
        req.user = user;
        req.tenant = tenant;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ message: 'Token inválido' });
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ message: 'Token expirado' });
        }
        else {
            res.status(500).json({ message: 'Erro na autenticação' });
        }
    }
});
exports.authenticate = authenticate;
const authorize = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Usuário não autenticado' });
            return;
        }
        const userPermissions = req.user.permissions;
        const hasPermission = permissions.some(permission => userPermissions.includes(permission));
        if (!hasPermission) {
            res.status(403).json({ message: 'Permissão negada' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Usuário não autenticado' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Perfil de usuário não autorizado' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
