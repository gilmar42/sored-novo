import { Router } from 'express';
import { 
  createMachine, 
  getMachines, 
  getMachineById, 
  updateMachine, 
  deleteMachine 
} from '../controllers/machineController';
import { authenticate, authorize } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = Router();

router.post('/', 
  authenticate, 
  authorize(['machines:write']), 
  [
    body('name').notEmpty().withMessage('Nome da máquina é obrigatório'),
    body('costPerHour').isNumeric().withMessage('Custo por hora deve ser um número').isFloat({ min: 0 }).withMessage('Custo por hora não pode ser negativo'),
    body('energyCost').optional().isNumeric().withMessage('Custo de energia deve ser um número').isFloat({ min: 0 }).withMessage('Custo de energia não pode ser negativo'),
    body('maintenanceCost').optional().isNumeric().withMessage('Custo de manutenção deve ser um número').isFloat({ min: 0 }).withMessage('Custo de manutenção não pode ser negativo'),
    body('category').optional().isIn(['torno', 'fresadora', 'corte', 'prensa', 'dobradeira', 'solda', 'usinagem', 'cnc', 'outros']).withMessage('Categoria inválida'),
    validateRequest
  ], 
  createMachine
);

router.get('/', 
  authenticate, 
  authorize(['machines:read']), 
  getMachines
);

router.get('/:id', 
  authenticate, 
  authorize(['machines:read']), 
  getMachineById
);

router.put('/:id', 
  authenticate, 
  authorize(['machines:write']), 
  [
    body('name').optional().notEmpty().withMessage('Nome da máquina não pode estar vazio'),
    body('costPerHour').optional().isNumeric().withMessage('Custo por hora deve ser um número').isFloat({ min: 0 }).withMessage('Custo por hora não pode ser negativo'),
    body('energyCost').optional().isNumeric().withMessage('Custo de energia deve ser um número').isFloat({ min: 0 }).withMessage('Custo de energia não pode ser negativo'),
    body('maintenanceCost').optional().isNumeric().withMessage('Custo de manutenção deve ser um número').isFloat({ min: 0 }).withMessage('Custo de manutenção não pode ser negativo'),
    body('category').optional().isIn(['torno', 'fresadora', 'corte', 'prensa', 'dobradeira', 'solda', 'usinagem', 'cnc', 'outros']).withMessage('Categoria inválida'),
    validateRequest
  ], 
  updateMachine
);

router.delete('/:id', 
  authenticate, 
  authorize(['machines:delete']), 
  deleteMachine
);

export default router;
