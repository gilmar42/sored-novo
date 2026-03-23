'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/UI';
import { CreditCard, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CustomCheckoutProps {
  plan: any;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export default function CustomCheckout({ plan, onSuccess, onError, onCancel }: CustomCheckoutProps) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    email: '',
    cpf: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Número do cartão inválido';
    }

    if (!formData.cardholderName) {
      newErrors.cardholderName = 'Nome do titular é obrigatório';
    }

    if (!formData.expiryDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Data de validade inválida (MM/AA)';
    }

    if (!formData.cvv || formData.cvv.length !== 3) {
      newErrors.cvv = 'CVV inválido';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.cpf || !/^\d{11}$/.test(formData.cpf.replace(/\D/g, ''))) {
      newErrors.cpf = 'CPF inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      onError('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      // Simular processamento do pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Criar dados do pagamento
      const paymentData = {
        id: `custom_${Date.now()}`,
        status: 'approved',
        amount: plan.price,
        description: plan.name,
        paymentMethod: 'credit_card',
        cardNumber: formData.cardNumber.replace(/\s/g, '').slice(-4),
        cardholderName: formData.cardholderName,
        email: formData.email,
        cpf: formData.cpf,
        dateCreated: new Date().toISOString(),
        installments: 1,
        type: 'Pagamento Único'
      };

      // Salvar no localStorage antes de redirecionar
      localStorage.setItem('lastPayment', JSON.stringify({
        ...paymentData,
        timestamp: new Date().toISOString()
      }));

      onSuccess(paymentData);

      // Redirecionar diretamente para página de sucesso
      window.location.href = '/payment-success';
      
    } catch (error: any) {
      onError(error.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-900 rounded-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
          <CreditCard className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Pagamento Seguro</h2>
        <p className="text-muted-foreground">
          Pagamento único e sem parcelas - Nenhuma taxa adicional
        </p>
      </div>

      {/* Alertas */}
      <div className="space-y-4 mb-6">
        <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="font-semibold text-green-400">PAGAMENTO ÚNICO</span>
          </div>
          <p className="text-sm text-green-300">
            Este pagamento será processado como débito único (à vista). Sem parcelas disponíveis.
          </p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="font-semibold text-red-400">SEM CUPONS</span>
          </div>
          <p className="text-sm text-red-300">
            O sistema não utiliza cupons de desconto. O preço final é exibido abaixo.
          </p>
        </div>
      </div>

      {/* Resumo */}
      <Card className="mb-6 bg-slate-800/50 border-slate-700">
        <div className="p-4">
          <h3 className="font-semibold mb-3">Resumo da Compra</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Plano:</span>
              <span className="font-semibold">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Período:</span>
              <span className="font-semibold">{plan.period}</span>
            </div>
            <div className="flex justify-between">
              <span>Tipo:</span>
              <span className="font-semibold text-green-400">Pagamento Único</span>
            </div>
            <div className="border-t border-slate-600 pt-2 mt-2">
              <div className="flex justify-between text-lg">
                <span>Total:</span>
                <span className="font-bold text-green-400">{formatPrice(plan.price)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Cartão */}
        <div>
          <h3 className="font-semibold mb-4">Dados do Cartão</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Número do Cartão</label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                className={cn(
                  "w-full px-3 py-2 bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.cardNumber ? "border-red-500" : "border-slate-700"
                )}
              />
              {errors.cardNumber && (
                <p className="text-red-400 text-sm mt-1">{errors.cardNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nome do Titular</label>
              <input
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleInputChange}
                placeholder="Nome como está no cartão"
                className={cn(
                  "w-full px-3 py-2 bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.cardholderName ? "border-red-500" : "border-slate-700"
                )}
              />
              {errors.cardholderName && (
                <p className="text-red-400 text-sm mt-1">{errors.cardholderName}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Validade</label>
                <input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  placeholder="MM/AA"
                  maxLength={5}
                  className={cn(
                    "w-full px-3 py-2 bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.expiryDate ? "border-red-500" : "border-slate-700"
                  )}
                />
                {errors.expiryDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.expiryDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CVV</label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  maxLength={4}
                  className={cn(
                    "w-full px-3 py-2 bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.cvv ? "border-red-500" : "border-slate-700"
                  )}
                />
                {errors.cvv && (
                  <p className="text-red-400 text-sm mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dados Pessoais */}
        <div>
          <h3 className="font-semibold mb-4">Dados Pessoais</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="seu@email.com"
                className={cn(
                  "w-full px-3 py-2 bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.email ? "border-red-500" : "border-slate-700"
                )}
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">CPF</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                placeholder="000.000.000-00"
                maxLength={14}
                className={cn(
                  "w-full px-3 py-2 bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.cpf ? "border-red-500" : "border-slate-700"
                )}
              />
              {errors.cpf && (
                <p className="text-red-400 text-sm mt-1">{errors.cpf}</p>
              )}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar à Vista {formatPrice(plan.price)}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Segurança */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          <span>Pagamento 100% seguro e criptografado</span>
        </div>
      </div>
    </div>
  );
}
