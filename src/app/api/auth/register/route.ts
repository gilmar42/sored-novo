import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Tenant from '@/models/Tenant';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const JWT_EXPIRES_IN = '7d';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const {
      tenantName,
      tenantEmail,
      tenantDocument,
      userName,
      userEmail,
      userPassword
    } = await req.json();

    const normalizedTenantEmail = tenantEmail.trim().toLowerCase();
    const normalizedUserEmail = userEmail.trim().toLowerCase();

    const existingTenant = await Tenant.findOne({ email: normalizedTenantEmail });
    if (existingTenant) {
      return NextResponse.json({ message: 'Empresa já cadastrada com este email' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: normalizedUserEmail });
    if (existingUser) {
      return NextResponse.json({ message: 'Usuário já cadastrado com este email' }, { status: 400 });
    }

    const tenant = new Tenant({
      name: tenantName,
      email: normalizedTenantEmail,
      ...(tenantDocument && { document: tenantDocument }),
      plan: 'starter',
      status: 'active',
      settings: {
        defaultMargin: 30,
        currency: 'BRL',
        dateFormat: 'DD/MM/YYYY'
      }
    });

    await tenant.save();

    const user = new User({
      tenantId: tenant._id,
      name: userName,
      email: normalizedUserEmail,
      password: userPassword,
      role: 'admin',
      permissions: [
        'clients:read', 'clients:write', 'clients:delete',
        'materials:read', 'materials:write', 'materials:delete',
        'labor:read', 'labor:write', 'labor:delete',
        'machines:read', 'machines:write', 'machines:delete',
        'budgets:read', 'budgets:write', 'budgets:delete',
        'reports:read', 'settings:read', 'settings:write',
        'users:read', 'users:write', 'users:delete'
      ]
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, tenantId: tenant._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return NextResponse.json({
      message: 'Empresa e usuário cadastrados com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        plan: tenant.plan,
        settings: tenant.settings
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro no registro:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
