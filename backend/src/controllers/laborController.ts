import { Response } from 'express';
import Labor, { ILabor } from '../models/Labor';
import { AuthRequest } from '../middleware/auth';

interface CreateLaborRequest extends AuthRequest {
  body: {
    name: string;
    description?: string;
    costPerHour: number;
    category?: string;
  };
}

interface UpdateLaborRequest extends AuthRequest {
  body: {
    name?: string;
    description?: string;
    costPerHour?: number;
    category?: string;
    isActive?: boolean;
  };
}

export const createLabor = async (req: CreateLaborRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { name, description, costPerHour, category } = req.body;

    const existingLabor = await Labor.findOne({ 
      tenantId: req.tenant._id, 
      name: name 
    });

    if (existingLabor) {
      res.status(400).json({ message: 'Função já cadastrada com este nome' });
      return;
    }

    const labor = new Labor({
      tenantId: req.tenant._id,
      name,
      description,
      costPerHour,
      category
    });

    await labor.save();

    res.status(201).json({
      message: 'Função criada com sucesso',
      labor
    });
  } catch (error) {
    console.error('Erro ao criar função:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getLabors = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const [labors, total] = await Promise.all([
      Labor.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Labor.countDocuments(query)
    ]);

    const categories = await Labor.distinct('category', { tenantId: req.tenant._id, isActive: true });

    res.json({
      labors,
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar funções:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getLaborById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;

    const labor = await Labor.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!labor) {
      res.status(404).json({ message: 'Função não encontrada' });
      return;
    }

    res.json({ labor });
  } catch (error) {
    console.error('Erro ao obter função:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const updateLabor = async (req: UpdateLaborRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;
    const updateData = req.body;

    const labor = await Labor.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!labor) {
      res.status(404).json({ message: 'Função não encontrada' });
      return;
    }

    if (updateData.name && updateData.name !== labor.name) {
      const existingLabor = await Labor.findOne({ 
        tenantId: req.tenant._id, 
        name: updateData.name,
        _id: { $ne: id }
      });

      if (existingLabor) {
        res.status(400).json({ message: 'Nome já está em uso por outra função' });
        return;
      }
    }

    Object.assign(labor, updateData);
    await labor.save();

    res.json({
      message: 'Função atualizada com sucesso',
      labor
    });
  } catch (error) {
    console.error('Erro ao atualizar função:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const deleteLabor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;

    const labor = await Labor.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!labor) {
      res.status(404).json({ message: 'Função não encontrada' });
      return;
    }

    labor.isActive = false;
    await labor.save();

    res.json({ message: 'Função desativada com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar função:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
