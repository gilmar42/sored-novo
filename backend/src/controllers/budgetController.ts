import { Response } from 'express';
import Budget, { IBudget } from '../models/Budget';
import Client from '../models/Client';
import Material from '../models/Material';
import Labor from '../models/Labor';
import Machine from '../models/Machine';
import { AuthRequest } from '../middleware/auth';

interface CreateBudgetRequest extends AuthRequest {
  body: {
    clientId: string;
    title: string;
    description?: string;
    materials: Array<{
      materialId: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }>;
    labor: Array<{
      laborId: string;
      hours: number;
      costPerHour: number;
      totalCost: number;
    }>;
    machines: Array<{
      machineId: string;
      hours: number;
      costPerHour: number;
      totalCost: number;
    }>;
    freightCost?: number;
    additionalCosts?: number;
    marginPercentage: number;
    validityDays: number;
    observations?: string;
  };
}

interface UpdateBudgetRequest extends AuthRequest {
  body: {
    clientId?: string;
    title?: string;
    description?: string;
    materials?: Array<{
      materialId: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }>;
    labor?: Array<{
      laborId: string;
      hours: number;
      costPerHour: number;
      totalCost: number;
    }>;
    machines?: Array<{
      machineId: string;
      hours: number;
      costPerHour: number;
      totalCost: number;
    }>;
    freightCost?: number;
    additionalCosts?: number;
    marginPercentage?: number;
    validityDays?: number;
    observations?: string;
    status?: 'draft' | 'sent' | 'approved' | 'rejected' | 'completed';
  };
}

export const createBudget = async (req: CreateBudgetRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const {
      clientId,
      title,
      description,
      materials,
      labor,
      machines,
      freightCost,
      additionalCosts,
      marginPercentage,
      validityDays,
      observations
    } = req.body;

    const client = await Client.findOne({ _id: clientId, tenantId: req.tenant._id });
    if (!client) {
      res.status(400).json({ message: 'Cliente não encontrado' });
      return;
    }

    // Generate next budget number scoped by tenant, ordering by creation date
    const generateBudgetNumber = async (suffix = ''): Promise<string> => {
      const lastBudget = await Budget.findOne({ tenantId: req.tenant!._id })
        .sort({ createdAt: -1 })
        .select('number');
      let nextNumber = 1;
      if (lastBudget && lastBudget.number) {
        const match = lastBudget.number.match(/(\d+)(-\w+)?$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      return `BUD-${String(nextNumber).padStart(6, '0')}${suffix}`;
    };

    let budgetNumber = await generateBudgetNumber();

    // Check for unique conflict and retry with timestamp suffix
    const existing = await Budget.findOne({ number: budgetNumber });
    if (existing) {
      budgetNumber = await generateBudgetNumber(`-${Date.now()}`);
    }

    const budget = new Budget({
      tenantId: req.tenant._id,
      clientId,
      number: budgetNumber,
      title,
      description,
      materials,
      labor,
      machines,
      freightCost,
      additionalCosts,
      marginPercentage,
      validityDays,
      observations
    });

    await budget.save();

    const populatedBudget = await Budget.findById(budget._id)
      .populate('clientId', 'name email phone document')
      .populate('materials.materialId', 'name unitOfMeasure')
      .populate('labor.laborId', 'name')
      .populate('machines.machineId', 'name');

    res.status(201).json({
      message: 'Orçamento criado com sucesso',
      budget: populatedBudget
    });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};


export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as string || '';
    const clientId = req.query.clientId as string || '';

    const query: any = {
      tenantId: req.tenant._id
    };

    if (search) {
      query.$or = [
        { number: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (clientId) {
      query.clientId = clientId;
    }

    const skip = (page - 1) * limit;

    const [budgets, total] = await Promise.all([
      Budget.find(query)
        .populate('clientId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Budget.countDocuments(query)
    ]);

    res.json({
      budgets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar orçamentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getBudgetById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;

    const budget = await Budget.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    })
      .populate('clientId', 'name email phone document address')
      .populate('materials.materialId', 'name unitOfMeasure')
      .populate('labor.laborId', 'name')
      .populate('machines.machineId', 'name');

    if (!budget) {
      res.status(404).json({ message: 'Orçamento não encontrado' });
      return;
    }

    res.json({ budget });
  } catch (error) {
    console.error('Erro ao obter orçamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const updateBudget = async (req: UpdateBudgetRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;
    const updateData = req.body;

    const budget = await Budget.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!budget) {
      res.status(404).json({ message: 'Orçamento não encontrado' });
      return;
    }

    if (updateData.clientId) {
      const client = await Client.findOne({ _id: updateData.clientId, tenantId: req.tenant._id });
      if (!client) {
        res.status(400).json({ message: 'Cliente não encontrado' });
        return;
      }
    }

    Object.assign(budget, updateData);
    await budget.save();

    const populatedBudget = await Budget.findById(budget._id)
      .populate('clientId', 'name email phone document')
      .populate('materials.materialId', 'name unitOfMeasure')
      .populate('labor.laborId', 'name')
      .populate('machines.machineId', 'name');

    res.json({
      message: 'Orçamento atualizado com sucesso',
      budget: populatedBudget
    });
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;

    const budget = await Budget.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!budget) {
      res.status(404).json({ message: 'Orçamento não encontrado' });
      return;
    }

    await Budget.findByIdAndDelete(id);

    res.json({ message: 'Orçamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getBudgetStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const stats = await Budget.aggregate([
      { $match: { tenantId: req.tenant._id } },
      {
        $group: {
          _id: null,
          totalBudgets: { $sum: 1 },
          totalValue: { $sum: '$totalPrice' },
          draftCount: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          sentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const monthlyStats = await Budget.aggregate([
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
    ]);

    res.json({
      stats: stats[0] || {
        totalBudgets: 0,
        totalValue: 0,
        draftCount: 0,
        sentCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        completedCount: 0
      },
      monthlyStats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
