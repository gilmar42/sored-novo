import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendUrl } from '../../../../_utils/backendUrl';
import { canHandlePaymentsLocally, getLocalPixStatus } from '../../../_utils/localMercadoPago';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    if (canHandlePaymentsLocally()) {
      const status = await getLocalPixStatus(params.paymentId);
      return NextResponse.json(status, { status: 200 });
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
    const targetUrl = `${backendUrl}/api/payments/pix/status/${params.paymentId}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('authorization') || '',
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
    console.error('[PIX Status] Erro:', error?.message || error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
