'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@/components/UI';
import { Check, AlertCircle, CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function DemoPaymentClient() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const prefId = searchParams.get('pref_id');
  const returnUrl = searchParams.get('return_url') || '/subscription?success=true';
  const amount = searchParams.get('amount') || '50';
  const description = searchParams.get('description') || 'Pagamento';
  const isRealPayment = searchParams.get('real') === 'true';

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsProcessing(false);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, []);

  const handlePayment = () => {
    setIsProcessing(true);

    window.setTimeout(() => {
      setIsCompleted(true);

      window.setTimeout(() => {
        window.location.href = returnUrl;
      }, 2000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/subscription" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>

        {!isRealPayment ? (
          <Card className="mb-8 border-amber-500/50 bg-amber-500/10">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-semibold text-amber-500">Página de Demonstração</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta é uma simulação da página de pagamento do Mercado Pago para desenvolvimento.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="mb-8 border-green-500/50 bg-green-500/10">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="font-semibold text-green-500">Pagamento Real</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta é uma página de pagamento real processada pelo sistema SORED.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="border-slate-700 bg-slate-800/50">
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-blue-600">Mercado Pago</h1>
                <p className="text-sm text-muted-foreground">Pagamento Seguro</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Detalhes do Pagamento</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID da Preferência:</span>
                  <span className="font-mono text-sm">{prefId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descrição:</span>
                  <span>{description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-semibold">R$ {parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método:</span>
                  <span>Pagamento Único - Cartão de Crédito</span>
                </div>
              </div>
            </div>

            {!isCompleted && (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg text-sm text-green-300 mb-4">
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> PAGAMENTO ÚNICO - SEM PARCELAS
                  </p>
                  <p>Este pagamento é processado como débito único (à vista). Sem parcelas disponíveis.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Número do Cartão</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="4500 0000 0000 0000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Validade</label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="12/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="123"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nome no Cartão</label>
                  <input
                    type="text"
                    placeholder="Nome como está no cartão"
                    className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="DEMO USER"
                  />
                </div>

                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-sm text-red-300">
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> CAMPO DE CUPOM REMOVIDO
                  </p>
                  <p>O campo de cupom foi completamente removido do sistema. Não há cupons disponíveis.</p>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium">Processando pagamento...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Aguarde enquanto processamos sua transação
                </p>
              </div>
            )}

            {isCompleted && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-medium text-green-600">Pagamento Aprovado!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Redirecionando em 2 segundos...
                </p>
              </div>
            )}

            {!isCompleted && !isProcessing && (
              <Button
                onClick={handlePayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md"
              >
                Pagar R$ {parseFloat(amount).toFixed(2)}
              </Button>
            )}

            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-3 h-3" />
                <span>Pagamento seguro criptografado</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
