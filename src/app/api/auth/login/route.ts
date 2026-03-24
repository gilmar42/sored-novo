import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

const getPrismaConfigError = (error: any) => {
  const message = error?.message || String(error);
  if (message.includes('Error validating datasource `db`')) {
    return 'DATABASE_URL inválido para o Prisma. Configure uma URL MySQL válida antes de usar login/cadastro local.';
  }

  return null;
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    // Buscar usuário e incluir os dados da empresa (Tenant)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        tenant: true
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ message: 'Usuário desativado. Entre em contato com o suporte.' }, { status: 403 });
    }

    // Gerar Token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Atualizar último login (opcional, sem travar o fluxo)
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    }).catch(err => console.error('Erro ao atualizar lastLogin:', err));

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        plan: user.tenant.plan,
        status: user.tenant.status,
        settings: user.tenant.settings || {}
      }
    });

  } catch (error: any) {
    console.error('[Auth Login] Erro:', error);
    const configError = getPrismaConfigError(error);
    if (configError) {
      return NextResponse.json({ message: configError }, { status: 503 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
