import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendUrl } from '../../_utils/backendUrl';
import { canHandlePaymentsLocally, createLocalCheckout } from '../_utils/localMercadoPago';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (canHandlePaymentsLocally()) {
      try {
        const result = await createLocalCheckout(body);
        return NextResponse.json(result, { status: 200 });
      } catch (error: any) {
        console.warn('[Checkout Proxy] Falha no processamento local, usando backend configurado:', error?.message || error);
      }
    }

    let backendUrl: string;
    try {
      backendUrl = resolveBackendUrl();
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Backend não configurado', message: error?.message || String(error) },
        { status: 503 }
      );
    }
    
    const targetUrl = `${backendUrl}/api/payments/checkout`;
    
    console.log(`[Checkout Proxy] Encaminhando para: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Checkout Proxy] Status de resposta do backend: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Checkout Proxy] Erro do backend:`, errorText);
      
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
    console.error('[Checkout Proxy] Erro:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
