import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    const tenantId = auth.tenant.id;

    const labor = await prisma.labor.findMany({
      where: {
        tenantId,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedLabor = labor.map(l => ({
      ...l,
      _id: l.id
    }));

    return NextResponse.json(formattedLabor);
  } catch (error: any) {
    console.error('Erro ao buscar mão de obra:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar mão de obra' },
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
    
    const { name, hourlyRate, description } = body;

    const newLabor = await prisma.labor.create({
      data: {
        tenantId,
        name,
        hourlyRate: parseFloat(hourlyRate) || 0,
        description,
        isActive: true
      }
    });

    return NextResponse.json({
      ...newLabor,
      _id: newLabor.id
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar mão de obra:', error);
    return NextResponse.json(
      { error: 'Erro ao criar mão de obra' },
      { status: 500 }
    );
  }
}
