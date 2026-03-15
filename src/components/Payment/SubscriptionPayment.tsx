'use client';

import { useState } from 'react';
import PaymentProcessor from './PaymentProcessor';
import PaymentStatus from './PaymentStatus';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SubscriptionPaymentProps {
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    period: string;
    trialDays?: number;
  };
  onComplete: () => void;
  onCancel: () => void;
}

type PaymentStep = 'processor' | 'status' | 'success' | 'error';

export default function SubscriptionPayment({ plan, onComplete, onCancel }: SubscriptionPaymentProps) {
  const [step, setStep] = useState<PaymentStep>('processor');
  const [paymentId, setPaymentId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [paymentData, setPaymentData] = useState<any>(null); // This holds the result of createPayment
  const [payerFormData, setPayerFormData] = useState<any>({
    email: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const handlePaymentSuccess = (data: any) => {
    setPaymentData(data);
    setPaymentId(data.paymentId || data.id);
    setStep('status');
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setStep('error');
  };

  const handlePaymentConfirmed = (confirmedData: any) => {
    setPaymentData(confirmedData);
    setStep('success');
    setTimeout(() => {
      onComplete();
    }, 3000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const renderStep = () => {
    switch (step) {
      case 'processor':
        return (
          <PaymentProcessor
            plan={plan}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={onCancel}
            initialPayerData={payerFormData}
            onPayerDataChange={setPayerFormData}
            initialPaymentResult={paymentData}
            onPaymentResultChange={setPaymentData}
          />
        );

      case 'status':
        return (
          <PaymentStatus
            paymentId={paymentId}
            onPaymentConfirmed={handlePaymentConfirmed}
            onPaymentFailed={handlePaymentError}
            onCancel={onCancel}
            onBack={() => setStep('processor')}
            paymentData={paymentData}
          />
        );

      case 'success':
        return (
          <div className="max-w-md mx-auto p-6 bg-slate-900 rounded-lg text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h3>
            <p className="text-muted-foreground mb-6">
              Seu plano {plan.name} foi ativado com sucesso.
            </p>
            
            <div className="bg-slate-800 p-4 rounded-lg mb-6">
              <h4 className="font-semibold mb-2">Resumo da Assinatura</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Plano:</span>
                  <span className="font-semibold">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className="font-semibold">{formatPrice(plan.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Período:</span>
                  <span className="font-semibold">{plan.period}</span>
                </div>
                {plan.trialDays && plan.trialDays > 0 && (
                  <div className="flex justify-between">
                    <span>Período Trial:</span>
                    <span className="font-semibold">{plan.trialDays} dias grátis</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Redirecionando para sua dashboard...
              </p>
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="max-w-md mx-auto p-6 bg-slate-900 rounded-lg text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Erro no Pagamento</h3>
            <p className="text-muted-foreground mb-6">
              {error || 'Ocorreu um erro ao processar seu pagamento.'}
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStep('processor');
                  setError('');
                }}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                  "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                Tentar Novamente
              </button>
              <button
                onClick={onCancel}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                  "bg-slate-700 hover:bg-slate-600 text-white"
                )}
              >
                Cancelar
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            ← Voltar
          </button>
        </div>

        {renderStep()}
      </div>
    </div>
  );
}
