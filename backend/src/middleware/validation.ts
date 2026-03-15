import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: (error as any).value
    }));
    
    // Filtra erros de campos opcionais que estão vazios
    const filteredErrors = errorMessages.filter(error => {
      // Remove erros do campo tenantDocument se estiver vazio ou não existir
      if (error.field === 'tenantDocument') {
        return false;
      }
      return true;
    });
    
    if (filteredErrors.length === 0) {
      next();
      return;
    }
    
    res.status(400).json({
      message: 'Dados inválidos',
      errors: filteredErrors
    });
    return;
  }
  
  next();
};
