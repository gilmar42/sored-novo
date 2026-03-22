'use client';

import { useState } from 'react';

import paymentApi, { getPaymentApiConfigurationError } from '@/lib/paymentApi';

interface MercadoPagoConfig {
  publicKey: string;
  isConfigured: boolean;
}

export const useMercadoPago = () => {
  const [config] = useState<MercadoPagoConfig>({
    publicKey: process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '',
    // O fluxo atual usa checkout redirect e PIX server-side.
    // A chave pública não é necessária para liberar a criação do pagamento.
    isConfigured: true
  });

  const createPayment = async (paymentData: {
    orderId: string;
    amount: number;
    description: string;
    paymentMethod: 'credit_card' | 'pix';
    payerData?: {
      payerEmail: string;
      payerFirstName: string;
      payerLastName: string;
      payerPhone: string;
    };
  }) => {
    try {
      const configurationError = getPaymentApiConfigurationError();
      if (configurationError) {
        throw new Error(configurationError);
      }

      const endpoint = paymentData.paymentMethod === 'pix' 
        ? 'payments/pix/create' 
        : 'payments/checkout';

      const response = await paymentApi.post(endpoint, {
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        description: paymentData.description,
        // Evita voltar para uma rota protegida e acabar redirecionando para /login
        returnUrl: `${window.location.origin}/payment-success`,
        paymentMethod: paymentData.paymentMethod,
        ...(paymentData.payerData ? paymentData.payerData : {})
      });

      const data = response.data;

      return data;
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      const status = error.response?.status;
      const backendError =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.details;
      throw new Error(
        backendError ||
          (status ? `Erro ao processar pagamento (HTTP ${status})` : 'Erro ao processar pagamento')
      );
    }
  };

  const getPixQrCode = async (paymentId: string) => {
    try {
      const configurationError = getPaymentApiConfigurationError();
      if (configurationError) {
        throw new Error(configurationError);
      }

      const response = await paymentApi.get(`payments/pix/qrcode/${paymentId}`);
      const data = response.data;

      return data;
    } catch (error: any) {
      console.error('Erro ao obter QR Code:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Erro ao obter QR Code');
    }
  };

  const getPaymentStatus = async (paymentId: string) => {
    try {
      const configurationError = getPaymentApiConfigurationError();
      if (configurationError) {
        throw new Error(configurationError);
      }

      const response = await paymentApi.get(`payments/status/${paymentId}`);
      const data = response.data;

      return data;
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Erro ao verificar status');
    }
  };

  return {
    config,
    loading: false,
    createPayment,
    getPixQrCode,
    getPaymentStatus,
    isReady: true
  };
};
