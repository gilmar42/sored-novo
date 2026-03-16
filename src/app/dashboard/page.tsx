'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/UI';
import { 
  Users, 
  Package, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, cn } from '@/utils/cn';

interface DashboardStats {
  overview: {
    totalClients: number;
    totalMaterials: number;
    totalLabor: number;
    totalMachines: number;
    totalBudgets: number;
  };
  budgetStats: {
    totalValue: number;
    draftCount: number;
    sentCount: number;
    approvedCount: number;
    rejectedCount: number;
    avgBudgetValue: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastPayment, setLastPayment] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    checkLastPayment();
  }, []);

  const checkLastPayment = () => {
    const savedPayment = localStorage.getItem('lastPayment');
    if (savedPayment) {
      try {
        const payment = JSON.parse(savedPayment);
        const paymentTime = new Date(payment.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - paymentTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff <= 1) {
          setLastPayment(payment);
        } else {
          localStorage.removeItem('lastPayment');
        }
      } catch (error) {
        localStorage.removeItem('lastPayment');
      }
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Orçado', 
      value: formatCurrency(stats?.budgetStats.totalValue || 0), 
      icon: TrendingUp, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/20',
      trend: '+12.5%',
      isPositive: true
    },
    { 
      title: 'Orçamentos', 
      value: stats?.overview.totalBudgets || 0, 
      icon: FileText, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/20',
      trend: '+5',
      isPositive: true
    },
    { 
      title: 'Clientes', 
      value: stats?.overview.totalClients || 0, 
      icon: Users, 
      color: 'text-cyan-400', 
      bg: 'bg-cyan-500/20',
      trend: '+2',
      isPositive: true
    },
    { 
      title: 'Materiais', 
      value: stats?.overview.totalMaterials || 0, 
      icon: Package, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/20',
      trend: '+8',
      isPositive: true
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensagem de Boas-vindas */}
        {lastPayment && (
          <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-lg mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-green-400 mb-1">
                  Bem-vindo ao SORED!
                </h2>
                <p className="text-green-300">
                  Seu pagamento foi aprovado com sucesso. Você agora tem acesso total ao sistema.
                </p>
                <div className="mt-2 text-sm text-green-200">
                  Plano: {lastPayment.description} | Valor: R$ {lastPayment.amount.toFixed(2)} | 
                  ID: {lastPayment.id}
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('lastPayment');
                  setLastPayment(null);
                }}
                className="text-green-400 hover:text-green-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground text-sm">Bem-vindo ao seu painel de controle industrial.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <Card key={i} className="relative overflow-hidden group border-none bg-slate-900/40 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">{card.title}</p>
                <h3 className="text-2xl font-bold">{card.value}</h3>
                <div className={cn(
                  "mt-2 flex items-center text-xs font-semibold px-2 py-0.5 rounded-full",
                  card.isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  {card.isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {card.trend}
                </div>
              </div>
              <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110 duration-200 bg-slate-800/50")}>
                <card.icon className={cn("w-6 h-6", card.color)} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Status dos Orçamentos" className="lg:col-span-1">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-800/50">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-400 mr-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Aprovados</span>
              </div>
              <span className="text-lg font-bold">{stats?.budgetStats.approvedCount || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-800/50">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mr-3">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Enviados</span>
              </div>
              <span className="text-lg font-bold">{stats?.budgetStats.sentCount || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-800/50">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-slate-700/50 text-slate-300 mr-3">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Rascunhos</span>
              </div>
              <span className="text-lg font-bold">{stats?.budgetStats.draftCount || 0}</span>
            </div>
          </div>
        </Card>

        <Card title="Valor Médio por Proposta" className="lg:col-span-2">
          <div className="h-[200px] flex items-center justify-center flex-col text-slate-400">
            <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-3xl font-bold text-indigo-600">{formatCurrency(stats?.budgetStats.avgBudgetValue || 0)}</p>
            <p className="text-sm">Ticket médio das propostas comerciais</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
