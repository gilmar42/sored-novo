import mercadoPagoClient from '@/lib/mercadoPago';
import prisma from '@/lib/prisma';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const ensureHasScheme = (value: string) => {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

const hasPlaceholderValue = (value: string) => /x{8,}/i.test(value) || value.includes('your_');

const hasUsableLocalCredentials = () => {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY || process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;

  console.log('[Local Mercado Pago] ACCESS_TOKEN existe:', !!accessToken, 'length:', accessToken?.length || 0);
  console.log('[Local Mercado Pago] PUBLIC_KEY existe:', !!publicKey, 'length:', publicKey?.length || 0);
  console.log('[Local Mercado Pago] TOKEN starts with APP_USR:', accessToken?.startsWith('APP_USR-'));

  const trimmedAccessToken = (accessToken || '').trim();
  const trimmedPublicKey = (publicKey || '').trim();

  if (!trimmedAccessToken) {
    console.warn('[Local Mercado Pago] MERCADO_PAGO_ACCESS_TOKEN não configurado ou vazio');
    return false;
  }
  if (!trimmedPublicKey) {
    console.warn('[Local Mercado Pago] MERCADO_PAGO_PUBLIC_KEY não configurado ou vazio');
    return false;
  }
  if (hasPlaceholderValue(trimmedAccessToken) || hasPlaceholderValue(trimmedPublicKey)) {
    console.warn('[Local Mercado Pago] Credentials com valores de placeholder');
    return false;
  }

  return true;
};

export const canHandlePaymentsLocally = () => {
  const usable = hasUsableLocalCredentials() && mercadoPagoClient.isConfigured();
  if (!usable) {
    console.log('[Local Mercado Pago] Processamento local indisponível');
  }
  return usable;
};

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

const createInternalPaymentRecord = async (data: {
  orderId: string;
  amount: number;
  paymentMethod: string;
  preferenceId?: string;
  mercadoPagoPaymentId?: string;
}) => {
  try {
    await prisma.payment.create({
      data: {
        orderId: data.orderId,
        amount: data.amount,
        currency: 'BRL',
        paymentMethod: data.paymentMethod,
        preferenceId: data.preferenceId,
        mercadoPagoPaymentId: data.mercadoPagoPaymentId,
        status: 'pendente',
      },
    });
  } catch (error) {
    console.warn('[Local Mercado Pago] Falha ao persistir pagamento interno:', error);
  }
};

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

  await createInternalPaymentRecord({
    orderId: body.orderId,
    amount: body.amount,
    paymentMethod: body.paymentMethod || 'credit_card',
    preferenceId: preference.id || undefined,
  });

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

  await createInternalPaymentRecord({
    orderId: body.orderId,
    amount: body.amount,
    paymentMethod: 'pix',
    mercadoPagoPaymentId: String(payment.id),
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

export const processLocalWebhook = async (eventData: any) => {
  const { type, data } = eventData || {};
  if (type !== 'payment' || !data?.id) {
    return;
  }

  const mpPayment = await mercadoPagoClient.getPayment(String(data.id));
  const externalReference = String(mpPayment.external_reference || '').replace(/^order_/, '');
  if (!externalReference) {
    return;
  }

  const statusMap: Record<string, string> = {
    approved: 'pago',
    pending: 'pendente',
    rejected: 'falhou',
    cancelled: 'cancelado',
  };
  const newStatus = statusMap[mpPayment.status || 'pending'] || 'pendente';

  const existingPayment =
    (await prisma.payment.findFirst({ where: { orderId: externalReference } })) ||
    (await prisma.payment.findFirst({ where: { mercadoPagoPaymentId: String(data.id) } }));

  if (existingPayment) {
    await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: newStatus,
        mercadoPagoPaymentId: String(data.id),
      },
    });

    await prisma.paymentEvent.create({
      data: {
        paymentId: existingPayment.id,
        eventType: type,
        payload: eventData,
        processed: true,
      },
    }).catch(() => undefined);
  }

  if (!externalReference.startsWith('plan_')) {
    const budgetStatus = newStatus === 'pago' ? 'PAID' : newStatus === 'falhou' ? 'PAYMENT_FAILED' : null;
    if (budgetStatus) {
      await prisma.budget.update({
        where: { id: externalReference },
        data: { status: budgetStatus },
      }).catch(() => undefined);
    }
  }
};
