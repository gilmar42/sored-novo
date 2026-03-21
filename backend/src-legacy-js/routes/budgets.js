"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const budgetController_1 = require("../controllers/budgetController");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(['budgets:write']), [
    (0, express_validator_1.body)('clientId').notEmpty().withMessage('Cliente é obrigatório'),
    (0, express_validator_1.body)('title').notEmpty().withMessage('Título do orçamento é obrigatório'),
    (0, express_validator_1.body)('materials').isArray().withMessage('Materiais deve ser um array'),
    (0, express_validator_1.body)('labor').isArray().withMessage('Mão de obra deve ser um array'),
    (0, express_validator_1.body)('machines').isArray().withMessage('Máquinas deve ser um array'),
    (0, express_validator_1.body)('marginPercentage').isNumeric().withMessage('Margem deve ser um número').isFloat({ min: 0, max: 100 }).withMessage('Margem deve estar entre 0 e 100'),
    (0, express_validator_1.body)('validityDays').isNumeric().withMessage('Validade deve ser um número').isInt({ min: 1 }).withMessage('Validade deve ser pelo menos 1 dia'),
    validation_1.validateRequest
], budgetController_1.createBudget);
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(['budgets:read']), budgetController_1.getBudgets);
router.get('/stats', auth_1.authenticate, (0, auth_1.authorize)(['reports:read']), budgetController_1.getBudgetStats);
router.get('/:id', auth_1.authenticate, (0, auth_1.authorize)(['budgets:read']), budgetController_1.getBudgetById);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)(['budgets:write']), [
    (0, express_validator_1.body)('clientId').optional().notEmpty().withMessage('Cliente não pode estar vazio'),
    (0, express_validator_1.body)('title').optional().notEmpty().withMessage('Título não pode estar vazio'),
    (0, express_validator_1.body)('materials').optional().isArray().withMessage('Materiais deve ser um array'),
    (0, express_validator_1.body)('labor').optional().isArray().withMessage('Mão de obra deve ser um array'),
    (0, express_validator_1.body)('machines').optional().isArray().withMessage('Máquinas deve ser um array'),
    (0, express_validator_1.body)('marginPercentage').optional().isNumeric().withMessage('Margem deve ser um número').isFloat({ min: 0, max: 100 }).withMessage('Margem deve estar entre 0 e 100'),
    (0, express_validator_1.body)('validityDays').optional().isNumeric().withMessage('Validade deve ser um número').isInt({ min: 1 }).withMessage('Validade deve ser pelo menos 1 dia'),
    (0, express_validator_1.body)('status').optional().isIn(['draft', 'sent', 'approved', 'rejected', 'completed']).withMessage('Status inválido'),
    validation_1.validateRequest
], budgetController_1.updateBudget);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(['budgets:delete']), budgetController_1.deleteBudget);
exports.default = router;
