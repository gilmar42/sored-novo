import { NextRequest, NextResponse } from 'next/server';
import { getAuth, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { differenceInDays, isAfter } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    const tenantId = auth.tenant.id;

    // Buscar assinatura ativa ou mais recente
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        plan: null,
        status: 'none',
        isActive: false,
        isInTrial: false,
        daysLeft: 0,
        features: []
      });
    }

    const now = new Date();
    const isExpired = isAfter(now, subscription.endDate);
    const isActive = subscription.status === 'active' && !isExpired;
    const isInTrial = subscription.status === 'trial' && !isExpired;
    const daysLeft = differenceInDays(subscription.endDate, now);

    return NextResponse.json({
      hasSubscription: true,
      plan: subscription.plan,
      status: subscription.status,
      isActive,
      isInTrial,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
      features: subscription.features
    });

  } catch (error: any) {
    console.error('[Status da Assinatura] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}
