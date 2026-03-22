'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/UI';
import { Check, X, Clock, AlertCircle, Loader2, RefreshCw, CreditCard, QrCode } from 'lucide-react';
import { cn } from '@/utils/cn';
import paymentApi, { getPaymentApiConfigurationError } from '@/lib/paymentApi';

interface PaymentStatusProps {
  paymentId: string;
  onPaymentConfirmed: (paymentData: any) => void;
  onPaymentFailed: (error: string) => void;
  onCancel: () => void;
  onBack?: () => void;
  paymentData?: any;
}

type PaymentStatusType = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'error';

export default function PaymentStatus({ paymentId, onPaymentConfirmed, onPaymentFailed, onCancel, onBack, paymentData: initialPaymentData }: PaymentStatusProps) {
  const [status, setStatus] = useState<PaymentStatusType>('pending');
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(initialPaymentData || null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchPaymentStatus = async () => {
    try {
      const configurationError = getPaymentApiConfigurationError();
      if (configurationError) {
        throw new Error(configurationError);
      }

      // Verificar status do pagamento usando o endpoint genérico
      const response = await paymentApi.get(`payments/status/${paymentId}`);
      const data = response.data;
      
      // Mapear status do Mercado Pago (se retornou objeto do MP)
      const mpStatus = data.status;
      
      if (mpStatus === 'approved') {
        setPaymentData(data);
        setStatus('approved');
        setAutoRefresh(false);
        onPaymentConfirmed(data);
      } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
        setPaymentData(data);
        setStatus(mpStatus as any);
        setAutoRefresh(false);
        onPaymentFailed(`Pagamento ${mpStatus === 'rejected' ? 'rejeitado' : 'cancelado'}`);
      } else {
        setStatus('pending');
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      setStatus('error');
      // Não falhar imediatamente no auto-refresh, pode ser erro temporário
      if (!autoRefresh) {
        onPaymentFailed('Erro ao verificar status do pagamento');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentStatus();
  }, [paymentId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchPaymentStatus();
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, [autoRefresh, paymentId]);

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-8 h-8 text-yellow-400" />;
      case 'approved':
        return <Check className="w-8 h-8 text-green-400" />;
      case 'rejected':
        return <X className="w-8 h-8 text-red-400" />;
      case 'cancelled':
        return <X className="w-8 h-8 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-400" />;
      default:
        return <Clock className="w-8 h-8 text-yellow-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Pagamento Pendente';
      case 'approved':
        return 'Pagamento Aprovado';
      case 'rejected':
        return 'Pagamento Rejeitado';
      case 'cancelled':
        return 'Pagamento Cancelado';
      case 'error':
        return 'Erro no Pagamento';
      default:
        return 'Verificando Status';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'pending':
        return 'Seu pagamento está sendo processado. Isso pode levar alguns instantes.';
      case 'approved':
        return 'Pagamento confirmado com sucesso! Você já pode acessar todos os recursos.';
      case 'rejected':
        return 'Seu pagamento foi rejeitado. Verifique os dados e tente novamente.';
      case 'cancelled':
        return 'Pagamento cancelado. Você pode tentar novamente quando quiser.';
      case 'error':
        return 'Ocorreu um erro ao processar seu pagamento. Tente novamente.';
      default:
        return 'Verificando o status do seu pagamento...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      case 'approved':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'cancelled':
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
      case 'error':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      default:
        return 'bg-slate-500/20 border-slate-500/30 text-slate-400';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-slate-900 rounded-lg text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Verificando status do pagamento...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-900 rounded-lg">
      <div className={cn(
        "flex flex-col items-center text-center p-6 rounded-lg border mb-6",
        getStatusColor()
      )}>
        {getStatusIcon()}
        <h3 className="text-xl font-bold mt-4 mb-2">{getStatusText()}</h3>
        <p className="text-sm">{getStatusDescription()}</p>
      </div>

      {paymentData && (
        <div className="space-y-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Detalhes do Pagamento</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID do Pagamento:</span>
                <span className="font-mono">{paymentData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-semibold">
                  {paymentData.transaction_amount ? formatPrice(paymentData.transaction_amount) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método:</span>
                <span className="capitalize">
                  {paymentData.payment_method_id === 'pix' ? 'PIX' : paymentData.payment_method_id || 'N/A'}
                </span>
              </div>
              {paymentData.date_approved && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Aprovação:</span>
                  <span>{new Date(paymentData.date_approved).toLocaleString('pt-BR')}</span>
                </div>
              )}
              {paymentData.date_of_expiration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expira em:</span>
                  <span>{new Date(paymentData.date_of_expiration).toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(status === 'pending') && (paymentData?.initPoint || paymentData?.init_point) && (
        <div className="bg-blue-900/30 border-2 border-blue-500 rounded-xl p-5 mb-6 text-center animate-pulse">
          <p className="text-blue-300 text-sm font-semibold mb-3">
            Aguardando conclusão do pagamento...
          </p>
          <p className="text-blue-400 text-xs mb-4">
            A janela de pagamento não abriu ou foi fechada?
          </p>
          <Button 
            onClick={() => window.open(paymentData.initPoint || paymentData.init_point, '_blank', 'width=800,height=600')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 shadow-lg shadow-blue-900/50"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            ABRIR MERCADO PAGO NOVAMENTE
          </Button>
          
          <p className="mt-4 text-[10px] text-slate-400">
            Dica: Se você não conseguir pagar, certifique-se de não estar logado no Mercado Pago com a mesma conta que criou as chaves da API.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {status === 'pending' && (
          <Button
            onClick={fetchPaymentStatus}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        )}
        
        {(status === 'rejected' || status === 'cancelled' || status === 'error') && (
          <Button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
        )}
        
        {status === 'pending' && onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            className="flex-1 text-blue-400 hover:text-blue-300"
          >
            Alterar Meio
          </Button>
        )}
        
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          {status === 'approved' ? 'Continuar' : 'Cancelar'}
        </Button>
      </div>

      {status === 'pending' && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Esta página será atualizada automaticamente. Não feche esta janela.
          </p>
        </div>
      )}
    </div>
  );
}
