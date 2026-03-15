import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Payment from '@/models/Payment';
import PaymentEvent from '@/models/PaymentEvent';
import Budget from '@/models/Budget';
import Subscription, { getPlanConfig } from '@/models/Subscription';
import User from '@/models/User';
import mercadoPagoClient from '@/lib/mercadoPago';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const eventData = await req.json();
    const { type, data: eventPayload } = eventData;

    if (type !== 'payment') {
      return NextResponse.json({ received: true });
    }

    const paymentId = eventPayload.id;

    // Registrar evento
    const event = new PaymentEvent({
      paymentId: null,
      eventType: type,
      payload: eventData
    });

    if (!mercadoPagoClient.isConfigured()) {
      console.error('Mercado Pago não configurado para processar webhook');
      return NextResponse.json({ error: 'Mercado Pago not configured' }, { status: 503 });
    }
    
    const mpPayment = await mercadoPagoClient.getPayment(paymentId.toString());

    // Encontrar pagamento interno pela external_reference
    const externalReference = mpPayment.external_reference;
    if (!externalReference) {
      return NextResponse.json({ received: true });
    }

    const orderId = externalReference.replace('order_', '');
    const payment = await Payment.findOne({ orderId });
    
    if (payment) {
      event.paymentId = payment._id;
    }

    // Mapear status
    const statusMap: { [key: string]: string } = {
      approved: 'pago',
      pending: 'pendente',
      rejected: 'falhou',
      cancelled: 'cancelado'
    };

    const newStatus = mpPayment.status ? (statusMap[mpPayment.status] || 'pendente') : 'pendente';
    
    if (payment) {
      payment.status = newStatus;
      payment.mercadoPagoPaymentId = paymentId.toString();
      await payment.save();
    }
    
    await event.save();

    // Lógica de negócio baseada na external_reference
    if (externalReference.startsWith('subscription_')) {
      const subscriptionId = externalReference.replace('subscription_', '');
      if (newStatus === 'pago') {
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
        }
      } else if (newStatus === 'falhou') {
        await Subscription.findByIdAndUpdate(subscriptionId, { status: 'inactive' });
      }
    } else if (externalReference.startsWith('plan_')) {
      if (payment && payment.userId && newStatus === 'pago') {
        const user = await User.findById(payment.userId);
        if (user && user.tenantId) {
          const planMatch = externalReference.match(/plan_([^_]+)_/);
          const planId = planMatch ? planMatch[1] : 'monthly';
          
          let sub = await Subscription.findOne({ tenantId: user.tenantId });
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + (planId === 'annual' ? 12 : 1));
          
          const planConfig = getPlanConfig(planId);
          const subData = {
            status: 'active',
            plan: planId,
            startDate: new Date(),
            endDate: endDate,
            nextBillingDate: endDate,
            mercadoPagoPaymentId: paymentId.toString(),
            amount: payment.amount,
            paymentMethod: payment.paymentMethod === 'pix' ? 'pix' : 'credit_card',
            features: planConfig.features
          };
          
          if (sub) {
            Object.assign(sub, subData);
            await sub.save();
          } else {
            sub = new Subscription({
              tenantId: user.tenantId,
              ...subData
            });
            await sub.save();
          }
        }
      }
    } else if (orderId && orderId.length === 24) { // MongoDB ID check fallback
       if (newStatus === 'pago') {
        await Budget.findByIdAndUpdate(orderId, { status: 'PAID' });
      } else if (newStatus === 'falhou') {
        await Budget.findByIdAndUpdate(orderId, { status: 'PAYMENT_FAILED' });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro no webhook do Mercado Pago:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
