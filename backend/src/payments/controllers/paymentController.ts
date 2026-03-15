import { Request, Response } from 'express';
import paymentService from '../services/paymentService';
import mercadoPagoClient from '../services/mercadoPagoClient';
import logger from '../../utils/logger';

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, amount, currency = 'BRL', paymentMethod, description } = req.body;
    const userId = (req as any).user?.id || null;

    const result = await paymentService.createPayment({
      userId,
      orderId,
      amount,
      currency,
      paymentMethod,
      description
    });

    res.status(201).json(result);
  } catch (error: any) {
    logger.error('Erro ao criar pagamento', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPayment(id);

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    res.json(payment);
  } catch (error: any) {
    logger.error('Erro ao buscar pagamento', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const refundPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await paymentService.refundPayment(id);
    res.json({ message: 'Reembolso realizado com sucesso' });
  } catch (error: any) {
    logger.error('Erro ao reembolsar pagamento', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { 
      orderId, 
      amount, 
      description, 
      paymentMethod,
      payerEmail,
      payerFirstName,
      payerLastName,
      payerPhone
    } = req.body;
    let { returnUrl } = req.body;
    const userId = (req as any).user?.id || null;

    if (!returnUrl) {
      returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription?success=true`;
    }

    logger.info('Creating checkout session with body:', { ...req.body, resolvedReturnUrl: returnUrl });

    if (!mercadoPagoClient || !mercadoPagoClient.isConfigured()) {
      return res.status(503).json({ error: 'Mercado Pago não configurado' });
    }

    const notificationUrl = `${process.env.BASE_URL}/api/webhooks/mercadopago`;
    
    const preference = await mercadoPagoClient.createPaymentPreference({
      orderId,
      amount,
      description,
      returnUrl,
      notificationUrl,
      paymentMethod,
      payer: payerEmail ? {
        email: payerEmail,
        firstName: payerFirstName,
        lastName: payerLastName,
        phone: payerPhone
      } : undefined
    });

    // Salvar pagamento no banco
    const payment = await paymentService.createInternalPayment({
      userId,
      orderId,
      amount,
      currency: 'BRL',
      paymentMethod: (paymentMethod as any) || 'credit_card',
      description,
      preferenceId: preference.id!
    });

    const isSandbox = mercadoPagoClient.getPublicKey().startsWith('TEST-');

    res.json({
      paymentId: (payment as any)._id,
      preferenceId: preference.id,
      initPoint: isSandbox ? preference.sandbox_init_point : preference.init_point,
      sandbox: isSandbox,
      paymentMethod: paymentMethod || 'all'
    });
  } catch (error: any) {
    logger.error('Erro ao criar sessão de checkout', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const createPixPayment = async (req: Request, res: Response) => {
  try {
    logger.info('Iniciando criação de pagamento PIX');
    
    const { 
      orderId, 
      amount, 
      description, 
      payerEmail, 
      payerFirstName, 
      payerLastName, 
      payerPhone 
    } = req.body;
    
    const userId = (req as any).user?.id || null;
    const notificationUrl = `${process.env.BASE_URL}/api/webhooks/mercadopago`;

    logger.info('Dados do pagamento PIX', { orderId, amount, payerEmail });

    const payment = await mercadoPagoClient.createPixPayment({
      orderId,
      amount,
      description,
      payerEmail,
      payerFirstName,
      payerLastName,
      payerPhone,
      notificationUrl
    });

    logger.info('Pagamento PIX criado com sucesso', { paymentId: payment.id });

    // Salvar pagamento no banco
    const internalPayment = await paymentService.createInternalPayment({
      userId,
      orderId,
      amount,
      currency: 'BRL',
      paymentMethod: 'pix',
      description,
      preferenceId: payment.id!.toString()
    });
    logger.info('Pagamento interno criado', { paymentId: internalPayment._id });

    logger.info('Pagamento PIX processado com sucesso', { 
      paymentId: payment.id,
      status: payment.status,
      isTest: payment.id?.toString().startsWith('test_pix_')
    });

    // Log dos campos que serão enviados
    logger.info('Enviando resposta PIX', {
      paymentId: payment.id,
      status: payment.status,
      transactionAmount: payment.transaction_amount,
      dateOfExpiration: payment.date_of_expiration
    });

    try {
      res.json({
        paymentId: payment.id,
        status: payment.status,
        transactionAmount: payment.transaction_amount,
        dateOfExpiration: payment.date_of_expiration
      });
    } catch (responseError: any) {
      logger.error('Erro ao enviar resposta', { error: responseError.message });
      res.status(500).json({ error: 'Erro ao processar resposta' });
    }
  } catch (error: any) {
    logger.error('Erro ao criar pagamento PIX', { 
      error: error.message,
      stack: error.stack,
      details: error
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};

export const getPixQrCode = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    
    logger.info('Obtendo QR Code PIX', { paymentId });
    
    if (!mercadoPagoClient || !mercadoPagoClient.isConfigured()) {
      return res.status(503).json({ error: 'Mercado Pago não configurado' });
    }

    const qrCode = await mercadoPagoClient.getPixQrCode(paymentId);
    logger.info('QR Code PIX obtido com sucesso', { paymentId });
    res.json(qrCode);
  } catch (error: any) {
    logger.error('Erro ao obter QR Code PIX', { 
      error: error.message,
      stack: error.stack,
      details: error
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};

export const getPixStatus = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    
    if (!mercadoPagoClient || !mercadoPagoClient.isConfigured()) {
      return res.status(503).json({ error: 'Mercado Pago não configurado' });
    }

    const status = await mercadoPagoClient.getPixStatus(paymentId);
    res.json(status);
  } catch (error: any) {
    logger.error('Erro ao consultar status PIX', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const mongoose = require('mongoose');

    // 1. Se for um ID válido do MongoDB, buscar internamente primeiro
    if (mongoose.Types.ObjectId.isValid(paymentId)) {
      const internalPayment = await paymentService.getPayment(paymentId);
      
      if (internalPayment) {
        // Se já temos o ID real do Mercado Pago, consultar lá
        if (internalPayment.mercadoPagoPaymentId && mercadoPagoClient.isConfigured()) {
          try {
            const mpPayment = await mercadoPagoClient.getPayment(internalPayment.mercadoPagoPaymentId);
            return res.json(mpPayment);
          } catch (mpError) {
            logger.warn('Erro ao consultar id do MP, retornando status interno', { paymentId });
          }
        }
        
        // Mapear status interno
        const statusMap: { [key: string]: string } = {
          'pago': 'approved',
          'pendente': 'pending',
          'falhou': 'rejected',
          'cancelado': 'cancelled'
        };
        
        return res.json({
          id: internalPayment._id,
          status: statusMap[internalPayment.status] || 'pending',
          transaction_amount: internalPayment.amount,
          payment_method_id: internalPayment.paymentMethod
        });
      } else {
        // ID de MongoDB mas não encontrado na nossa base? 
        // Retornar pendente em vez de 500 para não travar o frontend
        return res.json({ id: paymentId, status: 'pending' });
      }
    }
    
    // 2. Se NÃO é um ObjectId, assumir que é um ID direto do Mercado Pago
    if (mercadoPagoClient && mercadoPagoClient.isConfigured()) {
      try {
        const payment = await mercadoPagoClient.getPayment(paymentId);
        return res.json(payment);
      } catch (mpError: any) {
        logger.error('Erro na consulta direta ao MP', { paymentId, error: mpError.message });
        return res.status(404).json({ error: 'Pagamento não encontrado no Mercado Pago' });
      }
    }

    res.status(503).json({ error: 'Mercado Pago não configurado' });
  } catch (error: any) {
    logger.error('Erro ao consultar status do pagamento', { error: error.message, paymentId: req.params.paymentId });
    res.status(200).json({ status: 'pending', id: req.params.paymentId }); // Falha silenciosa para o frontend
  }
};

export const getPublicKey = async (req: Request, res: Response) => {
  try {
    if (!mercadoPagoClient || !mercadoPagoClient.isConfigured()) {
      return res.status(503).json({ error: 'Mercado Pago não configurado' });
    }

    const publicKey = mercadoPagoClient.getPublicKey();
    res.json({ publicKey });
  } catch (error: any) {
    logger.error('Erro ao obter chave pública', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};