import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import { getAuth, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    await dbConnect();
    const tenantId = auth.tenant._id;

    const subscription = await Subscription.findOne({ tenantId });

    if (!subscription) {
      return NextResponse.json({
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

    return NextResponse.json({
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
    console.error('Erro ao verificar status da assinatura:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
