import Payment, { IPayment } from '../../models/Payment';
import PaymentEvent, { IPaymentEvent } from '../../models/PaymentEvent';
import Budget from '../../models/Budget';
import mercadoPagoClient from './mercadoPagoClient';
import logger from '../../utils/logger';

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
    
    // Criar preferência no Mercado Pago
    const preferenceData = {
      items: [{
        id: 'item',
        title: data.description,
        quantity: 1,
        currency_id: data.currency,
        unit_price: data.amount
      }],
      notification_url: `${process.env.BASE_URL}/api/webhooks/mercadopago`,
      external_reference: `order_${data.orderId}`
    };

    const preference = await mercadoPagoClient.createPreference(preferenceData);

    // Criar pagamento interno
    const payment = new Payment({
      userId: data.userId,
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      preferenceId: preference.id,
      status: 'pendente'
    });

    await payment.save();
    logger.info('Pagamento criado', { paymentId: payment._id, preferenceId: preference.id });

    return {
      paymentId: payment._id,
      checkoutUrl: preference.init_point
    };
  }

  async createInternalPayment(data: {
    userId?: string | null;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    description: string;
    preferenceId: string;
  }) {
    const payment = new Payment({
      userId: data.userId,
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      preferenceId: data.preferenceId,
      status: 'pendente'
    });

    await payment.save();
    logger.info('Pagamento interno criado para rastreamento', { paymentId: payment._id, preferenceId: data.preferenceId });
    return payment;
  }

  async processWebhook(eventData: any) {
    const { type, data: eventPayload } = eventData;

    if (type !== 'payment') return;

    const paymentId = eventPayload.id;

    // Registrar evento
    const event = new PaymentEvent({
      paymentId: null, // Will be set after finding payment
      eventType: type,
      payload: eventData
    });

    // Consultar pagamento no Mercado Pago
    if (!mercadoPagoClient) {
      logger.error('Mercado Pago não configurado para processar webhook');
      return;
    }
    
    const mpPayment = await mercadoPagoClient.getPayment(paymentId.toString());

    // Encontrar pagamento interno pela external_reference
    const externalReference = mpPayment.external_reference;
    if (!externalReference) return;
    const orderId = externalReference.replace('order_', '');

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      logger.warn('Pagamento não encontrado para webhook', { paymentId, orderId });
      return;
    }

    event.paymentId = payment._id as any;

    // Mapear status
    const statusMap: { [key: string]: string } = {
      approved: 'pago',
      pending: 'pendente',
      rejected: 'falhou',
      cancelled: 'cancelado'
    };

    const newStatus = mpPayment.status ? (statusMap[mpPayment.status] || 'pendente') : 'pendente';
    payment.status = newStatus as any;
    payment.mercadoPagoPaymentId = paymentId.toString();

    await payment.save();
    await event.save();

    // Atualizar pedido se pago
    const mongoose = require('mongoose');
    const Subscription = require('../../models/Subscription').default;
    
    if (externalReference.startsWith('subscription_')) {
      const subscriptionId = externalReference.replace('subscription_', '');
      if (mongoose.Types.ObjectId.isValid(subscriptionId)) {
        if (newStatus === 'pago') {
          // Deixar como o controller original faria se encontrasse subscription_
          const subToUpdate = await Subscription.findById(subscriptionId);
          if (subToUpdate) {
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + (subToUpdate.plan === 'annual' ? 12 : 1));
            
            subToUpdate.status = 'active';
            subToUpdate.startDate = new Date();
            subToUpdate.endDate = endDate;
            subToUpdate.nextBillingDate = endDate;
            subToUpdate.mercadoPagoPaymentId = paymentId.toString();
            await subToUpdate.save();
            logger.info('Assinatura ativada via webhook (subscription_)', { subscriptionId });
          }
        } else if (newStatus === 'falhou') {
          await Subscription.findByIdAndUpdate(subscriptionId, { status: 'inactive' });
        }
      }
    } else if (externalReference.startsWith('plan_')) {
      // Caso de pagamento genérico de plano (ex: SubscriptionPayment -> PaymentProcessor)
      if (payment && payment.userId && newStatus === 'pago') {
        const User = require('../../models/User').default;
        const user = await User.findById(payment.userId);
        
        if (user && user.tenantId) {
          const planMatch = externalReference.match(/plan_([^_]+)_/);
          const planId = planMatch ? planMatch[1] : 'monthly';
          
          // Buscar assinatura existente para o tenant
          let sub = await Subscription.findOne({ tenantId: user.tenantId });
          
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + (planId === 'annual' ? 12 : 1));
          
          const subData = {
            status: 'active',
            plan: planId,
            startDate: new Date(),
            endDate: endDate,
            nextBillingDate: endDate,
            mercadoPagoPaymentId: paymentId.toString(),
            amount: payment.amount,
            paymentMethod: payment.paymentMethod === 'pix' ? 'pix' : 'credit_card'
          };
          
          if (sub) {
            Object.assign(sub, subData);
            await sub.save();
          } else {
            // Se não existe, criar uma nova
            const { getPlanConfig } = require('../../models/Subscription');
            const planConfig = getPlanConfig(planId);
            sub = new Subscription({
              tenantId: user.tenantId,
              ...subData,
              features: planConfig.features
            });
            await sub.save();
          }
          logger.info('Assinatura ativada via webhook (plan_)', { tenantId: user.tenantId, plan: planId });
        }
      }
    } else if (mongoose.Types.ObjectId.isValid(orderId)) {
      if (newStatus === 'pago') {
        await Budget.findByIdAndUpdate(orderId, { status: 'PAID' });
        logger.info('Pedido confirmado após pagamento', { orderId });
      } else if (newStatus === 'falhou') {
        await Budget.findByIdAndUpdate(orderId, { status: 'PAYMENT_FAILED' });
      }
    } else {
      logger.info('Pagamento genérico processado (sem ação de negócio)', { orderId, newStatus });
    }

    logger.info('Webhook processado', { paymentId: payment._id, status: newStatus });
  }

  async refundPayment(paymentId: string) {
    const payment = await Payment.findById(paymentId);
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
    payment.status = 'cancelado';
    await payment.save();

    logger.info('Reembolso realizado', { paymentId });
  }

  async getPayment(paymentId: string) {
    return await Payment.findById(paymentId).populate('userId orderId');
  }
}

export default new PaymentService();