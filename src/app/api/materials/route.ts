import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    const tenantId = auth.tenant.id;

    const materials = await prisma.material.findMany({
      where: {
        tenantId,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedMaterials = materials.map(m => ({
      ...m,
      _id: m.id,
      costPerUnit: m.cost // Mapeando cost para costPerUnit para manter compatibilidade com frontend
    }));

    return NextResponse.json(formattedMaterials);
  } catch (error: any) {
    console.error('Erro ao buscar materiais:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar materiais' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    const tenantId = auth.tenant.id;
    const body = await req.json();
    
    const { name, category, unit, cost, description, costPerUnit } = body;

    const newMaterial = await prisma.material.create({
      data: {
        tenantId,
        name,
        category,
        unit,
        cost: cost || costPerUnit || 0,
        description,
        isActive: true
      }
    });

    return NextResponse.json({
      ...newMaterial,
      _id: newMaterial.id,
      costPerUnit: newMaterial.cost
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar material:', error);
    return NextResponse.json(
      { error: 'Erro ao criar material' },
      { status: 500 }
    );
  }
}
