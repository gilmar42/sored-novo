import { NextResponse } from 'next/server';
import { resolveBackendUrl } from '../_utils/backendUrl';

export async function GET() {
  try {
    let backendUrl: string;
    try {
      backendUrl = resolveBackendUrl();
    } catch {
      return NextResponse.json({
        status: 'healthy',
        frontend: 'ok',
        backend: 'not configured',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    }

    try {
      const response = await fetch(`${backendUrl}/api/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        return NextResponse.json({
          status: 'healthy',
          frontend: 'ok',
          backend: 'connected',
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        });
      } else {
        return NextResponse.json({
          status: 'degraded',
          frontend: 'ok',
          backend: 'error',
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }, { status: 200 });
      }
    } catch {
      return NextResponse.json({
        status: 'healthy',
        frontend: 'ok',
        backend: 'unreachable',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('[Health Check] Erro:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Erro no health check',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
