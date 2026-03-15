import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Client from '../models/Client';
import Material from '../models/Material';
import Labor from '../models/Labor';
import Machine from '../models/Machine';
import Budget from '../models/Budget';
import User from '../models/User';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

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
      Client.countDocuments({ tenantId: req.tenant._id, isActive: true }),
      Material.countDocuments({ tenantId: req.tenant._id, isActive: true }),
      Labor.countDocuments({ tenantId: req.tenant._id, isActive: true }),
      Machine.countDocuments({ tenantId: req.tenant._id, isActive: true }),
      Budget.countDocuments({ tenantId: req.tenant._id }),
      User.countDocuments({ tenantId: req.tenant._id, isActive: true }),
      Budget.aggregate([
        { $match: { tenantId: req.tenant._id } },
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
      Budget.find({ tenantId: req.tenant._id })
        .populate('clientId', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Budget.aggregate([
        { $match: { tenantId: req.tenant._id } },
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

    res.json({
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
  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getRecentActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;

    const [recentBudgets, recentClients] = await Promise.all([
      Budget.find({ tenantId: req.tenant._id })
        .populate('clientId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit),
      Client.find({ tenantId: req.tenant._id })
        .sort({ createdAt: -1 })
        .limit(limit)
    ]);

    const activities = [
      ...recentBudgets.map(budget => ({
        type: 'budget',
        id: budget._id,
        title: `Orçamento ${budget.number}`,
        description: budget.title,
        status: budget.status,
        createdAt: budget.createdAt,
        clientName: (budget.clientId as any).name
      })),
      ...recentClients.map(client => ({
        type: 'client',
        id: client._id,
        title: 'Novo Cliente',
        description: client.name,
        status: 'active',
        createdAt: client.createdAt,
        clientName: client.name
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
     .slice(0, limit);

    res.json({ activities });
  } catch (error) {
    console.error('Erro ao obter atividades recentes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getTopClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const topClients = await Budget.aggregate([
      { $match: { tenantId: req.tenant._id } },
      {
        $group: {
          _id: '$clientId',
          totalBudgets: { $sum: 1 },
          totalValue: { $sum: '$totalPrice' },
          avgBudgetValue: { $avg: '$totalPrice' }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' },
      {
        $project: {
          clientId: '$_id',
          clientName: '$client.name',
          clientEmail: '$client.email',
          totalBudgets: 1,
          totalValue: 1,
          avgBudgetValue: 1
        }
      }
    ]);

    res.json({ topClients });
  } catch (error) {
    console.error('Erro ao obter top clientes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
