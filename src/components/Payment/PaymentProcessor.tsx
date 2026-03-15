'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/UI';
import { CreditCard, QrCode, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import api from '@/lib/api';
import { useMercadoPago } from '@/hooks/useMercadoPago';

interface PaymentData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface PaymentProcessorProps {
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    period: string;
  };
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  initialPayerData?: PaymentData;
  onPayerDataChange?: (data: PaymentData) => void;
  initialPaymentResult?: any;
  onPaymentResultChange?: (result: any) => void;
}

export default function PaymentProcessor({ 
  plan, 
  onSuccess, 
  onError, 
  onCancel,
  initialPayerData,
  onPayerDataChange,
  initialPaymentResult,
  onPaymentResultChange
}: PaymentProcessorProps) {
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');
  const [paymentData, setPaymentData] = useState<PaymentData>(initialPayerData || {
    email: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(initialPaymentResult || null);
  
  const { createPayment, getPixQrCode, isReady } = useMercadoPago();

  // Sync state up when it changes locally
  useEffect(() => {
    if (onPayerDataChange) onPayerDataChange(paymentData);
  }, [paymentData, onPayerDataChange]);

  useEffect(() => {
    if (onPaymentResultChange) onPaymentResultChange(paymentResult);
  }, [paymentResult, onPaymentResultChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!paymentData.email) errors.push('Email é obrigatório');
    if (!paymentData.firstName) errors.push('Nome é obrigatório');
    if (!paymentData.lastName) errors.push('Sobrenome é obrigatório');
    if (!paymentData.phone) errors.push('Telefone é obrigatório');

    if (paymentData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.email)) {
      errors.push('Email inválido');
    }

    if (paymentData.phone && !/^(\d{10,11})$/.test(paymentData.phone.replace(/\D/g, ''))) {
      errors.push('Telefone deve ter 10 ou 11 dígitos');
    }

    if (errors.length > 0) {
      onError(errors.join(', '));
      return false;
    }

    return true;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      if (cleaned.length <= 10) {
        return cleaned
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      } else {
        return cleaned
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2');
      }
    }
    return value;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Poderia mostrar um toast aqui
    });
  };

  const processCreditCardPayment = async () => {
    if (!validateForm()) return;
    if (!isReady) {
      onError('Mercado Pago ainda não está pronto. Verifique sua conexão ou configurações.');
      return;
    }

    setLoading(true);
    try {
      const result = await createPayment({
        orderId: `plan_${plan.id}_${Date.now()}`,
        amount: plan.price,
        description: `Plano ${plan.name} - ${plan.period}`,
        paymentMethod: 'credit_card',
        payerData: {
          payerEmail: paymentData.email,
          payerFirstName: paymentData.firstName,
          payerLastName: paymentData.lastName,
          payerPhone: paymentData.phone
        }
      });
      
      // Armazenar o resultado para mostrar o botão "Pagar"
      // Não chamar onSuccess automaticamente para evitar bloqueio de popup
      setPaymentResult({
        type: 'credit_card',
        preferenceId: result.preferenceId,
        initPoint: result.initPoint,
        amount: plan.price,
        paymentId: result.paymentId || result.id,
        sandbox: result.sandbox
      });
      
      // Tentar abrir popup (pode ser bloqueado)
      try {
        const popup = window.open(result.initPoint, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // Se popup foi bloqueado, redirecionar para mesma aba
          console.warn('Popup bloqueado, redirecionando para mesma aba');
          window.location.href = result.initPoint;
        }
      } catch (e) {
        console.warn('Erro ao abrir popup, redirecionando para mesma aba:', e);
        window.location.href = result.initPoint;
      }
    } catch (error: any) {
      onError(error.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const processPixPayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await createPayment({
        orderId: `plan_${plan.id}_${Date.now()}`,
        amount: plan.price,
        description: `Plano ${plan.name} - ${plan.period}`,
        paymentMethod: 'pix',
        payerData: {
          payerEmail: paymentData.email,
          payerFirstName: paymentData.firstName,
          payerLastName: paymentData.lastName,
          payerPhone: paymentData.phone
        }
      });
      
      // Obter QR Code
      const qrData = await getPixQrCode(result.paymentId);
      
      setPaymentResult({
        type: 'pix',
        paymentId: result.paymentId,
        qrCode: qrData.qrCode,
        qrCodeText: qrData.qrCodeText,
        copyAndPasteKey: qrData.copyAndPasteKey,
        expirationDate: qrData.expirationDate,
        amount: qrData.amount
      });
    } catch (error: any) {
      onError(error.message || 'Erro ao processar pagamento PIX');
    } finally {
      setLoading(false);
    }
  };

  // Renderização do pagamento PIX
  if (paymentResult && paymentResult.type === 'pix') {
    return (
      <div className="max-w-md mx-auto p-6 bg-slate-900 rounded-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Pagamento PIX Gerado</h3>
          <p className="text-muted-foreground">
            Escaneie o QR Code ou copie a chave PIX
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            {paymentResult.qrCode && (
              <img 
                src={`data:image/png;base64,${paymentResult.qrCode}`}
                alt="QR Code PIX"
                className="w-48 h-48 bg-white p-2 rounded"
              />
            )}
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Chave PIX (copiar e colar):</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={paymentResult.copyAndPasteKey}
                readOnly
                className="flex-1 bg-slate-700 px-3 py-2 rounded text-sm font-mono"
              />
              <Button
                onClick={() => copyToClipboard(paymentResult.copyAndPasteKey)}
                variant="outline"
                size="sm"
              >
                Copiar
              </Button>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Valor: <span className="font-bold">{formatPrice(paymentResult.amount)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Expira em: {new Date(paymentResult.expirationDate).toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                // Verificar status do pagamento
                api.get(`payments/pix/status/${paymentResult.paymentId}`)
                  .then(response => {
                    const data = response.data;
                    if (data.status === 'approved') {
                      onSuccess(data);
                    } else {
                      onError('Pagamento ainda não confirmado');
                    }
                  })
                  .catch(err => {
                    console.error('Erro ao verificar status:', err);
                    onError('Erro ao verificar status');
                  });
              }}
              className="flex-1"
            >
              Verificar
            </Button>
            <Button
              onClick={() => setPaymentResult(null)}
              variant="outline"
              className="flex-1"
            >
              Alterar Meio
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Renderização do pagamento com cartão
  if (paymentResult && paymentResult.type === 'credit_card') {
    return (
      <div className="max-w-md mx-auto p-6 bg-slate-900 rounded-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Pagamento com Cartão de Crédito</h3>
          <p className="text-muted-foreground">
            Complete o pagamento no checkout seguro do Mercado Pago
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Resumo do Pagamento</h4>
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
            </div>
          </div>

          {paymentResult.sandbox && (
            <div className="bg-blue-500/20 border border-blue-500/30 p-3 rounded-lg text-xs text-blue-300">
              <p className="font-bold mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> AMBIENTE DE TESTES (SANDBOX)
              </p>
              <p>Utilize apenas cartões de teste do Mercado Pago. Cartões reais serão recusados.</p>
              <a 
                href="https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline mt-1 block hover:text-blue-200"
              >
                Ver cartões de teste
              </a>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                window.open(paymentResult.initPoint, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                // Transition to status monitoring screen
                onSuccess(paymentResult);
              }}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pagar no Mercado Pago
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setPaymentResult(null)}
                variant="outline"
              >
                Alterar Meio
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
            
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              Ao clicar em pagar, uma nova janela abrirá. Após concluir o pagamento, volte aqui para ver a confirmação.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-900 rounded-lg">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Finalizar Pagamento</h3>
        <div className="bg-slate-800 p-4 rounded-lg">
          <p className="font-semibold">{plan.name}</p>
          <p className="text-2xl font-bold">{formatPrice(plan.price)}</p>
          <p className="text-muted-foreground">{plan.period}</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Forma de Pagamento</label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => setPaymentMethod('credit_card')}
            variant={paymentMethod === 'credit_card' ? 'primary' : 'outline'}
            className="flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Cartão de Crédito
          </Button>
          <Button
            onClick={() => setPaymentMethod('pix')}
            variant={paymentMethod === 'pix' ? 'primary' : 'outline'}
            className="flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            PIX
          </Button>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <label className="block text-sm font-medium mb-2">Dados do Pagador</label>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={paymentData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Seu e-mail"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Primeiro nome</label>
              <input
                type="text"
                name="firstName"
                value={paymentData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Seu primeiro nome"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sobrenome</label>
              <input
                type="text"
                name="lastName"
                value={paymentData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Seu sobrenome"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input
              type="tel"
              name="phone"
              value={paymentData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          onClick={paymentMethod === 'credit_card' ? processCreditCardPayment : processPixPayment}
          disabled={loading || !isReady}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando Pagamento...
            </>
          ) : !isReady ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Carregando Mercado Pago...
            </>
          ) : (
            <>
              {paymentMethod === 'credit_card' ? (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagar com Cartão
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerar PIX
                </>
              )}
            </>
          )}
        </Button>

        {!isReady && !loading && (
          <p className="text-center text-[10px] text-yellow-500 mt-2">
            O sistema de pagamentos está demorando. 
            <button 
              onClick={() => window.location.reload()} 
              className="ml-1 underline hover:text-yellow-400"
            >
              Recarregar página
            </button>
          </p>
        )}
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={loading}
          className="w-full"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
