import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from './db';
import User from '@/models/User';
import Tenant from '@/models/Tenant';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthContext {
  user: any;
  tenant: any;
}

export async function getAuth(req: NextRequest): Promise<AuthContext | null> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; tenantId: string };
    
    await dbConnect();
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) return null;

    const tenant = await Tenant.findById(decoded.tenantId);
    if (!tenant || tenant.status !== 'active') return null;

    return { user, tenant };
  } catch (error) {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
}
