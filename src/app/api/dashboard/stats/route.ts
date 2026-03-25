import { NextRequest, NextResponse } from 'next/server';
import { getAuth, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    const tenantId = auth.tenant.id;

    // Buscando contagens básicas
    const [
      clientsCount,
      materialsCount,
      laborCount,
      machinesCount,
      budgetsCount,
      usersCount
    ] = await Promise.all([
      prisma.client.count({ where: { tenantId } }),
      prisma.material.count({ where: { tenantId } }),
      prisma.labor.count({ where: { tenantId } }),
      prisma.machine.count({ where: { tenantId } }),
      prisma.budget.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId } })
    ]);

    // Estatísticas de orçamentos por status
    const budgetStatsRaw = await prisma.budget.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
      _sum: { totalValue: true }
    });

    const statusMap = budgetStatsRaw.reduce((acc: Record<string, any>, curr: any) => {
      acc[curr.status] = {
        count: curr._count._all,
        sum: curr._sum.totalValue || 0
      };
      return acc;
    }, {});

    const totalValue = budgetStatsRaw.reduce((acc: number, curr: any) => acc + (curr._sum.totalValue || 0), 0);

    // Orçamentos recentes
    const recentBudgets = await prisma.budget.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        client: {
          select: { name: true }
        }
      }
    });

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    return NextResponse.json({
      overview: {
        totalClients: clientsCount,
        totalMaterials: materialsCount,
        totalLabor: laborCount,
        totalMachines: machinesCount,
        totalBudgets: budgetsCount,
        totalUsers: usersCount
      },
      budgetStats: {
        totalValue: totalValue,
        draftCount: statusMap['draft']?.count || 0,
        sentCount: statusMap['sent']?.count || 0,
        approvedCount: statusMap['approved']?.count || 0,
        rejectedCount: statusMap['rejected']?.count || 0,
        completedCount: statusMap['completed']?.count || 0,
        avgBudgetValue: budgetsCount > 0 ? (totalValue / budgetsCount) : 0
      },
      recentBudgets: recentBudgets.map((b: any) => ({
        ...b,
        _id: b.id,
        clientName: b.client?.name || 'Cliente de Teste',
        totalPrice: b.totalValue
      })),
      monthlyStats: monthNames.map((name, index) => ({
        month: name,
        value: index === new Date().getMonth() ? totalValue : 0 // Dados simples até termos mais histórico
      }))
    });
  } catch (error: any) {
    console.error('Erro ao obter estatísticas do dashboard:', error.message || error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
