import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendUrl } from '../../../../_utils/backendUrl';
import { canHandlePaymentsLocally, getLocalPixQrCode } from '../../../_utils/localMercadoPago';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
  ) {
  try {
    const { paymentId } = await params;
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento não fornecido' },
        { status: 400 }
      );
    }

    if (canHandlePaymentsLocally()) {
      const qrCode = await getLocalPixQrCode(paymentId);
      return NextResponse.json(qrCode, { status: 200 });
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
    const targetUrl = `${backendUrl}/api/payments/pix/qrcode/${paymentId}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': req.headers.get('authorization') || '',
      },
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[PIX QR Code] Erro:', error.message || error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
