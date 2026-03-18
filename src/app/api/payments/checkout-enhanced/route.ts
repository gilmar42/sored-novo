import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // URL do backend - usa ambiente ou fallback para localhost
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Limpar a URL do backend: remover /api e barras finais
    backendUrl = backendUrl.replace(/\/api\/?$/, '');
    backendUrl = backendUrl.replace(/\/+$/, '');
    
    const body = await request.json();
    const targetUrl = `${backendUrl}/api/payments/checkout-enhanced`;
    
    console.log(`[Checkout Enhanced Proxy] Forwarding to: ${targetUrl}`);
    
    // Criar preferência com parâmetros forçados
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Checkout Enhanced Proxy] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Checkout Enhanced Proxy] Backend error:`, errorText);
      
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
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
