import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    const tenantId = auth.tenant.id;

    const budgets = await prisma.budget.findMany({
      where: {
        tenantId
      },
      include: {
        client: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedBudgets = budgets.map(b => ({
      ...b,
      _id: b.id,
      clientName: b.client?.name || 'Cliente de Teste',
      totalPrice: b.totalValue, // Mapeando totalValue para totalPrice para compatibilidade
      validUntil: b.expiresAt
    }));

    return NextResponse.json(formattedBudgets);
  } catch (error: any) {
    console.error('Erro ao buscar orçamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar orçamentos' },
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
    
    const { 
      clientId, 
      title, 
      items, 
      totalValue, 
      totalPrice, 
      notes, 
      number, 
      expiresAt, 
      validUntil 
    } = body;

    // Se clientId não for um UUID válido ou não existir, precisamos de um fallback ou erro
    // Para simplificar, assumimos que o frontend envia IDs de clientes já existentes no Postgres
    
    const newBudget = await prisma.budget.create({
      data: {
        tenantId,
        clientId: clientId || '00000000-0000-0000-0000-000000000000', // Exemplo de ID nulo
        title,
        status: "draft",
        items: items || [],
        totalValue: totalValue || totalPrice || 0,
        notes,
        number: number || `ORC-${Date.now()}`,
        expiresAt: expiresAt || validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      include: {
        client: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({
      ...newBudget,
      _id: newBudget.id,
      clientName: newBudget.client?.name,
      totalPrice: newBudget.totalValue,
      validUntil: newBudget.expiresAt
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar orçamento' },
      { status: 500 }
    );
  }
}
