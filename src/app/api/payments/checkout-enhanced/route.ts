import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // URL do backend - usa ambiente ou fallback para localhost
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Limpar a URL do backend: remover /api e barras finais
    backendUrl = backendUrl.replace(/\/api\/?$/, '');
    backendUrl = backendUrl.replace(/\/+$/, '');
    
    const body = await request.json();
    
    console.log(`[Checkout Enhanced Proxy] Forwarding to: ${backendUrl}/api/payments/checkout-enhanced`);
    
    // Criar preferência com parâmetros forçados
    const response = await fetch(`${backendUrl}/api/payments/checkout-enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        errorData || { error: 'Backend error' },
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
