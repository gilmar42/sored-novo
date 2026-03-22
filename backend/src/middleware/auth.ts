import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import Tenant, { ITenant } from '../models/Tenant';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  user?: IUser;
  tenant?: ITenant;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug(`AUTH: header inválido ou nulo (${authHeader || 'null'})`);
      res.status(401).json({ message: 'Token não fornecido ou formato inválido' });
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; tenantId: string };
      
      const user = await User.findById(decoded.userId).select('+password');
      
      if (!user || !user.isActive) {
        logger.debug(`AUTH: usuário não encontrado/inativo (${decoded.userId})`);
        res.status(401).json({ message: 'Usuário não encontrado ou inativo' });
        return;
      }

      const tenant = await Tenant.findById(decoded.tenantId);
      
      if (!tenant || tenant.status !== 'active') {
        logger.debug(`AUTH: tenant não encontrado/inativo (${decoded.tenantId})`);
        res.status(401).json({ message: 'Empresa não encontrada ou inativa' });
        return;
      }

      req.user = user;
      req.tenant = tenant;
      
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: 'Token inválido' });
      } else if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: 'Token expirado' });
      } else {
        logger.error('AUTH: erro inesperado ao validar JWT', jwtError as any);
        res.status(500).json({ message: 'Erro na autenticação' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const authorize = (permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Usuário não autenticado' });
      return;
    }

    const userPermissions = req.user.permissions;
    const hasPermission = permissions.some(permission => userPermissions.includes(permission));

    if (!hasPermission) {
      res.status(403).json({ message: 'Permissão negada' });
      return;
    }

    next();
  };
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Usuário não autenticado' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Perfil de usuário não autorizado' });
      return;
    }

    next();
  };
};
