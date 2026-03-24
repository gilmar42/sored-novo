import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendUrl } from '../_utils/backendUrl';

export async function POST(request: NextRequest) {
  try {
    let backendUrl: string;
    try {
      backendUrl = resolveBackendUrl();
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Backend não configurado', message: error?.message || String(error) },
        { status: 503 }
      );
    }

    const body = await request.json();
    const targetUrl = `${backendUrl}/api/subscriptions`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
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
    console.error('[Subscriptions Proxy] Erro:', error?.message || error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
