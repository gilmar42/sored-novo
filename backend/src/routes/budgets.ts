import { Router } from 'express';
import { 
  createBudget, 
  getBudgets, 
  getBudgetById, 
  updateBudget, 
  deleteBudget,
  getBudgetStats
} from '../controllers/budgetController';
import { authenticate, authorize } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = Router();

router.post('/', 
  authenticate, 
  authorize(['budgets:write']), 
  [
    body('clientId').notEmpty().withMessage('Cliente é obrigatório'),
    body('title').notEmpty().withMessage('Título do orçamento é obrigatório'),
    body('materials').isArray().withMessage('Materiais deve ser um array'),
    body('labor').isArray().withMessage('Mão de obra deve ser um array'),
    body('machines').isArray().withMessage('Máquinas deve ser um array'),
    body('marginPercentage').isNumeric().withMessage('Margem deve ser um número').isFloat({ min: 0, max: 100 }).withMessage('Margem deve estar entre 0 e 100'),
    body('validityDays').isNumeric().withMessage('Validade deve ser um número').isInt({ min: 1 }).withMessage('Validade deve ser pelo menos 1 dia'),
    validateRequest
  ], 
  createBudget
);

router.get('/', 
  authenticate, 
  authorize(['budgets:read']), 
  getBudgets
);

router.get('/stats', 
  authenticate, 
  authorize(['reports:read']), 
  getBudgetStats
);

router.get('/:id', 
  authenticate, 
  authorize(['budgets:read']), 
  getBudgetById
);

router.put('/:id', 
  authenticate, 
  authorize(['budgets:write']), 
  [
    body('clientId').optional().notEmpty().withMessage('Cliente não pode estar vazio'),
    body('title').optional().notEmpty().withMessage('Título não pode estar vazio'),
    body('materials').optional().isArray().withMessage('Materiais deve ser um array'),
    body('labor').optional().isArray().withMessage('Mão de obra deve ser um array'),
    body('machines').optional().isArray().withMessage('Máquinas deve ser um array'),
    body('marginPercentage').optional().isNumeric().withMessage('Margem deve ser um número').isFloat({ min: 0, max: 100 }).withMessage('Margem deve estar entre 0 e 100'),
    body('validityDays').optional().isNumeric().withMessage('Validade deve ser um número').isInt({ min: 1 }).withMessage('Validade deve ser pelo menos 1 dia'),
    body('status').optional().isIn(['draft', 'sent', 'approved', 'rejected', 'completed']).withMessage('Status inválido'),
    validateRequest
  ], 
  updateBudget
);

router.delete('/:id', 
  authenticate, 
  authorize(['budgets:delete']), 
  deleteBudget
);

export default router;
