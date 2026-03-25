import { NextRequest, NextResponse } from 'next/server';
import { getAuth, unauthorized } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    return NextResponse.json({
      user: {
        id: auth.user._id,
        name: auth.user.name,
        email: auth.user.email,
        role: auth.user.role,
        permissions: auth.user.permissions,
        lastLogin: auth.user.lastLogin
      },
      tenant: {
        id: auth.tenant._id,
        name: auth.tenant.name,
        email: auth.tenant.email,
        plan: auth.tenant.plan,
        settings: auth.tenant.settings
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter perfil:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
