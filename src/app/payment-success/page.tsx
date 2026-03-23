'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Home, Clock } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [paymentData, setPaymentData] = useState<any>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Obter dados do pagamento da URL ou localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('paymentId');
    
    if (paymentId) {
      // Se vier da URL, salvar no localStorage
      const savedPayment = localStorage.getItem('lastPayment');
      if (savedPayment) {
        try {
          const payment = JSON.parse(savedPayment);
          setPaymentData(payment);
        } catch (error) {
          console.error('Erro ao processar dados do pagamento:', error);
        }
      }
    } else {
      // Verificar localStorage
      const savedPayment = localStorage.getItem('lastPayment');
      if (savedPayment) {
        try {
          const payment = JSON.parse(savedPayment);
          setPaymentData(payment);
        } catch {
          localStorage.removeItem('lastPayment');
        }
      }
    }

    // Contador regressivo para redirecionamento
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Se o usuario nao estiver autenticado, ir para login em vez de cair em redirect inesperado.
          const hasToken = !!localStorage.getItem('token');
          window.location.href = hasToken ? '/dashboard' : '/login';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando informações do pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Voltar à Página Inicial
          </Link>
        </div>

        {/* Card de Sucesso */}
        <div className="bg-slate-900 rounded-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 text-green-400">Pagamento Aprovado!</h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Sua assinatura do SORED foi ativada com sucesso.
          </p>
          
          {/* Detalhes do Pagamento */}
          <div className="bg-slate-800 p-6 rounded-lg mb-8 text-left max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-center">Detalhes da Transação</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-muted-foreground">ID do Pagamento:</span>
                <span className="font-mono text-sm">{paymentData.id}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-muted-foreground">Plano Contratado:</span>
                <span className="font-semibold">{paymentData.description}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-muted-foreground">Valor Pago:</span>
                <span className="text-green-400 font-bold text-lg">
                  R$ {paymentData.amount.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-400 font-semibold">
                  {paymentData.status === 'approved' ? 'Aprovado' : paymentData.status}
                </span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-muted-foreground">Método:</span>
                <span>
                  {paymentData.paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'PIX'}
                </span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-muted-foreground">Data:</span>
                <span>
                  {new Date(paymentData.dateCreated).toLocaleString('pt-BR')}
                </span>
              </div>
              
              {paymentData.email && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-sm">{paymentData.email}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Contador Regressivo */}
          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg mb-8">
            <div className="flex items-center justify-center gap-2 text-blue-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Redirecionando para o dashboard em {countdown} segundos...
              </span>
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Ir para o Dashboard Agora
            </Link>
            
            <button
              onClick={() => window.location.href = '/subscription'}
              className="border border-slate-600 hover:bg-slate-800 py-3 px-6 rounded-lg transition-colors"
            >
              Ver Outros Planos
            </button>
          </div>
        </div>
        
        {/* Informações Adicionais */}
        <div className="mt-8 text-center text-muted-foreground">
          <p className="mb-2">
            Um email de confirmação foi enviado para {paymentData.email || 'seu email'}.
          </p>
          <p className="text-sm">
            Em caso de dúvidas, entre em contato com nosso suporte.
          </p>
        </div>
      </div>
    </div>
  );
}
