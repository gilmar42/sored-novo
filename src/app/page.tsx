'use client';

import { Card, Button } from '@/components/UI';
import { Package, Clock, Calculator, ArrowRight, Zap, Check, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/utils/cn';
import SubscriptionPlans from '@/components/SubscriptionPlans';
import PaymentProcessor from '@/components/Payment/PaymentProcessor';
import React, { useState } from 'react';

export default function Home() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const handlePlanSelect = (plan: any, _method: string) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Pagamento sucesso:', paymentData);
    setShowPaymentModal(false);
    setSelectedPlan(null);
    // Aqui você pode redirecionar para página de sucesso ou mostrar mensagem
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
    <main className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto px-4 py-20 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Zap className="w-3 h-3 fill-current" />
            Nova Versão 2.0 Disponível
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-[length:200%_auto] animate-gradient">
              SORED
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Sistema de Orçamento Rápido Industrial. Aumente a precisão e velocidade das suas propostas comerciais.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link href="/subscription" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 px-8 premium-gradient border-none group">
                Ver Planos e Preços
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          <FeatureCard 
            icon={Package} 
            title="Materiais" 
            description="Cadastre componentes, insumos e matérias-primas com cálculos automáticos de custo por peso, medida ou volume."
            color="indigo"
          />
          <FeatureCard 
            icon={Clock} 
            title="Mão de Obra" 
            description="Controle o custo por função e tempo estimado para cada operação industrial de forma simplificada."
            color="purple"
          />
          <FeatureCard 
            icon={Calculator} 
            title="Máquinas" 
            description="Integre o custo operacional de cada equipamento diretamente nos seus orçamentos industriais."
            color="emerald"
          />
        </div>

        {/* Planos e Preços */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Planos e Preços</h2>
            <p className="text-xl text-muted-foreground">
              Escolha o plano ideal para o seu negócio industrial
            </p>
          </div>

          <SubscriptionPlans onPlanSelect={handlePlanSelect} />
        </div>

        {/* Modal de Pagamento */}
        {showPaymentModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold">Finalizar Assinatura</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePaymentCancel}
                >
                  <X className="w-4 h-4" />
                </Button>
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

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            <Check className="inline w-4 h-4 text-green-500 mr-2" />
            5 dias de teste grátis em todos os planos
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Sem taxas de setup. Cancele quando quiser.
          </p>
        </div>
      </div>
    </main>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  color: 'indigo' | 'purple' | 'emerald';
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  const colorClasses = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
  };

  return (
    <Card className="relative overflow-hidden group border-none bg-slate-900/40 backdrop-blur-sm">
      <div className="p-6">
        <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-105 duration-300", colorClasses[color])}>
          <div className="w-8 h-8 mb-4">
            {React.createElement(icon, { className: "w-full h-full" })}
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
}
