import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // URL do backend - usa ambiente ou fallback para localhost
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Limpar a URL do backend: remover /api e barras finais
    backendUrl = backendUrl.replace(/\/api\/?$/, '');
    backendUrl = backendUrl.replace(/\/+$/, '');
    
    const body = await request.json();
    
    console.log(`[Checkout Proxy] Forwarding to: ${backendUrl}/api/payments/checkout`);
    
    const response = await fetch(`${backendUrl}/api/payments/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
        'Origin': request.headers.get('origin') || '',
        'User-Agent': request.headers.get('user-agent') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[Checkout Proxy] Backend error ${response.status}:`, errorData);
      
      return NextResponse.json(
        { 
          error: 'Erro ao processar pagamento',
          message: `Backend error: ${response.status}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[Checkout Proxy] Success:`, data);
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
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
