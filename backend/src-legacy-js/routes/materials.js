"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const materialController_1 = require("../controllers/materialController");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(['materials:write']), [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Nome do material é obrigatório'),
    (0, express_validator_1.body)('category').notEmpty().withMessage('Categoria é obrigatória'),
    (0, express_validator_1.body)('unitOfMeasure').isIn(['kg', 'm', 'm²', 'm³', 'un', 'l', 'cm', 'cm²', 'cm³', 'ton']).withMessage('Unidade de medida inválida'),
    (0, express_validator_1.body)('unitCost').isNumeric().withMessage('Custo unitário deve ser um número').isFloat({ min: 0 }).withMessage('Custo unitário não pode ser negativo'),
    (0, express_validator_1.body)('itemType').optional().isIn(['material', 'component']).withMessage('Tipo de item inválido'),
    (0, express_validator_1.body)('size').optional().isString().withMessage('Tamanho deve ser uma string'),
    validation_1.validateRequest
], materialController_1.createMaterial);
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(['materials:read']), materialController_1.getMaterials);
router.get('/:id', auth_1.authenticate, (0, auth_1.authorize)(['materials:read']), materialController_1.getMaterialById);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)(['materials:write']), [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Nome do material não pode estar vazio'),
    (0, express_validator_1.body)('category').optional().notEmpty().withMessage('Categoria não pode estar vazia'),
    (0, express_validator_1.body)('unitOfMeasure').optional().isIn(['kg', 'm', 'm²', 'm³', 'un', 'l', 'cm', 'cm²', 'cm³', 'ton']).withMessage('Unidade de medida inválida'),
    (0, express_validator_1.body)('unitCost').optional().isNumeric().withMessage('Custo unitário deve ser um número').isFloat({ min: 0 }).withMessage('Custo unitário não pode ser negativo'),
    (0, express_validator_1.body)('itemType').optional().isIn(['material', 'component']).withMessage('Tipo de item inválido'),
    (0, express_validator_1.body)('size').optional().isString().withMessage('Tamanho deve ser uma string'),
    validation_1.validateRequest
], materialController_1.updateMaterial);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(['materials:delete']), materialController_1.deleteMaterial);
exports.default = router;
