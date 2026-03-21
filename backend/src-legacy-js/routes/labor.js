"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const laborController_1 = require("../controllers/laborController");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(['labor:write']), [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Nome da função é obrigatório'),
    (0, express_validator_1.body)('costPerHour').isNumeric().withMessage('Custo por hora deve ser um número').isFloat({ min: 0 }).withMessage('Custo por hora não pode ser negativo'),
    (0, express_validator_1.body)('category').optional().isIn(['producao', 'montagem', 'solda', 'usinagem', 'manutencao', 'engenharia', 'administrativo', 'outros']).withMessage('Categoria inválida'),
    validation_1.validateRequest
], laborController_1.createLabor);
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(['labor:read']), laborController_1.getLabors);
router.get('/:id', auth_1.authenticate, (0, auth_1.authorize)(['labor:read']), laborController_1.getLaborById);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)(['labor:write']), [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Nome da função não pode estar vazio'),
    (0, express_validator_1.body)('costPerHour').optional().isNumeric().withMessage('Custo por hora deve ser um número').isFloat({ min: 0 }).withMessage('Custo por hora não pode ser negativo'),
    (0, express_validator_1.body)('category').optional().isIn(['producao', 'montagem', 'solda', 'usinagem', 'manutencao', 'engenharia', 'administrativo', 'outros']).withMessage('Categoria inválida'),
    validation_1.validateRequest
], laborController_1.updateLabor);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(['labor:delete']), laborController_1.deleteLabor);
exports.default = router;
