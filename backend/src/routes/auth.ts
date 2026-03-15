import { Router } from 'express';
import { register, login, getProfile, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = Router();

router.post('/register', [
  body('tenantName').notEmpty().withMessage('Nome da empresa é obrigatório'),
  body('tenantEmail').trim().toLowerCase().isEmail().withMessage('Email da empresa inválido'),
  body('tenantDocument').optional({ checkFalsy: true }).trim(),
  body('userName').notEmpty().withMessage('Nome do usuário é obrigatório'),
  body('userEmail').trim().toLowerCase().isEmail().withMessage('Email do usuário inválido'),
  body('userPassword').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  validateRequest
], register);

router.post('/login', [
  body('email').trim().toLowerCase().isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
  validateRequest
], login);

router.get('/profile', authenticate, getProfile);

router.post('/logout', authenticate, logout);

export default router;
