import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendUrl } from '../../_utils/backendUrl';

export async function GET(request: NextRequest) {
  try {
    // Prefer proxying to the backend when available. If the backend isn't reachable
    // (common in Vercel-only deploys), fall back to the env public key so the UI can load.
    const envPublicKey =
      process.env.MERCADO_PAGO_PUBLIC_KEY ||
      process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
      '';

    let backendUrl: string;
    try {
      backendUrl = resolveBackendUrl();
    } catch (error: any) {
      if (envPublicKey) {
        return NextResponse.json({ publicKey: envPublicKey }, { status: 200 });
      }

      return NextResponse.json(
        { error: 'Backend não configurado', message: error?.message || String(error) },
        { status: 503 }
      );
    }

    const targetUrl = `${backendUrl}/api/payments/public-key`;

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: request.headers.get('authorization') || '',
        },
      });
    } catch (error: any) {
      // Backend is down/unreachable: return env fallback if present.
      if (envPublicKey) {
        return NextResponse.json({ publicKey: envPublicKey }, { status: 200 });
      }

      console.error('Erro ao obter chave pública (backend indisponível):', {
        targetUrl,
        message: error?.message || String(error),
      });
      return NextResponse.json(
        { error: 'Backend indisponível para obter a chave pública do Mercado Pago' },
        { status: 503 }
      );
    }

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Erro ao obter chave pública:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
