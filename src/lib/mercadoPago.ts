import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

class MercadoPagoClient {
  private publicKey: string = '';
  private accessToken: string = '';
  private client: MercadoPagoConfig | null = null;

  constructor() {
    this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
    this.publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';

    if (this.accessToken) {
      this.client = new MercadoPagoConfig({ accessToken: this.accessToken });
      console.log('Mercado Pago backend configurado com sucesso');
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
    // Frontend não deve criar preferências diretamente
    // Isso deve ser feito via API do backend
    throw new Error('createPreference deve ser chamado via API do backend');
  }

  async getPayment(paymentId: string) {
    if (!this.client) {
      throw new Error('Mercado Pago não configurado');
    }

    const payment = new Payment(this.client);
    const response = await payment.get({ id: paymentId });
    return response;
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  isConfigured(): boolean {
    return !!this.client;
  }
}

const mercadoPagoInstance = new MercadoPagoClient();
export default mercadoPagoInstance;
