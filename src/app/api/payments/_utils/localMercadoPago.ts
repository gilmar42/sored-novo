import mercadoPagoClient from '@/lib/mercadoPago';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const ensureHasScheme = (value: string) => {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

export const canHandlePaymentsLocally = () => mercadoPagoClient.isConfigured();

export const getMercadoPagoPublicKey = () => mercadoPagoClient.getPublicKey();

export const getPublicAppUrl = () => {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.BASE_URL ||
    process.env.VERCEL_URL ||
    '';

  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'NEXT_PUBLIC_APP_URL não configurado. Defina a URL pública do frontend para gerar pagamentos localmente em produção.'
      );
    }

    return 'http://localhost:3000';
  }

  const normalized = stripTrailingSlash(ensureHasScheme(raw.trim()));
  if (process.env.NODE_ENV === 'production' && !normalized.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_APP_URL deve usar https:// em produção.');
  }

  return normalized;
};

export const getWebhookUrl = () => `${getPublicAppUrl()}/api/webhooks/mercadopago`;

export const createLocalCheckout = async (body: {
  orderId: string;
  amount: number;
  description: string;
  paymentMethod?: 'credit_card' | 'pix' | 'ticket' | 'all';
  returnUrl?: string;
  payerEmail?: string;
  payerFirstName?: string;
  payerLastName?: string;
  payerPhone?: string;
}) => {
  const returnUrl = body.returnUrl || `${getPublicAppUrl()}/payment-success`;
  const preference = await mercadoPagoClient.createPaymentPreference({
    orderId: body.orderId,
    amount: body.amount,
    description: body.description,
    paymentMethod: body.paymentMethod,
    returnUrl,
    notificationUrl: getWebhookUrl(),
    payer: body.payerEmail
      ? {
          email: body.payerEmail,
          firstName: body.payerFirstName,
          lastName: body.payerLastName,
          phone: body.payerPhone,
        }
      : undefined,
  });

  const isSandbox = !mercadoPagoClient.getPublicKey().startsWith('APP_USR-');

  return {
    paymentId: body.orderId,
    preferenceId: preference.id,
    initPoint: isSandbox ? preference.sandbox_init_point : preference.init_point,
    sandbox: isSandbox,
    paymentMethod: body.paymentMethod || 'all',
  };
};

export const createLocalPixPayment = async (body: {
  orderId: string;
  amount: number;
  description: string;
  payerEmail: string;
  payerFirstName: string;
  payerLastName: string;
  payerPhone: string;
}) => {
  const payment = await mercadoPagoClient.createPixPayment({
    ...body,
    notificationUrl: getWebhookUrl(),
  });

  return {
    paymentId: String(payment.id),
    status: payment.status,
    transactionAmount: payment.transaction_amount,
    dateOfExpiration: payment.date_of_expiration,
  };
};

export const getLocalPixQrCode = async (paymentId: string) =>
  mercadoPagoClient.getPixQrCode(paymentId);

export const getLocalPixStatus = async (paymentId: string) =>
  mercadoPagoClient.getPixStatus(paymentId);

export const getLocalPaymentStatus = async (paymentId: string) => {
  try {
    return await mercadoPagoClient.getPayment(paymentId);
  } catch {
    const searchClient = (mercadoPagoClient as any).client;
    if (!searchClient) throw new Error('Mercado Pago não configurado');

    const { Payment } = await import('mercadopago');
    const payment = new Payment(searchClient);
    const search = await payment.search({
      options: {
        external_reference: paymentId,
        sort: 'date_created',
        criteria: 'desc',
        range: 'date_created',
      },
    });

    const result = search.results?.[0];
    if (!result) {
      return { id: paymentId, status: 'pending' };
    }

    return result;
  }
};
