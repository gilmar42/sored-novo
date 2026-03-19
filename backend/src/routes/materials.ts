import { Router } from 'express';
import { 
  createMaterial, 
  getMaterials, 
  getMaterialById, 
  updateMaterial, 
  deleteMaterial 
} from '../controllers/materialController';
import { authenticate, authorize } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = Router();

router.post('/', 
  authenticate, 
  authorize(['materials:write']), 
  [
    body('name').notEmpty().withMessage('Nome do material é obrigatório'),
    body('category').notEmpty().withMessage('Categoria é obrigatória'),
    body('unitOfMeasure').isIn(['kg', 'm', 'm²', 'm³', 'un', 'l', 'cm', 'cm²', 'cm³', 'ton']).withMessage('Unidade de medida inválida'),
    body('unitCost').isNumeric().withMessage('Custo unitário deve ser um número').isFloat({ min: 0 }).withMessage('Custo unitário não pode ser negativo'),
    body('itemType').optional().isIn(['material', 'component']).withMessage('Tipo de item inválido'),
    body('size').optional().isString().withMessage('Tamanho deve ser uma string'),
    validateRequest
  ], 
  createMaterial
);

router.get('/', 
  authenticate, 
  authorize(['materials:read']), 
  getMaterials
);

router.get('/:id', 
  authenticate, 
  authorize(['materials:read']), 
  getMaterialById
);

router.put('/:id', 
  authenticate, 
  authorize(['materials:write']), 
  [
    body('name').optional().notEmpty().withMessage('Nome do material não pode estar vazio'),
    body('category').optional().notEmpty().withMessage('Categoria não pode estar vazia'),
    body('unitOfMeasure').optional().isIn(['kg', 'm', 'm²', 'm³', 'un', 'l', 'cm', 'cm²', 'cm³', 'ton']).withMessage('Unidade de medida inválida'),
    body('unitCost').optional().isNumeric().withMessage('Custo unitário deve ser um número').isFloat({ min: 0 }).withMessage('Custo unitário não pode ser negativo'),
    body('itemType').optional().isIn(['material', 'component']).withMessage('Tipo de item inválido'),
    body('size').optional().isString().withMessage('Tamanho deve ser uma string'),
    validateRequest
  ], 
  updateMaterial
);

router.delete('/:id', 
  authenticate, 
  authorize(['materials:delete']), 
  deleteMaterial
);

export default router;
