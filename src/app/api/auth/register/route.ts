import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const JWT_EXPIRES_IN = '7d';

export async function POST(req: NextRequest) {
  try {
    const {
      tenantName,
      tenantEmail,
      tenantDocument,
      userName,
      userEmail,
      userPassword
    } = await req.json();

    const normalizedTenantEmail = tenantEmail?.trim().toLowerCase();
    const normalizedUserEmail = userEmail?.trim().toLowerCase();

    // Validar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedUserEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Este e-mail já está cadastrado.' },
        { status: 400 }
      );
    }

    // Criar Tenant e Usuário em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar a empresa (Tenant)
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          email: normalizedTenantEmail,
          document: tenantDocument,
          status: 'active', // Pode iniciar como 'active' se houver trial ou 'pending' se exigir pagamento
          plan: 'starter'
        }
      });

      // 2. Hash da senha
      const hashedPassword = await bcrypt.hash(userPassword, 10);

      // 3. Criar o usuário Admin
      const user = await tx.user.create({
        data: {
          name: userName,
          email: normalizedUserEmail,
          password: hashedPassword,
          role: 'admin',
          tenantId: tenant.id,
          isActive: true
        }
      });

      return { tenant, user };
    });

    const token = jwt.sign(
      { userId: result.user.id, tenantId: result.tenant.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return NextResponse.json({
      message: 'Empresa e usuário cadastrados com sucesso',
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        permissions: []
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        email: result.tenant.email,
        plan: result.tenant.plan,
        settings: result.tenant.settings || {}
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Auth Cadastro] Erro:', error.message || error);
    return NextResponse.json({ 
      message: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}
