import mercadoPagoClient from './mercadoPagoClient';
import logger from '../../utils/logger';
import { buildMercadoPagoWebhookUrl } from '../../utils/publicUrls';
import prisma from '../../lib/prisma';
import { getPlanConfig } from '../../utils/planConfig';

class PaymentService {
  async createPayment(data: {
    userId?: string | null;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    description: string;
  }) {
    if (!mercadoPagoClient) {
      throw new Error('Mercado Pago não configurado');
    }

    let notificationUrl: string;
    try {
      notificationUrl = buildMercadoPagoWebhookUrl();
    } catch (error: any) {
      logger.error('Configuração inválida para webhook do Mercado Pago (createPayment)', {
        error: error?.message || String(error),
      });
      throw new Error(error?.message || 'Configuração inválida para webhook do Mercado Pago');
    }

    const preference = await mercadoPagoClient.createPreference({
      items: [{
        id: 'item',
        title: data.description,
        quantity: 1,
        currency_id: data.currency,
        unit_price: data.amount,
      }],
      notification_url: notificationUrl,
      external_reference: `order_${data.orderId}`,
    });

    const payment = await prisma.payment.create({
      data: {
        userId: data.userId || undefined,
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        preferenceId: preference.id,
        status: 'pendente',
      },
    });

    logger.info('Pagamento criado', { paymentId: payment.id, preferenceId: preference.id });

    return {
      paymentId: payment.id,
      checkoutUrl: preference.init_point,
    };
  }

  async createInternalPayment(data: {
    userId?: string | null;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    description: string;
    preferenceId?: string;
    mercadoPagoPaymentId?: string;
  }) {
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId || undefined,
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        preferenceId: data.preferenceId,
        mercadoPagoPaymentId: data.mercadoPagoPaymentId,
        status: 'pendente',
      },
    });

    logger.info('Pagamento interno criado para rastreamento', {
      paymentId: payment.id,
      preferenceId: data.preferenceId,
    });

    return payment;
  }

  async processWebhook(eventData: any) {
    const { type, data: eventPayload } = eventData;

    if (type !== 'payment') return;

    const paymentId = eventPayload.id;

    if (!mercadoPagoClient) {
      logger.error('Mercado Pago não configurado para processar webhook');
      return;
    }

    const mpPayment = await mercadoPagoClient.getPayment(paymentId.toString());
    const externalReference = mpPayment.external_reference;
    if (!externalReference) return;

    const orderId = externalReference.replace(/^order_/, '');
    const payment = await prisma.payment.findFirst({ where: { orderId } });

    if (!payment) {
      logger.warn('Pagamento não encontrado para webhook', { paymentId, orderId });
      return;
    }

    const statusMap: Record<string, string> = {
      approved: 'pago',
      pending: 'pendente',
      rejected: 'falhou',
      cancelled: 'cancelado',
    };

    const newStatus = mpPayment.status ? (statusMap[mpPayment.status] || 'pendente') : 'pendente';

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        mercadoPagoPaymentId: paymentId.toString(),
      },
    });

    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType: type,
        payload: eventData,
        processed: true,
      },
    });

    if (externalReference.startsWith('plan_') && payment.userId && newStatus === 'pago') {
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
      });

      if (user) {
        const planMatch = externalReference.match(/plan_([^_]+)_/);
        const planId = planMatch ? planMatch[1] : 'monthly';
        const planConfig = getPlanConfig(planId);
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + (planId === 'annual' ? 12 : 1));

        const existingSubscription = await prisma.subscription.findFirst({
          where: { tenantId: user.tenantId },
          orderBy: { createdAt: 'desc' },
        });

        const subscriptionData = {
          plan: planId,
          status: 'active',
          startDate: new Date(),
          endDate,
          nextBillingDate: endDate,
          mercadoPagoPaymentId: paymentId.toString(),
          amount: payment.amount,
          paymentMethod: payment.paymentMethod === 'pix' ? 'pix' : 'credit_card',
          features: planConfig.features,
        };

        if (existingSubscription) {
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: subscriptionData,
          });
        } else {
          await prisma.subscription.create({
            data: {
              tenantId: user.tenantId,
              ...subscriptionData,
            },
          });
        }

        logger.info('Assinatura ativada via webhook (plan_)', {
          tenantId: user.tenantId,
          plan: planId,
        });
      }
    } else {
      const budgetStatus = newStatus === 'pago' ? 'PAID' : newStatus === 'falhou' ? 'PAYMENT_FAILED' : null;
      if (budgetStatus) {
        await prisma.budget.update({
          where: { id: orderId },
          data: { status: budgetStatus },
        }).catch(() => undefined);
      }
    }

    logger.info('Webhook processado', { paymentId: payment.id, status: newStatus });
  }

  async processPreApprovalWebhook(eventData: any) {
    const { type, data } = eventData || {};
    
    if (type !== 'pre_approval' || !data?.id) {
      return;
    }

    const preApprovalId = data.id.toString();
    logger.info('Webhook de PreApproval recebido', { preApprovalId, eventType: eventData.action });

    const subscription = await prisma.subscription.findFirst({
      where: { mercadoPagoPreApprovalId: preApprovalId },
      include: { tenant: true },
    });

    if (!subscription) {
      logger.warn('PreApproval não encontrado no sistema', { preApprovalId });
      return;
    }

    // Atualizar status da assinatura baseado no evento
    if (eventData.action === 'pre_approval.authorized' || eventData.action === 'pre_approval.payment_created') {
      // Assinatura foi autorizada ou pagamento feito após o trial
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          trialCharged: true,
        },
      });

      logger.info('Assinatura ativada após trial', {
        subscriptionId: subscription.id,
        tenantId: subscription.tenantId,
        plan: subscription.plan,
      });
    } else if (eventData.action === 'pre_approval.expired' || eventData.action === 'pre_approval.cancelled') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'cancelled',
        },
      });

      logger.info('Assinatura cancelada/expirada', {
        subscriptionId: subscription.id,
        action: eventData.action,
      });
    }
  }

  async refundPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new Error('Pagamento não encontrado');
    }

    if (!payment.mercadoPagoPaymentId) {
      throw new Error('Pagamento não tem ID do Mercado Pago');
    }

    if (!mercadoPagoClient) {
      throw new Error('Mercado Pago não configurado');
    }

    await mercadoPagoClient.refundPayment(payment.mercadoPagoPaymentId);

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'cancelado' },
    });

    logger.info('Reembolso realizado', { paymentId });
  }

  async getPayment(paymentId: string) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });
  }
}

export default new PaymentService();
