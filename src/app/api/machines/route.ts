import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    const tenantId = auth.tenant.id;

    const machines = await prisma.machine.findMany({
      where: {
        tenantId,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedMachines = machines.map(m => ({
      ...m,
      _id: m.id
    }));

    return NextResponse.json(formattedMachines);
  } catch (error: any) {
    console.error('Erro ao buscar máquinas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar máquinas' },
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

    const newMachine = await prisma.machine.create({
      data: {
        tenantId,
        name,
        hourlyRate: parseFloat(hourlyRate) || 0,
        description,
        isActive: true
      }
    });

    return NextResponse.json({
      ...newMachine,
      _id: newMachine.id
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar máquina:', error);
    return NextResponse.json(
      { error: 'Erro ao criar máquina' },
      { status: 500 }
    );
  }
}
