import { MercadoPagoConfig, Preference, Payment, PaymentRefund, PreApproval } from 'mercadopago';
import logger from '../../utils/logger';

class MercadoPagoClient {
  private accessToken: string = '';
  private publicKey: string = '';
  private client: MercadoPagoConfig | null = null;

  constructor() {
    this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
    this.publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY || '';

    if (this.accessToken) {
      this.client = new MercadoPagoConfig({ accessToken: this.accessToken });
      logger.info('Mercado Pago configurado com sucesso (SDK v2)');
    } else {
      logger.warn('MERCADO_PAGO_ACCESS_TOKEN não configurado - Mercado Pago desativado');
    }
  }

  async createPreference(data: {
    items: Array<{
      id: string;
      title: string;
      quantity: number;
      currency_id: string;
      unit_price: number;
    }>;
    notification_url: string;
    external_reference: string;
  }) {
    if (!this.client) {
      throw new Error('Mercado Pago não configurado');
    }
    
    try {
      const preference = new Preference(this.client);
      const response = await preference.create({ body: data });
      logger.info('Preferência Mercado Pago criada', { preferenceId: response.id });
      return response;
    } catch (error: any) {
      logger.error('Erro ao criar preferência Mercado Pago', { error: error.message || error });
      throw error;
    }
  }

  async createPaymentPreference(orderData: {
    orderId: string;
    amount: number;
    description: string;
    returnUrl: string;
    notificationUrl: string;
    paymentMethod?: 'credit_card' | 'pix' | 'ticket' | 'all';
    payer?: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    };
  }) {
    if (!this.client) {
      throw new Error('Mercado Pago não configurado');
    }

    // Configuração de meios de pagamento - PAGAMENTO ÚNICO SEM PARCELAS
    const paymentMethods: any = {
      excluded_payment_methods: [],
      excluded_payment_types: [
        { id: 'atm' },
        { id: 'consumer_credits' } // Exclui parcelas/credito do consumidor
      ],
      installments: 1, // Apenas pagamento único (1x)
      default_installments: 1
    };

    if (orderData.paymentMethod === 'pix') {
      paymentMethods.default_payment_method_id = 'pix';
    }

    // Para cartão de crédito, forçar pagamento único sem saved_card

    const preferenceData: any = {
      purpose: 'WALLET_PURCHASE',
      marketplace: 'NONE',
      show_instments: false,
      show_payer_info: false,
      additional_info: {
        items: [{
          id: orderData.orderId,
          title: orderData.description,
          description: orderData.description,
          quantity: 1,
          unit_price: orderData.amount,
          currency_id: 'BRL'
        }],
        payer: orderData.payer ? {
          first_name: orderData.payer.firstName,
          last_name: orderData.payer.lastName
        } : undefined
      },
      items: [{
        title: orderData.description,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: orderData.amount
      }],
      back_urls: {
        success: orderData.returnUrl,
        failure: orderData.returnUrl,
        pending: orderData.returnUrl
      },
      auto_return: orderData.returnUrl?.startsWith('https') ? 'approved' : undefined,
      notification_url: (() => {
        const url = orderData.notificationUrl || '';
        const isLocal = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0');
        if (process.env.NODE_ENV === 'production') {
          if (!url) throw new Error('notificationUrl is required in production');
          if (!url.startsWith('https://')) throw new Error('notificationUrl must be https:// in production');
          if (isLocal) throw new Error('notificationUrl cannot be localhost in production');
          return url;
        }
        // Em desenvolvimento, o Mercado Pago não aceita localhost como notification_url.
        return isLocal ? 'https://example.com/webhook-dummy' : url;
      })(),
      external_reference: orderData.orderId,
      payment_methods: paymentMethods,
      // Evita "binary_mode" para reduzir chance de bloqueios/validacoes no Checkout Pro.
      // Se precisar de aprovacao imediata, reabilite apos validar o fluxo em producao.
      // binary_mode: true,
      payer: orderData.payer ? {
        email: orderData.payer.email,
        name: orderData.payer.firstName,
        surname: orderData.payer.lastName,
        // O Checkout Pro normalmente coleta/valida telefone e CPF no proprio fluxo.
        // Enviar telefone em formato errado pode causar validacao extra no Checkout.
        // phone: undefined,
      } : undefined
    };

    try {
      const preference = new Preference(this.client);
      const response = await preference.create({ body: preferenceData });
      logger.info('Preferência de pagamento criada', { 
        preferenceId: response.id,
        orderId: orderData.orderId
      });
      return response;
    } catch (error: any) {
      logger.error('Erro ao criar preferência de pagamento', { 
        error: error.message || error,
        orderId: orderData.orderId 
      });
      throw error;
    }
  }

  async createPixPayment(orderData: {
    orderId: string;
    amount: number;
    description: string;
    payerEmail: string;
    payerFirstName: string;
    payerLastName: string;
    payerPhone: string;
    notificationUrl: string;
  }) {
    if (!this.client) {
      throw new Error('Mercado Pago não configurado');
    }

    const pixData = {
      transaction_amount: orderData.amount,
      description: orderData.description,
      external_reference: orderData.orderId,
      notification_url: (() => {
        const url = orderData.notificationUrl || '';
        const isLocal = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0');
        if (process.env.NODE_ENV === 'production') {
          if (!url) throw new Error('notificationUrl is required in production');
          if (!url.startsWith('https://')) throw new Error('notificationUrl must be https:// in production');
          if (isLocal) throw new Error('notificationUrl cannot be localhost in production');
          return url;
        }
        return isLocal ? 'https://example.com/webhook-dummy' : url;
      })(),
      payer: {
        email: orderData.payerEmail,
        first_name: orderData.payerFirstName,
        last_name: orderData.payerLastName
      },
      payment_method_id: 'pix'
    };

    try {
      const payment = new Payment(this.client);
      const response = await payment.create({ body: pixData });
      logger.info('Pagamento PIX criado', { 
        paymentId: response.id,
        orderId: orderData.orderId 
      });
      return response;
    } catch (error: any) {
      logger.error('Erro ao criar pagamento PIX', { 
        error: error.message || error,
        orderId: orderData.orderId 
      });
      throw error;
    }
  }

  async getPixQrCode(paymentId: string) {
    if (!this.client) {
      throw new Error('Mercado Pago não configurado');
    }

    try {
      const payment = new Payment(this.client);
      const response = await payment.get({ id: paymentId });
      
      if (response.payment_method_id === 'pix') {
        logger.info('QR Code PIX obtido', { paymentId });
        return {
          qrCode: response.point_of_interaction?.transaction_data?.qr_code_base64,
          qrCodeText: response.point_of_interaction?.transaction_data?.qr_code,
          copyAndPasteKey: response.point_of_interaction?.transaction_data?.qr_code,
          expirationDate: response.date_of_expiration,
          amount: response.transaction_amount,
          status: response.status
        };
      } else {
        throw new Error('Pagamento não é do tipo PIX');
      }
    } catch (error: any) {
      logger.error('Erro ao obter QR Code PIX', { 
        paymentId, 
        error: error.message || error,
        apiResponse: error.response?.data || 'N/A'
      });
      throw error;
    }
  }

  async getPixStatus(paymentId: string) {
    if (!this.client) {
      throw new Error('Mercado Pago não configurado');
    }

    try {
      const payment = new Payment(this.client);
      const response = await payment.get({ id: paymentId });
      
      const pixData: { [key: string]: any } = {
        paymentId: response.id,
        status: response.status,
        statusDetail: response.status_detail,
        amount: response.transaction_amount,
        dateCreated: response.date_created,
        dateApproved: response.date_approved,
        dateOfExpiration: response.date_of_expiration
      };

      if (response.payment_method_id === 'pix' && response.point_of_interaction) {
        pixData.qrCode = response.point_of_interaction.transaction_data?.qr_code;
        pixData.qrCodeBase64 = response.point_of_interaction.transaction_data?.qr_code_base64;
        pixData.copyAndPasteKey = response.point_of_interaction.transaction_data?.qr_code;
      }

      logger.info('Status PIX consultado', { paymentId, status: response.status });
      return pixData;
    } catch (error: any) {
      logger.error('Erro ao consultar status PIX', { paymentId, error: error.message || error });
      throw error;
    }
  }

  async getPayment(paymentId: string) {
    if (!this.client) {
      throw new Error('Mercado Pago não configurado');
    }
    
    try {
      const payment = new Payment(this.client);
      const response = await payment.get({ id: paymentId });
      return response;
    } catch (error: any) {
      logger.error('Erro ao consultar pagamento Mercado Pago', { paymentId, error: error.message || error });
      throw error;
    }
  }

  async refundPayment(paymentId: string) {
    if (!this.client) {
      throw new Error('Mercado Pago não configurado');
    }
    
    try {
      const refund = new PaymentRefund(this.client);
      // O SDK v2 espera payment_id como number ou string, pode ser um objeto { payment_id: id }
      const response = await refund.create({ payment_id: paymentId });
      logger.info('Reembolso realizado', { paymentId });
      return response;
    } catch (error: any) {
      logger.error('Erro ao reembolsar pagamento', { paymentId, error: error.message || error });
      throw error;
    }
  }

  async createPreApproval(data: {
    orderId: string;
    amount: number;
    description: string;
    payerEmail: string;
    returnUrl: string;
    trialDays: number;
    periodType: 'monthly' | 'annual';
  }) {
    if (!this.client) {
      throw new Error('Mercado Pago não configurado');
    }

    const normalizedBackUrl = (() => {
      const url = data.returnUrl || '';
      const isLocal = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0');
      if (process.env.NODE_ENV === 'production') {
        if (!url) throw new Error('returnUrl is required in production');
        if (!url.startsWith('https://')) throw new Error('returnUrl must be https:// in production');
        if (isLocal) throw new Error('returnUrl cannot be localhost in production');
        return url;
      }

      return isLocal ? 'https://example.com/payment-success' : url;
    })();

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2); // Assinatura válida por 2 anos

    const preApprovalData = {
      back_url: normalizedBackUrl,
      reason: data.description,
      external_reference: data.orderId,
      payer_email: data.payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: data.periodType === 'monthly' ? 'months' : 'years',
        transaction_amount: data.amount,
        currency_id: 'BRL',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        has_trial: true,
        trial_period: data.trialDays,
        trial_period_type: 'days'
      },
      status: 'pending'
    };

    try {
      const preApproval = new PreApproval(this.client);
      const response = await preApproval.create({ body: preApprovalData });
      logger.info('PreApproval (Assinatura) criada no Mercado Pago', { 
        preApprovalId: response.id,
        orderId: data.orderId 
      });
      return response;
    } catch (error: any) {
      logger.error('Erro ao criar PreApproval no Mercado Pago', { 
        error: error.message || error,
        orderId: data.orderId 
      });
      throw error;
    }
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  isConfigured(): boolean {
    return !!(this.accessToken && this.publicKey);
  }
}

const mercadoPagoInstance = new MercadoPagoClient();
export default mercadoPagoInstance;
