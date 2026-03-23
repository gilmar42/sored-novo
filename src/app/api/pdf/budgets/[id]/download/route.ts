import { NextRequest, NextResponse } from 'next/server';
import { getAuth, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    const budgetId = params.id;
    const tenantId = auth.tenant.id;

    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, tenantId: tenantId },
      include: { client: true }
    });

    if (!budget) {
      return NextResponse.json({ message: 'Orçamento não encontrado' }, { status: 404 });
    }

    // Em uma implementação real, aqui geramos ou buscamos o binário do PDF (Blob)
    // Para agora, vamos retornar um erro amigável se o arquivo não estiver fisicamente no servidor,
    // ou informar que o download deve ser gerado no frontend (abordagem moderna do Next.js + React PDF).
    
    return NextResponse.json({ 
      message: 'Binário do PDF não encontrado no servidor. O PDF deve ser pré-gerado pelo cliente.',
      budgetId,
      number: budget.number
    }, { status: 410 }); // GONE - o recurso não reside mais no servidor de forma estática

  } catch {
    return NextResponse.json({ message: 'Erro ao processar download do PDF' }, { status: 500 });
  }
}
