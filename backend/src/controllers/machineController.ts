import { Response } from 'express';
import Machine, { IMachine } from '../models/Machine';
import { AuthRequest } from '../middleware/auth';

interface CreateMachineRequest extends AuthRequest {
  body: {
    name: string;
    description?: string;
    costPerHour: number;
    energyCost?: number;
    maintenanceCost?: number;
    category?: string;
    specifications?: {
      power?: string;
      capacity?: string;
      dimensions?: string;
      weight?: string;
    };
  };
}

interface UpdateMachineRequest extends AuthRequest {
  body: {
    name?: string;
    description?: string;
    costPerHour?: number;
    energyCost?: number;
    maintenanceCost?: number;
    category?: string;
    specifications?: {
      power?: string;
      capacity?: string;
      dimensions?: string;
      weight?: string;
    };
    isActive?: boolean;
  };
}

export const createMachine = async (req: CreateMachineRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { name, description, costPerHour, energyCost, maintenanceCost, category, specifications } = req.body;

    const existingMachine = await Machine.findOne({ 
      tenantId: req.tenant._id, 
      name: name 
    });

    if (existingMachine) {
      res.status(400).json({ message: 'Máquina já cadastrada com este nome' });
      return;
    }

    const machine = new Machine({
      tenantId: req.tenant._id,
      name,
      description,
      costPerHour,
      energyCost,
      maintenanceCost,
      category,
      specifications
    });

    await machine.save();

    res.status(201).json({
      message: 'Máquina criada com sucesso',
      machine
    });
  } catch (error) {
    console.error('Erro ao criar máquina:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getMachines = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const category = req.query.category as string || '';
    const isActive = req.query.isActive === 'false' ? false : true;

    const query: any = {
      tenantId: req.tenant._id,
      isActive
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;

    const [machines, total] = await Promise.all([
      Machine.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Machine.countDocuments(query)
    ]);

    const categories = await Machine.distinct('category', { tenantId: req.tenant._id, isActive: true });

    res.json({
      machines,
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar máquinas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getMachineById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;

    const machine = await Machine.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!machine) {
      res.status(404).json({ message: 'Máquina não encontrada' });
      return;
    }

    res.json({ machine });
  } catch (error) {
    console.error('Erro ao obter máquina:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const updateMachine = async (req: UpdateMachineRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;
    const updateData = req.body;

    const machine = await Machine.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!machine) {
      res.status(404).json({ message: 'Máquina não encontrada' });
      return;
    }

    if (updateData.name && updateData.name !== machine.name) {
      const existingMachine = await Machine.findOne({ 
        tenantId: req.tenant._id, 
        name: updateData.name,
        _id: { $ne: id }
      });

      if (existingMachine) {
        res.status(400).json({ message: 'Nome já está em uso por outra máquina' });
        return;
      }
    }

    Object.assign(machine, updateData);
    await machine.save();

    res.json({
      message: 'Máquina atualizada com sucesso',
      machine
    });
  } catch (error) {
    console.error('Erro ao atualizar máquina:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const deleteMachine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;

    const machine = await Machine.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!machine) {
      res.status(404).json({ message: 'Máquina não encontrada' });
      return;
    }

    machine.isActive = false;
    await machine.save();

    res.json({ message: 'Máquina desativada com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar máquina:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
