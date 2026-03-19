import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from 'mercadopago';

class MercadoPagoClient {
  private accessToken: string = '';
  private publicKey: string = '';
  private client: MercadoPagoConfig | null = null;

  constructor() {
    this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
    this.publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY || '';

    if (this.accessToken) {
      this.client = new MercadoPagoConfig({ accessToken: this.accessToken });
      console.log('Mercado Pago configurado com sucesso (SDK v2)');
    } else {
      console.warn('MERCADO_PAGO_ACCESS_TOKEN não configurado - Mercado Pago desativado');
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
      return response;
    } catch (error: any) {
      console.error('Erro ao criar preferência Mercado Pago:', error.message || error);
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

    const preferenceData: any = {
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
      notification_url: orderData.notificationUrl?.includes('localhost') || orderData.notificationUrl?.includes('127.0.0.1') 
        ? 'https://example.com/webhook-dummy' 
        : orderData.notificationUrl,
      external_reference: orderData.orderId,
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [{ id: 'atm' }]
      },
      payer: orderData.payer ? {
        email: orderData.payer.email,
        name: orderData.payer.firstName,
        surname: orderData.payer.lastName,
        phone: orderData.payer.phone ? {
          number: orderData.payer.phone
        } : undefined
      } : undefined
    };

    if (orderData.paymentMethod === 'pix') {
      preferenceData.payment_methods = {
        default_payment_method_id: 'pix',
        excluded_payment_methods: [],
        excluded_payment_types: []
      };
    }

    try {
      const preference = new Preference(this.client);
      const response = await preference.create({ body: preferenceData });
      return response;
    } catch (error: any) {
      console.error('Erro ao criar preferência de pagamento:', error.message || error);
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
      notification_url: orderData.notificationUrl?.includes('localhost') || orderData.notificationUrl?.includes('127.0.0.1') 
        ? 'https://example.com/webhook-dummy' 
        : orderData.notificationUrl,
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
      return response;
    } catch (error: any) {
      console.error('Erro ao criar pagamento PIX:', error.message || error);
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
      console.error('Erro ao obter QR Code PIX:', error.message || error);
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

      return pixData;
    } catch (error: any) {
      console.error('Erro ao consultar status PIX:', error.message || error);
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
      console.error('Erro ao consultar pagamento Mercado Pago:', error.message || error);
      throw error;
    }
  }

  async refundPayment(paymentId: string) {
    if (!this.client) {
      throw new Error('Mercado Pago não configurado');
    }
    
    try {
      const refund = new PaymentRefund(this.client);
      const response = await refund.create({ payment_id: paymentId });
      return response;
    } catch (error: any) {
      console.error('Erro ao reembolsar pagamento:', error.message || error);
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
