import { Request, Response } from 'express';
import Subscription, { getPlanConfig } from '../models/Subscription';
import Tenant from '../models/Tenant';
import logger from '../utils/logger';
import mercadoPagoClient from '../payments/services/mercadoPagoClient';

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { plan, paymentMethod, payerData } = req.body;
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;

    // Verificar se já existe uma assinatura ativa
    const existingSubscription = await Subscription.findOne({
      tenantId,
      status: { $in: ['active', 'trial'] }
    });

    if (existingSubscription) {
      return res.status(400).json({
        error: 'Você já possui uma assinatura ativa',
        currentPlan: existingSubscription.plan,
        status: existingSubscription.status
      });
    }

    // Obter configuração do plano
    const planConfig = getPlanConfig(plan);

    // Criar assinatura
    const subscription = new Subscription({
      tenantId,
      plan,
      status: 'trial',
      amount: planConfig.amount,
      paymentMethod,
      startDate: new Date(),
      endDate: new Date(Date.now() + planConfig.trialDays * 24 * 60 * 60 * 1000),
      nextBillingDate: new Date(Date.now() + planConfig.trialDays * 24 * 60 * 60 * 1000),
      trialDaysUsed: 0,
      trialDaysTotal: planConfig.trialDays,
      features: planConfig.features
    });

    await subscription.save();

    // Se plano gratuito (starter), apenas salvar
    if (plan === 'starter' || planConfig.amount === 0) {
      logger.info('Assinatura gratuita criada', { tenantId, plan });
      return res.status(201).json({
        subscription,
        message: 'Assinatura criada com sucesso'
      });
    }

    // Para planos pagos, criar pagamento no Mercado Pago
    if (mercadoPagoClient && mercadoPagoClient.isConfigured()) {
      const notificationUrl = `${process.env.BASE_URL}/api/webhooks/mercadopago`;
      
      let payment;
      
      if (paymentMethod === 'pix') {
        // Criar pagamento PIX
        payment = await mercadoPagoClient.createPixPayment({
          orderId: `subscription_${subscription._id}`,
          amount: planConfig.amount,
          description: `Assinatura ${plan} - SORED`,
          payerEmail: payerData.email,
          payerFirstName: payerData.firstName,
          payerLastName: payerData.lastName,
          payerPhone: payerData.phone,
          notificationUrl
        });
      } else {
        // Criar preferência para cartão
        const preference = await mercadoPagoClient.createPaymentPreference({
          orderId: `subscription_${subscription._id}`,
          amount: planConfig.amount,
          description: `Assinatura ${plan} - SORED`,
          returnUrl: `${process.env.FRONTEND_URL}/subscription/success`,
          notificationUrl,
          paymentMethod: paymentMethod === 'credit_card' ? 'credit_card' : undefined
        });
        
        payment = preference;
      }

      // Atualizar assinatura com IDs do Mercado Pago
      if (payment.id) {
        subscription.mercadoPagoPaymentId = payment.id.toString();
        await subscription.save();
      }

      logger.info('Assinatura paga criada', { 
        tenantId, 
        plan, 
        paymentId: payment.id,
        paymentMethod 
      });

      return res.status(201).json({
        subscription,
        payment,
        message: 'Assinatura criada. Aguardando pagamento.'
      });
    } else {
      // Mercado Pago não configurado
      logger.warn('Mercado Pago não configurado para assinatura paga', { tenantId, plan });
      return res.status(503).json({
        error: 'Sistema de pagamento não disponível',
        subscription,
        message: 'Assinatura criada, mas pagamento não pode ser processado'
      });
    }

  } catch (error: any) {
    logger.error('Erro ao criar assinatura', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getSubscription = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const subscription = await Subscription.findOne({ tenantId })
      .populate('tenantId', 'name email');

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Atualizar dias de trial se estiver em trial
    if (subscription.status === 'trial') {
      const now = new Date();
      const daysSinceStart = Math.floor((now.getTime() - subscription.startDate.getTime()) / (1000 * 60 * 60 * 24));
      subscription.trialDaysUsed = Math.min(daysSinceStart, subscription.trialDaysTotal);
      
      // Se o trial acabou, mudar status para inactive
      if (subscription.trialDaysUsed >= subscription.trialDaysTotal && subscription.status === 'trial') {
        subscription.status = 'inactive';
      }
      
      await subscription.save();
    }

    res.json(subscription);
  } catch (error: any) {
    logger.error('Erro ao buscar assinatura', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const { plan } = req.body;
    const tenantId = (req as any).user.tenantId;

    const subscription = await Subscription.findOne({ tenantId });

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Obter configuração do novo plano
    const planConfig = getPlanConfig(plan);

    // Atualizar assinatura
    subscription.plan = plan;
    subscription.amount = planConfig.amount;
    subscription.features = planConfig.features;
    subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 dias
    subscription.nextBillingDate = subscription.endDate;

    await subscription.save();

    logger.info('Assinatura atualizada', { tenantId, oldPlan: subscription.plan, newPlan: plan });

    res.json({
      subscription,
      message: 'Assinatura atualizada com sucesso'
    });
  } catch (error: any) {
    logger.error('Erro ao atualizar assinatura', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const subscription = await Subscription.findOne({ tenantId });

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    subscription.endDate = new Date(); // Finalizar imediatamente

    await subscription.save();

    logger.info('Assinatura cancelada', { tenantId, plan: subscription.plan });

    res.json({
      message: 'Assinatura cancelada com sucesso',
      endDate: subscription.endDate
    });
  } catch (error: any) {
    logger.error('Erro ao cancelar assinatura', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    const plans = ['monthly', 'annual'];
    
    const plansData = plans.map(plan => {
      const config = getPlanConfig(plan);
      const planNames: { [key: string]: string } = {
        'monthly': 'Mensal',
        'annual': 'Anual'
      };
      return {
        id: plan,
        name: planNames[plan] || plan.charAt(0).toUpperCase() + plan.slice(1),
        price: config.amount,
        currency: 'BRL',
        period: plan === 'annual' ? 'year' : 'month',
        trialDays: config.trialDays,
        features: config.features,
        savings: plan === 'annual' ? 'Economia de R$ 100 no ano' : null,
        popular: plan === 'annual'
      };
    });

    res.json(plansData);
  } catch (error: any) {
    logger.error('Erro ao buscar planos', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant não identificado' });
    }

    const subscription = await Subscription.findOne({ tenantId });

    if (!subscription) {
      return res.json({
        hasSubscription: false,
        plan: null,
        status: null,
        isActive: false,
        isInTrial: false,
        daysLeft: 0,
        features: null
      });
    }

    // Calcular dias restantes
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Verificar se está ativo (considerando trial ou active)
    const isActive = subscription.status === 'active' || (subscription.status === 'trial' && daysLeft > 0);

    res.json({
      hasSubscription: true,
      plan: subscription.plan,
      status: subscription.status,
      isActive: isActive,
      isInTrial: subscription.status === 'trial',
      daysLeft: daysLeft,
      features: subscription.features,
      nextBillingDate: subscription.nextBillingDate
    });
  } catch (error: any) {
    logger.error('Erro ao verificar status da assinatura', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
