import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const plansData = [
      {
        id: 'monthly',
        name: 'Plano Mensal',
        price: 97,
        currency: 'BRL',
        period: 'month',
        trialDays: 5,
        features: {
          maxUsers: 5,
          maxProjects: 100,
          maxMaterials: 1000,
          apiAccess: true,
          advancedReports: true,
          prioritySupport: false,
          customBranding: false,
          dataExport: true
        },
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
        features: {
          maxUsers: 10,
          maxProjects: 9999,
          maxMaterials: 99999,
          apiAccess: true,
          advancedReports: true,
          prioritySupport: true,
          customBranding: true,
          dataExport: true
        },
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
