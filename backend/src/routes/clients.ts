import { Router } from 'express';
import { 
  createClient, 
  getClients, 
  getClientById, 
  updateClient, 
  deleteClient 
} from '../controllers/clientController';
import { authenticate, authorize } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = Router();

router.post('/', 
  authenticate, 
  authorize(['clients:write']), 
  [
    body('name').notEmpty().withMessage('Nome do cliente é obrigatório'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('phone').optional().notEmpty().withMessage('Telefone não pode estar vazio'),
    body('document').optional().notEmpty().withMessage('Documento não pode estar vazio'),
    validateRequest
  ], 
  createClient
);

router.get('/', 
  // Temporariamente remover autenticação para teste
  // authenticate, 
  // authorize(['clients:read']), 
  getClients
);

router.get('/:id', 
  authenticate, 
  authorize(['clients:read']), 
  getClientById
);

router.put('/:id', 
  authenticate, 
  authorize(['clients:write']), 
  [
    body('name').optional().notEmpty().withMessage('Nome do cliente não pode estar vazio'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('phone').optional().notEmpty().withMessage('Telefone não pode estar vazio'),
    body('document').optional().notEmpty().withMessage('Documento não pode estar vazio'),
    validateRequest
  ], 
  updateClient
);

router.delete('/:id', 
  authenticate, 
  authorize(['clients:delete']), 
  deleteClient
);

export default router;
