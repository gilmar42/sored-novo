import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import Tenant, { ITenant } from '../models/Tenant';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

interface RegisterRequest extends Request {
  body: {
    tenantName: string;
    tenantEmail: string;
    tenantDocument: string;
    userName: string;
    userEmail: string;
    userPassword: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export const register = async (req: RegisterRequest, res: Response): Promise<void> => {
  try {
    const {
      tenantName,
      tenantEmail,
      tenantDocument,
      userName,
      userEmail,
      userPassword
    } = req.body;

    const normalizedTenantEmail = tenantEmail.trim().toLowerCase();
    const normalizedUserEmail = userEmail.trim().toLowerCase();

    const existingTenant = await Tenant.findOne({ email: normalizedTenantEmail });
    if (existingTenant) {
      res.status(400).json({ message: 'Empresa já cadastrada com este email' });
      return;
    }

    const existingUser = await User.findOne({ email: normalizedUserEmail });
    if (existingUser) {
      res.status(400).json({ message: 'Usuário já cadastrado com este email' });
      return;
    }

    const tenant = new Tenant({
      name: tenantName,
      email: normalizedTenantEmail,
      ...(tenantDocument && { document: tenantDocument }),
      plan: 'starter',
      status: 'active',
      settings: {
        defaultMargin: 30,
        currency: 'BRL',
        dateFormat: 'DD/MM/YYYY'
      }
    });

    await tenant.save();

    const user = new User({
      tenantId: tenant._id,
      name: userName,
      email: normalizedUserEmail,
      password: userPassword,
      role: 'admin',
      permissions: [
        'clients:read', 'clients:write', 'clients:delete',
        'materials:read', 'materials:write', 'materials:delete',
        'labor:read', 'labor:write', 'labor:delete',
        'machines:read', 'machines:write', 'machines:delete',
        'budgets:read', 'budgets:write', 'budgets:delete',
        'reports:read', 'settings:read', 'settings:write',
        'users:read', 'users:write', 'users:delete'
      ]
    });

    await user.save();

    const token = jwt.sign(
      { 
        userId: user._id, 
        tenantId: tenant._id 
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Empresa e usuário cadastrados com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        plan: tenant.plan,
        settings: tenant.settings
      }
    });
  } catch (error: any) {
    logger.error('Erro no registro', { error: error?.message });
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const login = async (req: LoginRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    logger.info('Tentativa de login', { email: normalizedEmail, ip: req.ip });

    const user = await User.findOne({ email: normalizedEmail }).select('+password').populate('tenantId');
    
    logger.debug('Usuário consultado', { 
      email: normalizedEmail, 
      found: !!user,
      isActive: user?.isActive 
    });

    if (!user) {
      logger.warn('Tentativa de login com usuário não encontrado', { email: normalizedEmail, ip: req.ip });
      res.status(401).json({ message: 'Usuário não encontrado' });
      return;
    }

    if (!user.isActive) {
      logger.warn('Tentativa de login com usuário inativo', { userId: user._id, email: normalizedEmail });
      res.status(401).json({ message: 'Sua conta de usuário está inativa' });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      logger.warn('Tentativa de login com senha incorreta', { userId: user._id, email: normalizedEmail, ip: req.ip });
      res.status(401).json({ message: 'Senha incorreta' });
      return;
    }

    logger.info('Login bem-sucedido', { userId: user._id, email: normalizedEmail });

    const tenant = user.tenantId as any as ITenant;
    
    console.log('Tenant:', tenant ? { id: tenant._id, name: tenant.name, status: tenant.status } : 'Nenhum tenant');

    if (!tenant || tenant.status !== 'active') {
      res.status(401).json({ message: 'Acesso negado: a empresa vinculada está inativa ou não foi encontrada' });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { 
        userId: user._id, 
        tenantId: tenant._id 
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        lastLogin: user.lastLogin
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        plan: tenant.plan,
        settings: tenant.settings
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.tenant) {
      res.status(401).json({ message: 'Usuário não autenticado' });
      return;
    }

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        permissions: req.user.permissions,
        lastLogin: req.user.lastLogin
      },
      tenant: {
        id: req.tenant._id,
        name: req.tenant.name,
        email: req.tenant.email,
        plan: req.tenant.plan,
        settings: req.tenant.settings
      }
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
