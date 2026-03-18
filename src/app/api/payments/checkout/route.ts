import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // URL do backend - usa ambiente ou fallback para localhost
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Limpar a URL do backend: remover /api e barras finais
    backendUrl = backendUrl.replace(/\/api\/?$/, '');
    backendUrl = backendUrl.replace(/\/+$/, '');
    
    const body = await request.json();
    const targetUrl = `${backendUrl}/api/payments/checkout`;
    
    console.log(`[Checkout Proxy] Forwarding to: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Checkout Proxy] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Checkout Proxy] Backend error:`, errorText);
      
      return NextResponse.json(
        { 
          error: 'Erro no backend', 
          status: response.status,
          details: errorText,
          targetUrl: targetUrl
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Checkout Proxy] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
