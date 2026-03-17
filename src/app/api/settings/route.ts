import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET() {
  try {
    // Dados simulados de configurações
    const settings = {
      company: {
        name: "SORED Industrial",
        document: "12.345.678/0001-90",
        phone: "(11) 3456-7890",
        email: "contato@sored.com.br",
        address: {
          street: "Rua Industrial, 123",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234-567"
        }
      },
      pricing: {
        defaultMargin: 30,
        laborRatePerHour: 85.50,
        machineRatePerHour: 120.00,
        taxRate: 18
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        lowStockAlert: true,
        budgetExpiryAlert: true
      },
      system: {
        currency: "BRL",
        language: "pt-BR",
        timezone: "America/Sao_Paulo",
        dateFormat: "DD/MM/YYYY"
      }
    };

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simular atualização de configurações
    console.log('Configurações atualizadas:', body);
    
    return NextResponse.json({ 
      message: 'Configurações atualizadas com sucesso',
      settings: body
    });
  } catch (error: any) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}
