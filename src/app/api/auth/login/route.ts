import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Tenant from '@/models/Tenant';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      return NextResponse.json({ message: 'E-mail ou senha incorretos' }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ message: 'E-mail ou senha incorretos' }, { status: 401 });
    }

    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant || tenant.status !== 'active') {
      return NextResponse.json({ message: 'Empresa inativa ou não encontrada' }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user._id, tenantId: user.tenantId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return NextResponse.json({
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
        plan: tenant.plan
      }
    });

  } catch (error: any) {
    console.error('Erro no login:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
