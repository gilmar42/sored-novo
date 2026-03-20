import { NextRequest, NextResponse } from 'next/server';
import mercadoPago from '@/lib/mercadoPago';
import { getAuth, unauthorized } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    const { paymentId } = await params;
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento não fornecido' },
        { status: 400 }
      );
    }

    console.log(`[PIX QR Code] Fetching data for payment: ${paymentId}`);

    // Obter dados do QR Code diretamente do Mercado Pago usando o SDK v2
    const pixData = await mercadoPago.getPixQrCode(paymentId);

    return NextResponse.json(pixData);
  } catch (error: any) {
    console.error('[PIX QR Code] Error:', error.message || error);
    
    const statusCode = error.status || 500;
    return NextResponse.json(
      { 
        error: 'Erro ao buscar QR Code PIX',
        message: error.message || 'Erro desconhecido'
      },
      { status: statusCode }
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
