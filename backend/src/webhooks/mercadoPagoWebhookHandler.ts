import { Request, Response } from 'express';
import paymentService from '../payments/services/paymentService';
import logger from '../utils/logger';

export const handleMercadoPagoWebhook = async (req: Request, res: Response) => {
  try {
    const eventData = req.body;

    // Validações básicas
    if (!eventData.type || !eventData.data) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    // Verificar assinatura se configurada
    const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-signature'] as string;
      // Implementar verificação de assinatura se necessário
    }

    // Processar webhook de forma assíncrona
    setImmediate(() => {
      paymentService.processWebhook(eventData).catch((error) => {
        logger.error('Erro ao processar webhook', { error: error.message });
      });
    });

    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('Erro no webhook Mercado Pago', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};