"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clientController_1 = require("../controllers/clientController");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(['clients:write']), [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Nome do cliente é obrigatório'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('phone').optional().notEmpty().withMessage('Telefone não pode estar vazio'),
    (0, express_validator_1.body)('document').optional().notEmpty().withMessage('Documento não pode estar vazio'),
    validation_1.validateRequest
], clientController_1.createClient);
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(['clients:read']), clientController_1.getClients);
router.get('/:id', auth_1.authenticate, (0, auth_1.authorize)(['clients:read']), clientController_1.getClientById);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)(['clients:write']), [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Nome do cliente não pode estar vazio'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('phone').optional().notEmpty().withMessage('Telefone não pode estar vazio'),
    (0, express_validator_1.body)('document').optional().notEmpty().withMessage('Documento não pode estar vazio'),
    validation_1.validateRequest
], clientController_1.updateClient);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(['clients:delete']), clientController_1.deleteClient);
exports.default = router;
