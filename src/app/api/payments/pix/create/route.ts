import { NextRequest, NextResponse } from 'next/server';
import mercadoPago from '@/lib/mercadoPago';
import { getAuth, unauthorized } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    // Para pagamentos, podemos permitir acesso se houver token ou dependendo do contexto.
    // Se o checkout for público, pulamos o getAuth ou tratamos como opcional.
    // Mas para segurança do tenant, vamos validar.
    if (!auth) return unauthorized();

    const body = await req.json();
    const { amount, description, payer, orderId } = body;

    if (!amount || !payer?.email) {
      return NextResponse.json(
        { error: 'Dados incompletos para criação do PIX' },
        { status: 400 }
      );
    }

    console.log(`[PIX Create] Creating PIX payment for order: ${orderId || 'N/A'}`);

    // Criar o pagamento PIX usando o SDK v2
    const payment = await mercadoPago.createPixPayment({
      orderId: orderId || `ORDER-${Date.now()}`,
      amount: parseFloat(amount),
      description: description || 'Assinatura SORED Industrial',
      payerEmail: payer.email,
      payerFirstName: payer.firstName || 'Cliente',
      payerLastName: payer.lastName || 'SORED',
      payerPhone: payer.phone || '',
      notificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`
    });

    // O SDK v2 retorna a resposta no formato esperado
    return NextResponse.json(payment);
  } catch (error: any) {
    console.error('[PIX Create] Error creating PIX:', error.message || error);
    
    // Tratar erros específicos do Mercado Pago
    const statusCode = error.status || 500;
    const errorMessage = error.message || 'Erro ao processar pagamento PIX';

    return NextResponse.json(
      { 
        error: 'Erro no processamento do pagamento', 
        message: errorMessage,
        details: error.cause || null
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
