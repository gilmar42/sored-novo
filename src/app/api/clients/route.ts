import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    const tenantId = auth.tenant.id;

    const clients = await prisma.client.findMany({
      where: {
        tenantId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { budgets: true }
        },
        budgets: {
          select: { totalValue: true }
        }
      }
    });

    // Transformando para o formato esperado pelo frontend (compatibilidade com MongoDB anterior)
    const formattedClients = clients.map(client => ({
      ...client,
      _id: client.id, // Mantendo _id para compatibilidade se o frontend ainda usar
      totalBudgets: client._count.budgets,
      totalValue: client.budgets.reduce((acc, budget) => acc + (budget.totalValue || 0), 0)
    }));

    return NextResponse.json(formattedClients);
  } catch (error: any) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
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
    
    const { name, email, phone, document, address } = body;

    const newClient = await prisma.client.create({
      data: {
        tenantId,
        name,
        email,
        phone,
        document,
        address: address || {},
        isActive: true
      }
    });

    return NextResponse.json({
      ...newClient,
      _id: newClient.id,
      totalBudgets: 0,
      totalValue: 0
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    );
  }
}
