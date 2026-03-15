import { Response } from 'express';
import Client, { IClient } from '../models/Client';
import { AuthRequest } from '../middleware/auth';

interface CreateClientRequest extends AuthRequest {
  body: {
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
    observations?: string;
  };
}

interface UpdateClientRequest extends AuthRequest {
  body: {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
    observations?: string;
    isActive?: boolean;
  };
}

export const createClient = async (req: CreateClientRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { name, email, phone, document, address, observations } = req.body;

    const existingClient = await Client.findOne({ 
      tenantId: req.tenant._id, 
      email: email 
    });

    if (existingClient) {
      res.status(400).json({ message: 'Cliente já cadastrado com este email' });
      return;
    }

    const client = new Client({
      tenantId: req.tenant._id,
      name,
      email,
      phone,
      document,
      address,
      observations
    });

    await client.save();

    res.status(201).json({
      message: 'Cliente criado com sucesso',
      client
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const isActive = req.query.isActive === 'false' ? false : true;

    const query: any = {
      tenantId: req.tenant._id,
      isActive
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { document: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      Client.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Client.countDocuments(query)
    ]);

    res.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getClientById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;

    const client = await Client.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!client) {
      res.status(404).json({ message: 'Cliente não encontrado' });
      return;
    }

    res.json({ client });
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const updateClient = async (req: UpdateClientRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;
    const updateData = req.body;

    const client = await Client.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!client) {
      res.status(404).json({ message: 'Cliente não encontrado' });
      return;
    }

    if (updateData.email && updateData.email !== client.email) {
      const existingClient = await Client.findOne({ 
        tenantId: req.tenant._id, 
        email: updateData.email,
        _id: { $ne: id }
      });

      if (existingClient) {
        res.status(400).json({ message: 'Email já está em uso por outro cliente' });
        return;
      }
    }

    Object.assign(client, updateData);
    await client.save();

    res.json({
      message: 'Cliente atualizado com sucesso',
      client
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const deleteClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;

    const client = await Client.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!client) {
      res.status(404).json({ message: 'Cliente não encontrado' });
      return;
    }

    client.isActive = false;
    await client.save();

    res.json({ message: 'Cliente desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
