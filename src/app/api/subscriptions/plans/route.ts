import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sharedFeatures = {
      maxUsers: 10,
      maxProjects: 9999,
      maxMaterials: 99999,
      apiAccess: true,
      advancedReports: true,
      prioritySupport: true,
      customBranding: true,
      dataExport: true
    };

    const sharedHighlights = [
      'Acesso completo ao sistema durante o período de teste',
      '5 dias grátis para configurar e usar a plataforma',
      'Cobrança automática ao final do teste',
      'Cancelamento simples antes da cobrança',
    ];

    const plansData = [
      {
        id: 'monthly',
        name: 'Plano Mensal',
        price: 97,
        currency: 'BRL',
        period: 'month',
        trialDays: 5,
        features: sharedFeatures,
        highlights: sharedHighlights,
        billingMode: 'automatic_renewal',
        savings: null,
        popular: false
      },
      {
        id: 'annual',
        name: 'Plano Anual',
        price: 997,
        currency: 'BRL',
        period: 'year',
        trialDays: 5,
        features: sharedFeatures,
        highlights: sharedHighlights,
        billingMode: 'automatic_renewal',
        savings: 'Economia de R$ 167 no ano',
        popular: true
      }
    ];

    return NextResponse.json(plansData);
  } catch (error: any) {
    console.error('Erro ao buscar planos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
