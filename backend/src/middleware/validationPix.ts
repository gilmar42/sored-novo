import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validatePixRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    return res.status(400).json({
      error: 'Dados inválidos',
      errors: errorMessages
    });
  }

  next();
};

export const validatePixPayment = [
  // Validação dos campos obrigatórios para pagamento PIX
  (req: Request, res: Response, next: NextFunction) => {
    const { orderId, amount, description, payerEmail, payerFirstName, payerLastName, payerPhone } = req.body;

    const errors = [];

    // Validação do orderId
    if (!orderId || typeof orderId !== 'string' || orderId.trim().length === 0) {
      errors.push({ field: 'orderId', message: 'ID do pedido é obrigatório' });
    }

    // Validação do amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      errors.push({ field: 'amount', message: 'Valor do pagamento é obrigatório e deve ser maior que zero' });
    }

    // Validação do description
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      errors.push({ field: 'description', message: 'Descrição do pagamento é obrigatória' });
    }

    // Validação do email do pagador
    if (!payerEmail || typeof payerEmail !== 'string') {
      errors.push({ field: 'payerEmail', message: 'Email do pagador é obrigatório' });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(payerEmail)) {
        errors.push({ field: 'payerEmail', message: 'Email do pagador é inválido' });
      }
    }

    // Validação do nome do pagador
    if (!payerFirstName || typeof payerFirstName !== 'string' || payerFirstName.trim().length === 0) {
      errors.push({ field: 'payerFirstName', message: 'Primeiro nome do pagador é obrigatório' });
    }

    if (!payerLastName || typeof payerLastName !== 'string' || payerLastName.trim().length === 0) {
      errors.push({ field: 'payerLastName', message: 'Sobrenome do pagador é obrigatório' });
    }

    // Validação do telefone do pagador
    if (!payerPhone || typeof payerPhone !== 'string') {
      errors.push({ field: 'payerPhone', message: 'Telefone do pagador é obrigatório' });
    } else {
      // Remover caracteres não numéricos
      const cleanPhone = payerPhone.replace(/\D/g, '');
      
      // Validar formato do telefone (10 ou 11 dígitos)
      if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
        errors.push({ field: 'payerPhone', message: 'Telefone deve ter 10 ou 11 dígitos' });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Dados inválidos',
        errors
      });
    }

    // Formatar telefone para armazenar apenas números
    req.body.payerPhone = req.body.payerPhone.replace(/\D/g, '');

    next();
  }
];

export const validatePixStatus = [
  // Validação do paymentId para consulta de status
  (req: Request, res: Response, next: NextFunction) => {
    const { paymentId } = req.params;

    if (!paymentId || typeof paymentId !== 'string' || paymentId.trim().length === 0) {
      return res.status(400).json({
        error: 'ID do pagamento é obrigatório'
      });
    }

    next();
  }
];
