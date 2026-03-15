"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/register', [
    (0, express_validator_1.body)('tenantName').notEmpty().withMessage('Nome da empresa é obrigatório'),
    (0, express_validator_1.body)('tenantEmail').trim().toLowerCase().isEmail().withMessage('Email da empresa inválido'),
    (0, express_validator_1.body)('tenantDocument').optional({ checkFalsy: true }).trim(),
    (0, express_validator_1.body)('userName').notEmpty().withMessage('Nome do usuário é obrigatório'),
    (0, express_validator_1.body)('userEmail').trim().toLowerCase().isEmail().withMessage('Email do usuário inválido'),
    (0, express_validator_1.body)('userPassword').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    validation_1.validateRequest
], authController_1.register);
router.post('/login', [
    (0, express_validator_1.body)('email').trim().toLowerCase().isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Senha é obrigatória'),
    validation_1.validateRequest
], authController_1.login);
router.get('/profile', auth_1.authenticate, authController_1.getProfile);
router.post('/logout', auth_1.authenticate, authController_1.logout);
exports.default = router;
