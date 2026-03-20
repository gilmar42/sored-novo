import { NextRequest, NextResponse } from 'next/server';
import mercadoPago from '@/lib/mercadoPago';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Webhook MP] Recebido:', body.type, body.action);

    // Tipos de eventos: 'payment.created', 'payment.updated'
    // A ação pode ser 'payment.updated' e o body.data.id contém o ID do pagamento
    const paymentId = body.data?.id || body.id;
    const action = body.action || body.type;

    if (action === 'payment.updated' || action === 'payment.created' || body.type === 'payment') {
      if (!paymentId) return NextResponse.json({ received: true });

      console.log(`[Webhook MP] Processando pagamento: ${paymentId}`);

      // Buscar status real no Mercado Pago
      const paymentData = await mercadoPago.getPayment(paymentId.toString());
      const status = paymentData.status;
      const externalReference = paymentData.external_reference; // ID do tenant ou pedido

      if (status === 'approved' && externalReference) {
        console.log(`[Webhook MP] Pagamento aprovado para: ${externalReference}`);

        // Atualizar banco de dados (Exemplo: Ativar assinatura do Tenant)
        // Procuramos por uma assinatura pendente com esse external_reference ou tenantId
        await prisma.subscription.updateMany({
          where: {
            mercadoPagoPaymentId: paymentId.toString()
          },
          data: {
            status: 'active',
            updatedAt: new Date()
          }
        });

        // Opcional: Atualizar status do Tenant diretamente se externalReference for o TenantId
        await prisma.tenant.updateMany({
          where: { id: externalReference },
          data: { 
            status: 'active',
            plan: 'pro' // Exemplo
          }
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Webhook MP] Erro no processamento:', error.message || error);
    // Retornamos 200 mesmo no erro para o MP não ficar tentando reenviar se for erro lógico
    return NextResponse.json({ message: 'Internal logic handled' }, { status: 200 });
  }
}
