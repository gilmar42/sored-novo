import { Router } from 'express';
import { handleMercadoPagoWebhook } from '../webhooks/mercadoPagoWebhookHandler';

const router = Router();

// Webhook do Mercado Pago - não requer autenticação
router.post('/mercadopago', handleMercadoPagoWebhook);

export default router;