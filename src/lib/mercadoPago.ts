import { MercadoPagoConfig, Preference } from 'mercadopago';

class MercadoPagoClient {
  private publicKey: string = '';
  private client: MercadoPagoConfig | null = null;

  constructor() {
    this.publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';

    if (this.publicKey) {
      this.client = new MercadoPagoConfig({ accessToken: this.publicKey });
      console.log('Mercado Pago frontend configurado com sucesso');
    } else {
      console.warn('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY não configurado - Mercado Pago desativado');
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

  getPublicKey(): string {
    return this.publicKey;
  }

  isConfigured(): boolean {
    return !!this.publicKey;
  }
}

const mercadoPagoInstance = new MercadoPagoClient();
export default mercadoPagoInstance;
