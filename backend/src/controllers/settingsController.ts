import { Response } from 'express';
import Tenant, { ITenant } from '../models/Tenant';
import { AuthRequest } from '../middleware/auth';

interface UpdateSettingsRequest extends AuthRequest {
  body: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
    settings?: {
      defaultMargin: number;
      currency: string;
      dateFormat: string;
    };
  };
}

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const tenant = await Tenant.findById(req.tenant._id);

    if (!tenant) {
      res.status(404).json({ message: 'Empresa não encontrada' });
      return;
    }

    res.json({
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        document: tenant.document,
        address: tenant.address,
        logo: tenant.logo,
        plan: tenant.plan,
        status: tenant.status,
        settings: tenant.settings,
        subscription: tenant.subscription
      }
    });
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const updateSettings = async (req: UpdateSettingsRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { name, email, phone, address, settings } = req.body;

    const tenant = await Tenant.findById(req.tenant._id);

    if (!tenant) {
      res.status(404).json({ message: 'Empresa não encontrada' });
      return;
    }

    if (email && email !== tenant.email) {
      const existingTenant = await Tenant.findOne({ 
        email: email,
        _id: { $ne: req.tenant._id }
      });

      if (existingTenant) {
        res.status(400).json({ message: 'Email já está em uso por outra empresa' });
        return;
      }
    }

    if (name) tenant.name = name;
    if (email) tenant.email = email;
    if (phone) tenant.phone = phone;
    if (address) tenant.address = address;
    if (settings) {
      if (settings.defaultMargin !== undefined) {
        tenant.settings.defaultMargin = Math.max(0, Math.min(100, settings.defaultMargin));
      }
      if (settings.currency) tenant.settings.currency = settings.currency;
      if (settings.dateFormat) tenant.settings.dateFormat = settings.dateFormat;
    }

    await tenant.save();

    res.json({
      message: 'Configurações atualizadas com sucesso',
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        document: tenant.document,
        address: tenant.address,
        logo: tenant.logo,
        plan: tenant.plan,
        status: tenant.status,
        settings: tenant.settings,
        subscription: tenant.subscription
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const uploadLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'Nenhum arquivo enviado' });
      return;
    }

    const tenant = await Tenant.findById(req.tenant._id);

    if (!tenant) {
      res.status(404).json({ message: 'Empresa não encontrada' });
      return;
    }

    tenant.logo = req.file.filename;
    await tenant.save();

    res.json({
      message: 'Logo atualizado com sucesso',
      logo: req.file.filename
    });
  } catch (error) {
    console.error('Erro ao fazer upload do logo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getSubscriptionInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const tenant = await Tenant.findById(req.tenant._id);

    if (!tenant) {
      res.status(404).json({ message: 'Empresa não encontrada' });
      return;
    }

    const planLimits = {
      starter: {
        maxClients: 50,
        maxMaterials: 100,
        maxBudgets: 200,
        maxUsers: 3
      },
      professional: {
        maxClients: -1,
        maxMaterials: -1,
        maxBudgets: -1,
        maxUsers: 10
      },
      enterprise: {
        maxClients: -1,
        maxMaterials: -1,
        maxBudgets: -1,
        maxUsers: -1
      }
    };

    const currentUsage = await Promise.all([
      import('../models/Client').then(({ default: Client }) => 
        Client.countDocuments({ tenantId: req.tenant!._id, isActive: true })
      ),
      import('../models/Material').then(({ default: Material }) => 
        Material.countDocuments({ tenantId: req.tenant!._id, isActive: true })
      ),
      import('../models/Budget').then(({ default: Budget }) => 
        Budget.countDocuments({ tenantId: req.tenant!._id })
      ),
      import('../models/User').then(({ default: User }) => 
        User.countDocuments({ tenantId: req.tenant!._id, isActive: true })
      )
    ]);

    const [clientsCount, materialsCount, budgetsCount, usersCount] = currentUsage;

    const limits = planLimits[tenant.plan];

    res.json({
      plan: tenant.plan,
      subscription: tenant.subscription,
      limits,
      usage: {
        clients: clientsCount,
        materials: materialsCount,
        budgets: budgetsCount,
        users: usersCount
      },
      canUpgrade: tenant.plan !== 'enterprise'
    });
  } catch (error) {
    console.error('Erro ao obter informações da assinatura:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
