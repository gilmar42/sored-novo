import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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
    
    return { 
      user: { _id: decoded.userId, id: decoded.userId, isActive: true }, 
      tenant: { _id: decoded.tenantId, id: decoded.tenantId, status: 'active' } 
    };
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
}
