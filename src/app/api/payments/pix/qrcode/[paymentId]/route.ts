import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    // URL do backend - usa ambiente ou fallback para localhost
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    console.log(`[PIX QR Code Proxy] Forwarding to: ${backendUrl}/api/payments/pix/qrcode/${paymentId}`);
    
    const response = await fetch(`${backendUrl}/api/payments/pix/qrcode/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
        'Origin': request.headers.get('origin') || '',
        'User-Agent': request.headers.get('user-agent') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[PIX QR Code Proxy] Backend error ${response.status}:`, errorData);
      
      return NextResponse.json(
        { 
          error: 'Erro ao buscar QR Code PIX',
          message: `Backend error: ${response.status}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[PIX QR Code Proxy] Success`);
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('[PIX QR Code Proxy] Error:', error);
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
