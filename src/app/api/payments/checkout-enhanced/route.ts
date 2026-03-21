import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // URL do backend - usa BACKEND_URL ou fallback para local 3001
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    const body = await request.json();
    const targetUrl = `${backendUrl}/api/payments/checkout-enhanced`;
    
    console.log(`[Checkout Enhanced Proxy] Encaminhando para: ${targetUrl}`);
    
    // Criar preferência com parâmetros forçados
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Checkout Enhanced Proxy] Status de resposta do backend: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Checkout Enhanced Proxy] Erro do backend:`, errorText);
      
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
    console.error('Erro ao encaminhar para o backend:', error);
    return NextResponse.json(
      { error: 'Falha ao criar pagamento' },
      { status: 500 }
    );
  }
}
