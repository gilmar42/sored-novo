import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dados simulados de orçamentos
    const budgets = [
      {
        _id: "1",
        clientId: "1",
        clientName: "Indústria ABC Ltda",
        title: "Orçamento de Máquinas Industriais",
        description: "Fornecimento e instalação de equipamentos",
        status: "approved",
        totalPrice: 25000,
        validUntil: "2024-04-15T23:59:59.000Z",
        createdAt: "2024-03-01T10:00:00.000Z",
        items: [
          {
            name: "Torno CNC",
            quantity: 1,
            unitPrice: 15000,
            totalPrice: 15000
          },
          {
            name: "Fresadora Digital",
            quantity: 1,
            unitPrice: 10000,
            totalPrice: 10000
          }
        ]
      },
      {
        _id: "2",
        clientId: "2",
        clientName: "Metalúrgica Soluções",
        title: "Orçamento de Matérias-Primas",
        description: "Suprimento de materiais para produção",
        status: "sent",
        totalPrice: 15000,
        validUntil: "2024-04-20T23:59:59.000Z",
        createdAt: "2024-03-10T14:30:00.000Z",
        items: [
          {
            name: "Aço Carbono 1020",
            quantity: 500,
            unitPrice: 8.50,
            totalPrice: 4250
          },
          {
            name: "Alumínio 6061",
            quantity: 300,
            unitPrice: 25.80,
            totalPrice: 7740
          },
          {
            name: "Tinta Industrial Epoxi",
            quantity: 50,
            unitPrice: 45.90,
            totalPrice: 2295
          }
        ]
      },
      {
        _id: "3",
        clientId: "3",
        clientName: "Componentes Industriais SA",
        title: "Orçamento de Manutenção",
        description: "Serviços de manutenção preventiva",
        status: "draft",
        totalPrice: 8500,
        validUntil: "2024-05-01T23:59:59.000Z",
        createdAt: "2024-03-15T09:15:00.000Z",
        items: [
          {
            name: "Mão de Obra - Técnico",
            quantity: 40,
            unitPrice: 150,
            totalPrice: 6000
          },
          {
            name: "Peças de Reposição",
            quantity: 1,
            unitPrice: 2500,
            totalPrice: 2500
          }
        ]
      }
    ];

    return NextResponse.json(budgets);
  } catch (error: any) {
    console.error('Erro ao buscar orçamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar orçamentos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simular criação de orçamento
    const newBudget = {
      _id: Date.now().toString(),
      ...body,
      status: "draft",
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
    };

    return NextResponse.json(newBudget, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar orçamento' },
      { status: 500 }
    );
  }
}
