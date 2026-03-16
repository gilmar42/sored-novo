import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dados simulados de máquinas
    const machines = [
      {
        _id: "1",
        name: "Torno CNC XYZ-2000",
        description: "Torno computadorizado para precisão",
        hourlyRate: 150.00,
        category: "Usinagem",
        isActive: true,
        createdAt: "2024-01-15T10:00:00.000Z"
      },
      {
        _id: "2",
        name: "Fresadora Digital F-500",
        description: "Fresadora CNC para moldes",
        hourlyRate: 180.00,
        category: "Usinagem",
        isActive: true,
        createdAt: "2024-02-20T14:30:00.000Z"
      },
      {
        _id: "3",
        name: "Prensa Hidráulica PH-300",
        description: "Prensa para conformação de metais",
        hourlyRate: 95.00,
        category: "Conformação",
        isActive: true,
        createdAt: "2024-03-10T09:15:00.000Z"
      }
    ];

    return NextResponse.json(machines);
  } catch (error: any) {
    console.error('Erro ao buscar máquinas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar máquinas' },
      { status: 500 }
    );
  }
}
