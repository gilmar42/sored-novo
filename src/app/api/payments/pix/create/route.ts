import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendUrl } from '../../../_utils/backendUrl';
import { canHandlePaymentsLocally, createLocalPixPayment } from '../../_utils/localMercadoPago';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (canHandlePaymentsLocally()) {
      try {
        const result = await createLocalPixPayment(body);
        return NextResponse.json(result, { status: 200 });
      } catch (error: any) {
        console.warn('[PIX Create] Falha no processamento local, usando backend configurado:', error?.message || error);
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
    const targetUrl = `${backendUrl}/api/payments/pix/create`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
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
    console.error('[PIX Create] Erro ao criar PIX:', error.message || error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
