'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import SubscriptionPlans from '@/components/SubscriptionPlans';
import PaymentProcessor from '@/components/Payment/PaymentProcessor';

export default function SubscriptionPage() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);

  const handlePlanSelect = (plan: any, method: string) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Pagamento sucesso:', paymentData);
    
    // Salvar no localStorage para persistência
    localStorage.setItem('lastPayment', JSON.stringify({
      ...paymentData,
      timestamp: new Date().toISOString()
    }));
    
    // Redirecionar imediatamente para página de sucesso
    window.location.href = '/payment-success';
  };

  const handlePaymentError = (error: string) => {
    console.error('Erro no pagamento:', error);
    // Aqui você pode mostrar mensagem de erro
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Voltar à Página Inicial
          </Link>
        </div>

        {/* Mensagem de Sucesso */}
        {showSuccessMessage && paymentData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-lg max-w-md w-full p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4 text-green-400">Pagamento Aprovado!</h2>
              
              <div className="space-y-3 mb-6 text-left bg-slate-800 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID do Pagamento:</span>
                  <span className="font-mono text-sm">{paymentData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plano:</span>
                  <span>{paymentData.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="text-green-400 font-bold">
                    R$ {paymentData.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-green-400 font-semibold">
                    {paymentData.status === 'approved' ? 'Aprovado' : paymentData.status}
                  </span>
                </div>
                {paymentData.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-sm">{paymentData.email}</span>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Redirecionando para o dashboard em {countdown} segundos...
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Ir para o Dashboard Agora
                </button>
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {!showSuccessMessage && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Planos de Assinatura</h1>
              <p className="text-xl text-muted-foreground">
                Escolha o plano ideal para o seu negócio industrial
              </p>
            </div>

            <SubscriptionPlans onPlanSelect={handlePlanSelect} />
          </>
        )}

        {/* Modal de Pagamento */}
        {showPaymentModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold">Finalizar Assinatura</h3>
                <button
                  onClick={handlePaymentCancel}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <PaymentProcessor
                  plan={selectedPlan}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
