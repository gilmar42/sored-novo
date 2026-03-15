import { NextRequest, NextResponse } from 'next/server';
import { getAuth, unauthorized } from '@/lib/auth';
import Client from '@/models/Client';
import Material from '@/models/Material';
import Labor from '@/models/Labor';
import Machine from '@/models/Machine';
import Budget from '@/models/Budget';
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    const tenantId = auth.tenant._id;

    const [
      totalClients,
      totalMaterials,
      totalLabor,
      totalMachines,
      totalBudgets,
      totalUsers,
      budgetStats,
      recentBudgets,
      monthlyStats
    ] = await Promise.all([
      Client.countDocuments({ tenantId, isActive: true }),
      Material.countDocuments({ tenantId, isActive: true }),
      Labor.countDocuments({ tenantId, isActive: true }),
      Machine.countDocuments({ tenantId, isActive: true }),
      Budget.countDocuments({ tenantId }),
      User.countDocuments({ tenantId, isActive: true }),
      Budget.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$totalPrice' },
            draftCount: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
            sentCount: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
            approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            avgBudgetValue: { $avg: '$totalPrice' }
          }
        }
      ]),
      Budget.find({ tenantId })
        .populate('clientId', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Budget.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            totalValue: { $sum: '$totalPrice' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
    ]);

    const stats = budgetStats[0] || {
      totalValue: 0,
      draftCount: 0,
      sentCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      completedCount: 0,
      avgBudgetValue: 0
    };

    return NextResponse.json({
      overview: {
        totalClients,
        totalMaterials,
        totalLabor,
        totalMachines,
        totalBudgets,
        totalUsers
      },
      budgetStats: stats,
      recentBudgets,
      monthlyStats: monthlyStats.map(stat => ({
        month: `${stat._id.month.toString().padStart(2, '0')}/${stat._id.year}`,
        count: stat.count,
        totalValue: stat.totalValue
      }))
    });
  } catch (error: any) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
