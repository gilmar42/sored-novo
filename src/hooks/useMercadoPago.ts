'use client';

import { useState, useEffect } from 'react';

import api from '@/lib/api';

interface MercadoPagoConfig {
  publicKey: string;
  isConfigured: boolean;
}

export const useMercadoPago = () => {
  const [config, setConfig] = useState<MercadoPagoConfig>({
    publicKey: '',
    isConfigured: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await api.get('payments/public-key');
        const data = response.data;
        
        if (data.publicKey) {
          setConfig({
            publicKey: data.publicKey,
            isConfigured: true
          });
          
          // Carregar SDK do Mercado Pago
          loadMercadoPagoSDK(data.publicKey);
        } else {
          setConfig({
            publicKey: '',
            isConfigured: false
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configuração do Mercado Pago:', error);
        setConfig({
          publicKey: '',
          isConfigured: false
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const loadMercadoPagoSDK = (publicKey: string) => {
    if (typeof window === 'undefined') return;

    const initSDK = () => {
      if (window.MercadoPago && !window.mercadopago) {
        try {
          window.mercadopago = new window.MercadoPago(publicKey);
          console.log('[MercadoPago] SDK instanciado com sucesso');
        } catch (e) {
          console.error('[MercadoPago] erro ao instanciar:', e);
        }
      }
    };

    if (!window.MercadoPago) {
      console.log('[MercadoPago] carregando script v2...');
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => {
        console.log('[MercadoPago] script v2 carregado');
        initSDK();
      };
      script.onerror = (e) => console.error('[MercadoPago] erro ao carregar script:', e);
      document.body.appendChild(script);
    } else {
      initSDK();
    }
  };

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
      const endpoint = paymentData.paymentMethod === 'pix' 
        ? 'payments/pix/create' 
        : 'payments/checkout';

      const response = await api.post(endpoint, {
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
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Erro ao processar pagamento');
    }
  };

  const getPixQrCode = async (paymentId: string) => {
    try {
      const response = await api.get(`payments/pix/qrcode/${paymentId}`);
      const data = response.data;

      return data;
    } catch (error: any) {
      console.error('Erro ao obter QR Code:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Erro ao obter QR Code');
    }
  };

  const getPaymentStatus = async (paymentId: string) => {
    try {
      const response = await api.get(`payments/status/${paymentId}`);
      const data = response.data;

      return data;
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Erro ao verificar status');
    }
  };

  return {
    config,
    loading,
    createPayment,
    getPixQrCode,
    getPaymentStatus,
    isReady: config.isConfigured && !loading
  };
};

// Tipos para o Mercado Pago
declare global {
  interface Window {
    MercadoPago: any;
    mercadopago: any;
  }
}
