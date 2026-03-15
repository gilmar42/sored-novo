import { NextResponse } from 'next/server';
import { getPlanConfig } from '@/models/Subscription';

export async function GET() {
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

    return NextResponse.json(plansData);
  } catch (error: any) {
    console.error('Erro ao buscar planos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
