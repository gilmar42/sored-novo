'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/UI';
import { Check, Star, CreditCard, QrCode } from 'lucide-react';
import { cn } from '@/utils/cn';
import api from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  trialDays: number;
  features: {
    maxUsers: number;
    maxProjects: number;
    maxMaterials: number;
    apiAccess: boolean;
    advancedReports: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    dataExport: boolean;
  };
  savings?: string;
  popular: boolean;
}

interface SubscriptionPlansProps {
  onPlanSelect?: (plan: Plan, paymentMethod: 'credit_card' | 'pix') => void;
  currentPlan?: string;
}

export default function SubscriptionPlans({ onPlanSelect, currentPlan }: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('subscriptions/plans');
      setPlans(response.data);
    } catch (error: any) {
      console.error('Erro ao buscar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: Plan, paymentMethod: 'credit_card' | 'pix') => {
    setSelectedPlan(plan);
    if (onPlanSelect) {
      onPlanSelect(plan, paymentMethod);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Escolha seu plano</h2>
        <p className="text-muted-foreground">
          Comece com 5 dias grátis. Cancele quando quiser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
            isSelected={selectedPlan?.id === plan.id}
            onSelect={handlePlanSelect}
          />
        ))}
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  currentPlan?: string;
  isSelected: boolean;
  onSelect: (plan: Plan, paymentMethod: 'credit_card' | 'pix') => void;
}

function PlanCard({ plan, currentPlan, isSelected, onSelect }: PlanCardProps) {
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  const isCurrentPlan = currentPlan === plan.id;
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getPeriodText = (period: string) => {
    return period === 'year' ? '/ano' : '/mês';
  };

  const getFeatureIcon = (hasFeature: boolean) => (
    <Check className={cn(
      "w-4 h-4 flex-shrink-0",
      hasFeature ? "text-green-500" : "text-gray-400"
    )} />
  );

  return (
    <div className={cn(
      "relative p-6 rounded-2xl border transition-all duration-300",
      plan.popular 
        ? "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30 shadow-indigo-500/20" 
        : "bg-slate-800/50 border-slate-700 hover:border-slate-600",
      isSelected && "ring-2 ring-indigo-500",
      isCurrentPlan && "opacity-75"
    )}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-bold">
            <Star className="w-3 h-3 fill-current" />
            MAIS POPULAR
          </div>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute top-4 right-4">
          <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
            PLANO ATUAL
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
        <div className="flex items-center gap-2">
          {getFeatureIcon(true)}
          <span className="text-sm">{plan.features.maxUsers} usuário(s)</span>
        </div>
        <div className="flex items-center gap-2">
          {getFeatureIcon(true)}
          <span className="text-sm">{plan.features.maxProjects} projetos</span>
        </div>
        <div className="flex items-center gap-2">
          {getFeatureIcon(true)}
          <span className="text-sm">{plan.features.maxMaterials} materiais</span>
        </div>
        <div className="flex items-center gap-2">
          {getFeatureIcon(plan.features.apiAccess)}
          <span className="text-sm">Acesso à API</span>
        </div>
        <div className="flex items-center gap-2">
          {getFeatureIcon(plan.features.advancedReports)}
          <span className="text-sm">Relatórios avançados</span>
        </div>
        <div className="flex items-center gap-2">
          {getFeatureIcon(plan.features.prioritySupport)}
          <span className="text-sm">Suporte prioritário</span>
        </div>
        <div className="flex items-center gap-2">
          {getFeatureIcon(plan.features.customBranding)}
          <span className="text-sm">Branding personalizado</span>
        </div>
        <div className="flex items-center gap-2">
          {getFeatureIcon(plan.features.dataExport)}
          <span className="text-sm">Exportação de dados</span>
        </div>
      </div>

      {plan.price > 0 && !isCurrentPlan ? (
        <div className="space-y-2">
          <Button
            onClick={() => onSelect(plan, 'credit_card')}
            className={cn(
              "w-full h-12 transition-all duration-300",
              plan.popular === true
                ? "bg-indigo-500 hover:bg-indigo-600 border-indigo-500 text-white" 
                : "bg-slate-700 hover:bg-slate-600 border-slate-600"
            )}
          >
            Assinar agora
          </Button>
          
          {showPaymentMethods && (
            <div className="space-y-2">
              <Button
                onClick={() => onSelect(plan, 'credit_card')}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 border-blue-600 text-white flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Cartão de Crédito
              </Button>
              <Button
                onClick={() => onSelect(plan, 'pix')}
                className="w-full h-10 bg-green-600 hover:bg-green-700 border-green-600 text-white flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                PIX
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPaymentMethods(false)}
                className="w-full h-10 border-slate-600 hover:bg-slate-800"
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Button
          disabled={isCurrentPlan}
          className={cn(
            "w-full h-12 transition-all duration-300",
            isCurrentPlan 
              ? "bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 border-green-600 text-white"
          )}
        >
          {isCurrentPlan ? 'Plano Atual' : 'Começar Gratuitamente'}
        </Button>
      )}
    </div>
  );
}
