import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET() {
  try {
    // Dados simulados de clientes
    const clients = [
      {
        _id: "1",
        name: "Indústria ABC Ltda",
        email: "contato@industriaabc.com.br",
        phone: "(11) 3456-7890",
        document: "12.345.678/0001-90",
        address: {
          street: "Rua Industrial, 123",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234-567"
        },
        isActive: true,
        createdAt: "2024-01-15T10:00:00.000Z",
        totalBudgets: 5,
        totalValue: 25000
      },
      {
        _id: "2",
        name: "Metalúrgica Soluções",
        email: "financeiro@metalurgicasolucoes.com.br",
        phone: "(11) 2345-6789",
        document: "98.765.432/0001-10",
        address: {
          street: "Av. Metalurgia, 456",
          city: "São Paulo",
          state: "SP",
          zipCode: "04567-890"
        },
        isActive: true,
        createdAt: "2024-02-20T14:30:00.000Z",
        totalBudgets: 3,
        totalValue: 15000
      },
      {
        _id: "3",
        name: "Componentes Industriais SA",
        email: "comercial@componentesindustriais.com.br",
        phone: "(11) 3456-7891",
        document: "45.678.901/0001-23",
        address: {
          street: "Rua dos Componentes, 789",
          city: "São Paulo",
          state: "SP",
          zipCode: "07890-123"
        },
        isActive: true,
        createdAt: "2024-03-10T09:15:00.000Z",
        totalBudgets: 8,
        totalValue: 42000
      }
    ];

    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simular criação de cliente
    const newClient = {
      _id: Date.now().toString(),
      ...body,
      isActive: true,
      createdAt: new Date().toISOString(),
      totalBudgets: 0,
      totalValue: 0
    };

    return NextResponse.json(newClient, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    );
  }
}
