import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import logger from '../utils/logger';

type AuthUser = {
  _id: string;
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date | null;
};

type AuthTenant = {
  _id: string;
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  settings: unknown;
};

export interface AuthRequest extends Request {
  user?: AuthUser;
  tenant?: AuthTenant;
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

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        logger.debug(`AUTH: usuário não encontrado/inativo (${decoded.userId})`);
        res.status(401).json({ message: 'Usuário não encontrado ou inativo' });
        return;
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: decoded.tenantId },
      });

      if (!tenant || tenant.status !== 'active') {
        logger.debug(`AUTH: tenant não encontrado/inativo (${decoded.tenantId})`);
        res.status(401).json({ message: 'Empresa não encontrada ou inativa' });
        return;
      }

      req.user = {
        _id: user.id,
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: Array.isArray(user.permissions) ? (user.permissions as string[]) : [],
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      };
      req.tenant = {
        _id: tenant.id,
        ...tenant,
      };

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
  } catch {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const authorize = (permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Usuário não autenticado' });
      return;
    }

    const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const hasPermission = permissions.some((permission) => userPermissions.includes(permission));

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
