import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // URL do backend - usa ambiente ou fallback para localhost
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    console.log(`[Public Key Proxy] Forwarding to: ${backendUrl}/api/payments/public-key`);
    
    const response = await fetch(`${backendUrl}/api/payments/public-key`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[Public Key Proxy] Backend error ${response.status}:`, errorData);
      
      return NextResponse.json(
        { 
          error: 'Erro ao buscar chave pública',
          message: `Backend error: ${response.status}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[Public Key Proxy] Success`);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Public Key Proxy] Error:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
