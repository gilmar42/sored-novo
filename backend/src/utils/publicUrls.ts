const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const ensureHasScheme = (value: string) => {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

const isLocalhostUrl = (value: string) => /\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(value);

const isProduction = () => process.env.NODE_ENV === 'production';

export const getFrontendUrl = () => {
  const raw = process.env.FRONTEND_URL;
  if (!raw) {
    if (!isProduction()) return 'http://localhost:3000';
    throw new Error('FRONTEND_URL is required in production (e.g. https://app.seudominio.com)');
  }

  const normalized = stripTrailingSlash(ensureHasScheme(raw.trim()));

  if (isProduction() && !normalized.toLowerCase().startsWith('https://')) {
    throw new Error('FRONTEND_URL must start with https:// in production');
  }

  return normalized;
};

export const getBaseUrl = () => {
  const raw = process.env.BASE_URL;
  if (!raw) {
    if (!isProduction()) {
      const port = process.env.PORT || '3001';
      return `http://localhost:${port}`;
    }
    throw new Error('BASE_URL is required in production (public URL used for webhooks)');
  }

  const normalized = stripTrailingSlash(ensureHasScheme(raw.trim()));

  if (isProduction()) {
    if (!normalized.toLowerCase().startsWith('https://')) {
      throw new Error('BASE_URL must start with https:// in production');
    }
    if (isLocalhostUrl(normalized)) {
      throw new Error('BASE_URL cannot point to localhost/127.0.0.1 in production');
    }
  }

  return normalized;
};

export const buildMercadoPagoWebhookUrl = () => `${getBaseUrl()}/api/webhooks/mercadopago`;

