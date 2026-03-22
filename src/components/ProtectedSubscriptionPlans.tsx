'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/UI';
import { Check, AlertCircle, CreditCard, QrCode, ArrowLeft, Lock, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/utils/cn';
import api from '@/lib/api';
import paymentApi, { getPaymentApiConfigurationError } from '@/lib/paymentApi';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  trialDays: number;
  features: Record<string, any>;
  savings?: string;
  popular: boolean;
}

interface PayerData {
  email: string;
  firstName: string;
  lastName: string;
  cpf: string;
}

interface ProtectedSubscriptionPlansProps {
  onPlanSelect: (plan: Plan, paymentMethod: 'credit_card' | 'pix') => void;
  currentPlan?: string;
}

export default function ProtectedSubscriptionPlans({ onPlanSelect, currentPlan }: ProtectedSubscriptionPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | null>(null);
  const [payerData, setPayerData] = useState<PayerData>({
    email: '',
    firstName: '',
    lastName: '',
    cpf: ''
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('subscriptions/plans');
      setPlans(response.data);
    } catch (error: any) {
      console.error('Erro ao buscar planos:', error);
      setError('Erro ao carregar os planos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: Plan, method: 'credit_card' | 'pix') => {
    setSelectedPlan(plan);
    setPaymentMethod(method);
    setError(null);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !paymentMethod) return;

    setPaymentLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const subscriptionData = {
        plan: selectedPlan.id,
        paymentMethod,
        payerData: paymentMethod === 'pix' ? payerData : undefined
      };

      const response = await api.post('subscriptions', subscriptionData);
      const result = response.data;
      setPaymentData(result);

      // Se for PIX, obter QR Code
      if (paymentMethod === 'pix' && result.payment && result.payment.id) {
        try {
          const configurationError = getPaymentApiConfigurationError();
          if (configurationError) {
            throw new Error(configurationError);
          }

          const qrResponse = await paymentApi.get(`payments/pix/qrcode/${result.payment.id}`);
          setPaymentData((prev: any) => ({ ...prev, qrData: qrResponse.data }));
        } catch (qrError: any) {
          console.error('Erro ao obter QR Code:', qrError);
        }
      }

      // Atualizar status (opcional, já que o resultado acima já traz dados)
      await api.get('subscriptions/status');

    } catch (error: any) {
      setError(error.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayerDataChange = (field: keyof PayerData, value: string) => {
    setPayerData((prev: PayerData) => ({ ...prev, [field]: value }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 mb-6 max-w-md mx-auto">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Erro de Autenticação</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Fazer Login para Acessar Planos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
      </div>
    );
  }

  if (!loading && !error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Voltar à Página Inicial
            </Link>
          </div>
        </div>
      </div>
    );
  }

function PlanCard({ 
  plan, 
  currentPlan, 
  isSelected, 
  onSelect 
}: { 
  plan: Plan; 
  currentPlan?: string; 
  isSelected: boolean; 
  onSelect: (plan: Plan, paymentMethod: 'credit_card' | 'pix') => void 
}) {
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getPeriodText = (period: string) => {
    return period === 'year' ? '/ano' : '/mês';
  };

  const handleSelectPlan = (method: 'credit_card' | 'pix') => {
    setPaymentMethod(method);
    setShowPaymentMethods(true);
    onSelect(plan, method);
};

  if (isSelected) {
    return (
      <div className={cn(
        "relative p-8 rounded-2xl border transition-all duration-300",
        "bg-slate-800/50 border-slate-700 opacity-75"
      )}>
        <div className="absolute top-4 right-4">
          <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
            PLANO ATUAL
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
            <span className="text-muted-foreground">{getPeriodText(plan.period)}</span>
          </div>
          {plan.savings && (
            <p className="text-green-400 text-sm font-semibold">{plan.savings}</p>
          )}
          {plan.trialDays > 0 && (
            <p className="text-muted-foreground text-sm mt-2">
              {plan.trialDays} dias grátis
            </p>
          )}
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-lg">Recursos incluídos:</h3>
          {Object.entries(plan.features).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}: {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700 text-xs">
            <Lock className="w-3 h-3" />
            Plano Atual
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative p-8 rounded-2xl border transition-all duration-300 hover:scale-105 hover:shadow-2xl group",
      plan.popular 
        ? "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30 shadow-indigo-500/20" 
        : "bg-slate-800/50 border-slate-700 hover:border-slate-600",
      isSelected && "ring-2 ring-indigo-500"
    )}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-bold">
            <Star className="w-3 h-3 fill-current" />
            MAIS POPULAR
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
        <div className="flex items-baseline justify-center gap-1 mb-2">
          <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
          <span className="text-muted-foreground">{getPeriodText(plan.period)}</span>
        </div>
        {plan.savings && (
          <p className="text-green-400 text-sm font-semibold">{plan.savings}</p>
        )}
        {plan.trialDays > 0 && (
          <p className="text-muted-foreground text-sm mt-2">
            {plan.trialDays} dias grátis
          </p>
        )}
      </div>

      <div className="space-y-3 mb-6">
        <h3 className="font-semibold text-lg">Recursos incluídos:</h3>
        {Object.entries(plan.features).map(([key, value]) => (
          <div key={key} className="flex items-center gap-3">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}: {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
            </span>
          </div>
        ))}
      </div>

      {!showPaymentMethods ? (
        <Button
          onClick={() => setShowPaymentMethods(true)}
          className={cn(
            "w-full h-12 transition-all duration-300",
            plan.popular 
              ? "bg-indigo-500 hover:bg-indigo-600 border-indigo-500 text-white" 
              : "bg-slate-700 hover:bg-slate-600 border-slate-600"
          )}
        >
          {plan.price > 0 ? `Assinar ${plan.name}` : 'Começar Teste Grátis'}
        </Button>
      ) : (
        <div className="space-y-3">
          <Button
            onClick={() => handleSelectPlan('credit_card')}
            className={cn(
              "w-full h-10 transition-all duration-300",
              "bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
            )}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Cartão de Crédito
          </Button>
          
          <Button
            onClick={() => handleSelectPlan('pix')}
            className={cn(
              "w-full h-10 transition-all duration-300",
              "bg-green-600 hover:bg-green-700 border-green-600 text-white"
            )}
          >
            <QrCode className="w-4 h-4 mr-2" />
            PIX
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setShowPaymentMethods(false);
              setPaymentMethod(null);
            }}
            className="w-full h-10 border-slate-600 hover:bg-slate-800"
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
}
