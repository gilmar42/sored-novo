import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // URL do backend - usa ambiente ou fallback para localhost
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    console.log(`[Health Check Proxy] Testing backend: ${backendUrl}`);
    
    // Testar conexão com o backend
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[Health Check Proxy] Backend error ${response.status}:`, errorData);
      
      return NextResponse.json(
        { 
          status: 'error',
          message: `Backend error: ${response.status}`,
          backend: backendUrl,
          details: errorData
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    console.log(`[Health Check Proxy] Backend is healthy`);
    
    return NextResponse.json({
      status: 'healthy',
      backend: backendUrl,
      backendResponse: data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Health Check Proxy] Error:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: error.message || 'Backend não está acessível',
        backend: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  }
}
