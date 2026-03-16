import { Response } from 'express';
import Material, { IMaterial } from '../models/Material';
import { AuthRequest } from '../middleware/auth';

interface CreateMaterialRequest extends AuthRequest {
  body: {
    name: string;
    description?: string;
    category: string;
    unitOfMeasure: string;
    unitCost: number;
    weight?: number;
    weightUnit?: string;
    dimensions?: {
      length: number;
      lengthUnit: string;
      width: number;
      widthUnit: string;
      height: number;
      heightUnit: string;
    };
    diameter?: number;
    diameterUnit?: string;
    volume?: number;
    volumeUnit?: string;
    isComposite?: boolean;
    components?: Array<{
      name: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }>;
    itemType: 'material' | 'component';
    size?: string;
  };
}

interface UpdateMaterialRequest extends AuthRequest {
  body: {
    name?: string;
    description?: string;
    category?: string;
    unitOfMeasure?: string;
    unitCost?: number;
    weight?: number;
    weightUnit?: string;
    diameter?: number;
    diameterUnit?: string;
    volume?: number;
    volumeUnit?: string;
    isComposite?: boolean;
    components?: Array<{
      name: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }>;
    itemType?: 'material' | 'component';
    size?: string;
    isActive?: boolean;
  };
}

export const createMaterial = async (req: CreateMaterialRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { 
      name, 
      description, 
      category, 
      unitOfMeasure, 
      unitCost, 
      weight, 
      weightUnit,
      dimensions, 
      diameter,
      diameterUnit,
      volume,
      volumeUnit,
      isComposite, 
      components,
      itemType,
      size
    } = req.body;

    const existingMaterial = await Material.findOne({ 
      tenantId: req.tenant._id, 
      name: name 
    });

    if (existingMaterial) {
      res.status(400).json({ message: 'Material já cadastrado com este nome' });
      return;
    }

    const material = new Material({
      tenantId: req.tenant._id,
      name,
      description,
      category,
      unitOfMeasure,
      unitCost,
      weight,
      weightUnit,
      dimensions,
      diameter,
      diameterUnit,
      volume,
      volumeUnit,
      isComposite: isComposite || false,
      components: isComposite ? components : [],
      itemType: itemType || 'material',
      size
    });

    await material.save();

    res.status(201).json({
      message: 'Material criado com sucesso',
      material
    });
  } catch (error) {
    console.error('Erro ao criar material:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getMaterials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Temporariamente permitir acesso sem autenticação
    if (!req.tenant) {
      // Retornar dados simulados se não houver tenant
      const mockMaterials = [
        {
          _id: "1",
          name: "Aço Carbono 1020",
          category: "Metais",
          unitOfMeasure: "kg",
          unitCost: 8.50,
          itemType: "material",
          size: "Chapa 20mm",
          isActive: true
        },
        {
          _id: "2",
          name: "Alumínio 6061",
          category: "Metais",
          unitOfMeasure: "kg",
          unitCost: 25.80,
          itemType: "material",
          size: "Barra 50mm",
          isActive: true
        },
        {
          _id: "3",
          name: "Parafuso M12x50",
          category: "Fixadores",
          unitOfMeasure: "un",
          unitCost: 2.35,
          itemType: "component",
          size: "M12x50mm",
          isActive: true
        }
      ];

      return res.json({
        materials: mockMaterials,
        categories: ["Metais", "Fixadores"],
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          pages: 1
        }
      });
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

    const [materials, total] = await Promise.all([
      Material.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Material.countDocuments(query)
    ]);

    const categories = await Material.distinct('category', { tenantId: req.tenant._id, isActive: true });

    res.json({
      materials,
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar materiais:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getMaterialById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;

    const material = await Material.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!material) {
      res.status(404).json({ message: 'Material não encontrado' });
      return;
    }

    res.json({ material });
  } catch (error) {
    console.error('Erro ao obter material:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const updateMaterial = async (req: UpdateMaterialRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;
    const updateData = req.body;

    const material = await Material.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!material) {
      res.status(404).json({ message: 'Material não encontrado' });
      return;
    }

    if (updateData.name && updateData.name !== material.name) {
      const existingMaterial = await Material.findOne({ 
        tenantId: req.tenant._id, 
        name: updateData.name,
        _id: { $ne: id }
      });

      if (existingMaterial) {
        res.status(400).json({ message: 'Nome já está em uso por outro material' });
        return;
      }
    }

    Object.assign(material, updateData);
    await material.save();

    res.json({
      message: 'Material atualizado com sucesso',
      material
    });
  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const deleteMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;

    const material = await Material.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!material) {
      res.status(404).json({ message: 'Material não encontrado' });
      return;
    }

    material.isActive = false;
    await material.save();

    res.json({ message: 'Material desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar material:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
