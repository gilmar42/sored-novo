"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const machineController_1 = require("../controllers/machineController");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(['machines:write']), [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Nome da máquina é obrigatório'),
    (0, express_validator_1.body)('costPerHour').isNumeric().withMessage('Custo por hora deve ser um número').isFloat({ min: 0 }).withMessage('Custo por hora não pode ser negativo'),
    (0, express_validator_1.body)('energyCost').optional().isNumeric().withMessage('Custo de energia deve ser um número').isFloat({ min: 0 }).withMessage('Custo de energia não pode ser negativo'),
    (0, express_validator_1.body)('maintenanceCost').optional().isNumeric().withMessage('Custo de manutenção deve ser um número').isFloat({ min: 0 }).withMessage('Custo de manutenção não pode ser negativo'),
    (0, express_validator_1.body)('category').optional().isIn(['torno', 'fresadora', 'corte', 'prensa', 'dobradeira', 'solda', 'usinagem', 'cnc', 'outros']).withMessage('Categoria inválida'),
    validation_1.validateRequest
], machineController_1.createMachine);
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(['machines:read']), machineController_1.getMachines);
router.get('/:id', auth_1.authenticate, (0, auth_1.authorize)(['machines:read']), machineController_1.getMachineById);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)(['machines:write']), [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Nome da máquina não pode estar vazio'),
    (0, express_validator_1.body)('costPerHour').optional().isNumeric().withMessage('Custo por hora deve ser um número').isFloat({ min: 0 }).withMessage('Custo por hora não pode ser negativo'),
    (0, express_validator_1.body)('energyCost').optional().isNumeric().withMessage('Custo de energia deve ser um número').isFloat({ min: 0 }).withMessage('Custo de energia não pode ser negativo'),
    (0, express_validator_1.body)('maintenanceCost').optional().isNumeric().withMessage('Custo de manutenção deve ser um número').isFloat({ min: 0 }).withMessage('Custo de manutenção não pode ser negativo'),
    (0, express_validator_1.body)('category').optional().isIn(['torno', 'fresadora', 'corte', 'prensa', 'dobradeira', 'solda', 'usinagem', 'cnc', 'outros']).withMessage('Categoria inválida'),
    validation_1.validateRequest
], machineController_1.updateMachine);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(['machines:delete']), machineController_1.deleteMachine);
exports.default = router;
