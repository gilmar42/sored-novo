import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendUrl } from '../../_utils/backendUrl';

export async function POST(req: NextRequest) {
  let backendUrl: string;
  try {
    backendUrl = resolveBackendUrl();
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Backend não configurado', message: error?.message || String(error) },
      { status: 503 }
    );
  }

  const body = await req.text();
  const targetUrl = `${backendUrl}/api/webhooks/mercadopago${req.nextUrl.search}`;

  const response = await fetch(targetUrl, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': req.headers.get('content-type') || 'application/json',
      'x-signature': req.headers.get('x-signature') || '',
      'x-request-id': req.headers.get('x-request-id') || '',
      'user-agent': req.headers.get('user-agent') || '',
    },
    body,
  });

  const text = await response.text();
  try {
    const data = text ? JSON.parse(text) : null;
    return NextResponse.json(data, { status: response.status });
  } catch {
    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') || 'text/plain' },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-signature, x-request-id',
    },
  });
}

