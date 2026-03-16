import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dados simulados para o dashboard
    const stats = {
      overview: {
        totalClients: 12,
        totalMaterials: 45,
        totalLabor: 8,
        totalMachines: 6,
        totalBudgets: 23,
        totalUsers: 1
      },
      budgetStats: {
        totalValue: 125000,
        draftCount: 5,
        sentCount: 12,
        approvedCount: 6,
        rejectedCount: 0,
        completedCount: 0,
        avgBudgetValue: 5434.78
      },
      recentBudgets: [],
      monthlyStats: []
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
