import { NextResponse } from 'next/server';
import mercadoPagoClient from '@/lib/mercadoPago';

export async function GET() {
  try {
    if (!mercadoPagoClient.isConfigured()) {
      return NextResponse.json({ error: 'Mercado Pago não configurado' }, { status: 503 });
    }

    const publicKey = mercadoPagoClient.getPublicKey();
    return NextResponse.json({ publicKey });
  } catch (error: any) {
    console.error('Erro ao obter chave pública:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
