import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // URL do backend - usa ambiente ou fallback para localhost
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Log para depuração no servidor
    console.log(`[PIX Create Proxy] Raw Backend URL: ${backendUrl}`);
    
    // Garantir que a URL comece com http
    if (!backendUrl.startsWith('http')) {
      // Se estiver rodando no mesmo servidor, assume localhost se for porta ou completa com https
      if (backendUrl.startsWith(':')) {
        backendUrl = `http://localhost${backendUrl}`;
      } else {
        backendUrl = `https://${backendUrl}`;
      }
    }

    // Limpar a URL do backend: remover /api e barras finais
    backendUrl = backendUrl.replace(/\/api\/?$/, '');
    backendUrl = backendUrl.replace(/\/+$/, '');
    
    const body = await request.json();
    const targetUrl = `${backendUrl}/api/payments/pix/create`;
    
    console.log(`[PIX Create Proxy] Forwarding to: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
    });

    console.log(`[PIX Create Proxy] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PIX Create Proxy] Backend error:`, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: response.status });
      } catch (e) {
        return NextResponse.json(
          { error: 'Erro no backend', details: errorText },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PIX Create Proxy] Exception:', error);
    return NextResponse.json(
      { error: 'Erro interno no proxy', message: error.message },
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
