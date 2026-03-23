'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/UI';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SubscriptionPlans from '@/components/SubscriptionPlans';
import SubscriptionPayment from '@/components/Payment/SubscriptionPayment';
import { cn } from '@/utils/cn';
import api from '@/lib/api';

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

export default function SubscriptionPage() {
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('subscriptions/status');
      setCurrentStatus(response.data);
    } catch (error: any) {
      console.error('Erro ao buscar status da assinatura:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: Plan, _method: 'credit_card' | 'pix') => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setSelectedPlan(null);
    fetchSubscriptionStatus(); // Atualizar status após pagamento
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setSelectedPlan(null);
  };

  // Se estiver mostrando o componente de pagamento, renderizá-lo
  if (showPayment && selectedPlan) {
    return (
      <SubscriptionPayment
        plan={selectedPlan}
        onComplete={handlePaymentComplete}
        onCancel={handlePaymentCancel}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Renderização principal da página
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Voltar à Página Inicial
          </Link>
        </div>

        {/* Status da Assinatura */}
        {currentStatus && (
          <Card className="mb-8 border-slate-700 bg-slate-800/50">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Status da Assinatura</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plano Atual</p>
                  <p className="font-semibold">
                    {currentStatus.plan?.name || 'Nenhum plano ativo'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      currentStatus.status === 'active' ? "bg-green-500" : "bg-yellow-500"
                    )}></div>
                    <span className="font-semibold capitalize">
                      {currentStatus.status === 'active' ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
                {currentStatus.plan?.trialDays > 0 && currentStatus.status === 'trial' && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Trial Restante</p>
                    <p className="font-semibold text-yellow-400">
                      {currentStatus.trialDaysRemaining} dias restantes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Planos Disponíveis */}
        <SubscriptionPlans 
          onPlanSelect={handlePlanSelect}
          currentPlan={currentStatus?.plan?.id}
        />
      </div>
    </div>
  );
}
