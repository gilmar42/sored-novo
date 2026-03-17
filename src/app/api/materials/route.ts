import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET() {
  try {
    // Dados simulados de materiais
    const materials = [
      {
        _id: "1",
        name: "Aço Carbono 1020",
        code: "AC1020",
        description: "Chapa de aço carbono para usinagem",
        unit: "kg",
        costPerUnit: 8.50,
        supplier: "Metalúrgica Central",
        category: "Metais",
        stock: 1500,
        minStock: 100,
        isActive: true,
        createdAt: "2024-01-15T10:00:00.000Z"
      },
      {
        _id: "2",
        name: "Alumínio 6061",
        code: "AL6061",
        description: "Barra de alumínio para extrusão",
        unit: "kg",
        costPerUnit: 25.80,
        supplier: "Alumínio Brasil",
        category: "Metais",
        stock: 800,
        minStock: 50,
        isActive: true,
        createdAt: "2024-02-20T14:30:00.000Z"
      },
      {
        _id: "3",
        name: "Parafuso M12x50",
        code: "P1250",
        description: "Parafuso de fixação M12x50mm",
        unit: "un",
        costPerUnit: 2.35,
        supplier: "Fixações Industriais",
        category: "Fixadores",
        stock: 5000,
        minStock: 500,
        isActive: true,
        createdAt: "2024-03-10T09:15:00.000Z"
      },
      {
        _id: "4",
        name: "Tinta Industrial Epoxi",
        code: "TIEPOXI",
        description: "Tinta epoxi para proteção industrial",
        unit: "l",
        costPerUnit: 45.90,
        supplier: "Química Industrial",
        category: "Revestimentos",
        stock: 200,
        minStock: 20,
        isActive: true,
        createdAt: "2024-01-25T16:45:00.000Z"
      }
    ];

    return NextResponse.json(materials);
  } catch (error: any) {
    console.error('Erro ao buscar materiais:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar materiais' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simular criação de material
    const newMaterial = {
      _id: Date.now().toString(),
      ...body,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar material:', error);
    return NextResponse.json(
      { error: 'Erro ao criar material' },
      { status: 500 }
    );
  }
}
