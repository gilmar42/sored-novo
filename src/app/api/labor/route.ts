import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dados simulados de mão de obra
    const labor = [
      {
        _id: "1",
        name: "Técnico de Usinagem",
        description: "Operador de máquinas CNC",
        hourlyRate: 75.50,
        category: "Produção",
        isActive: true,
        createdAt: "2024-01-15T10:00:00.000Z"
      },
      {
        _id: "2",
        name: "Mecânico Industrial",
        description: "Manutenção de equipamentos",
        hourlyRate: 68.00,
        category: "Manutenção",
        isActive: true,
        createdAt: "2024-02-20T14:30:00.000Z"
      },
      {
        _id: "3",
        name: "Engenheiro de Processos",
        description: "Otimização de produção",
        hourlyRate: 120.00,
        category: "Engenharia",
        isActive: true,
        createdAt: "2024-03-10T09:15:00.000Z"
      }
    ];

    return NextResponse.json(labor);
  } catch (error: any) {
    console.error('Erro ao buscar mão de obra:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar mão de obra' },
      { status: 500 }
    );
  }
}
