import { Request, Response } from 'express';
import paymentService from '../payments/services/paymentService';
import logger from '../utils/logger';
import crypto from 'crypto';

const parseSignatureHeader = (headerValue: string) => {
  const parts = headerValue.split(',').map((p) => p.trim());
  const map: Record<string, string> = {};
  for (const part of parts) {
    const [key, ...rest] = part.split('=');
    if (!key || rest.length === 0) continue;
    map[key] = rest.join('=');
  }
  return { ts: map.ts, v1: map.v1 };
};

const safeEqualHex = (a: string, b: string) => {
  try {
    const aBuf = Buffer.from(a, 'hex');
    const bBuf = Buffer.from(b, 'hex');
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
};

const toLowerIfAlphaNumeric = (value: string) =>
  /^[0-9a-zA-Z]+$/.test(value) ? value.toLowerCase() : value;

const verifyMercadoPagoWebhook = (req: Request, webhookSecret: string) => {
  const signatureHeader = (req.headers['x-signature'] as string | undefined) || '';
  const requestId = (req.headers['x-request-id'] as string | undefined) || '';

  if (!signatureHeader || !requestId) {
    return { ok: false as const, reason: 'Missing signature headers' };
  }

  const { ts, v1 } = parseSignatureHeader(signatureHeader);
  if (!ts || !v1) {
    return { ok: false as const, reason: 'Invalid x-signature format' };
  }

  const tsNumber = Number(ts);
  if (!Number.isFinite(tsNumber)) {
    return { ok: false as const, reason: 'Invalid ts in x-signature' };
  }

  const toleranceMs = Number(process.env.MERCADO_PAGO_WEBHOOK_TOLERANCE_MS || 10 * 60 * 1000);
  if (Number.isFinite(toleranceMs) && toleranceMs > 0) {
    const ageMs = Math.abs(Date.now() - tsNumber);
    if (ageMs > toleranceMs) {
      return { ok: false as const, reason: 'Signature timestamp out of tolerance' };
    }
  }

  // Mercado Pago uses the ID from the URL query (data.id) to build the manifest.
  // Fallbacks are kept for compatibility with local tests and older formats.
  const queryId =
    (req.query['data.id'] as string | undefined) ||
    (req.query['id'] as string | undefined) ||
    (req.query['data_id'] as string | undefined);
  const bodyId = (req.body?.data?.id ?? req.body?.id) as string | number | undefined;
  const idRaw = queryId || (bodyId !== undefined ? String(bodyId) : '');

  if (!idRaw) {
    return { ok: false as const, reason: 'Missing webhook data.id' };
  }

  const id = toLowerIfAlphaNumeric(idRaw);
  const manifest = `id:${id};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');

  if (!safeEqualHex(expected, v1)) {
    return { ok: false as const, reason: 'Signature mismatch' };
  }

  return { ok: true as const };
};

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
      const result = verifyMercadoPagoWebhook(req, webhookSecret);
      if (!result.ok) {
        logger.warn('Webhook Mercado Pago rejeitado (assinatura inválida)', {
          reason: result.reason,
          requestId: req.headers['x-request-id'],
          hasSignature: !!req.headers['x-signature'],
        });
        return res.status(401).json({ error: 'Assinatura inválida' });
      }
    } else if (process.env.NODE_ENV === 'production') {
      logger.warn('MERCADO_PAGO_WEBHOOK_SECRET não configurado em produção; webhook sem validação de assinatura');
    }

    // Processar webhook de forma assíncrona
    setImmediate(() => {
      // Verificar se é um evento de PreApproval (assinatura com trial)
      if (eventData.type === 'pre_approval') {
        paymentService.processPreApprovalWebhook(eventData).catch((error) => {
          logger.error('Erro ao processar webhook de PreApproval', { error: error.message });
        });
      } else {
        paymentService.processWebhook(eventData).catch((error) => {
          logger.error('Erro ao processar webhook', { error: error.message });
        });
      }
    });

    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('Erro no webhook Mercado Pago', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
