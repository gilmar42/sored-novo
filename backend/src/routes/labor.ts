import { Router } from 'express';
import { 
  createLabor, 
  getLabors, 
  getLaborById, 
  updateLabor, 
  deleteLabor 
} from '../controllers/laborController';
import { authenticate, authorize } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = Router();

router.post('/', 
  authenticate, 
  authorize(['labor:write']), 
  [
    body('name').notEmpty().withMessage('Nome da função é obrigatório'),
    body('costPerHour').isNumeric().withMessage('Custo por hora deve ser um número').isFloat({ min: 0 }).withMessage('Custo por hora não pode ser negativo'),
    body('category').optional().isIn(['producao', 'montagem', 'solda', 'usinagem', 'manutencao', 'engenharia', 'administrativo', 'outros']).withMessage('Categoria inválida'),
    validateRequest
  ], 
  createLabor
);

router.get('/', 
  authenticate, 
  authorize(['labor:read']), 
  getLabors
);

router.get('/:id', 
  authenticate, 
  authorize(['labor:read']), 
  getLaborById
);

router.put('/:id', 
  authenticate, 
  authorize(['labor:write']), 
  [
    body('name').optional().notEmpty().withMessage('Nome da função não pode estar vazio'),
    body('costPerHour').optional().isNumeric().withMessage('Custo por hora deve ser um número').isFloat({ min: 0 }).withMessage('Custo por hora não pode ser negativo'),
    body('category').optional().isIn(['producao', 'montagem', 'solda', 'usinagem', 'manutencao', 'engenharia', 'administrativo', 'outros']).withMessage('Categoria inválida'),
    validateRequest
  ], 
  updateLabor
);

router.delete('/:id', 
  authenticate, 
  authorize(['labor:delete']), 
  deleteLabor
);

export default router;
