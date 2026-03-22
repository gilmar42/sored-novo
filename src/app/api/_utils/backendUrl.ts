const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const stripApiSuffix = (value: string) => value.replace(/\/api$/i, '');

const ensureHasScheme = (value: string) => {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

const normalizeBackendCandidate = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return '';

  return stripApiSuffix(stripTrailingSlash(ensureHasScheme(trimmed)));
};

export const resolveBackendUrl = () => {
  const raw = [
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
    process.env.BACKEND_PUBLIC_URL,
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ]
    .map(normalizeBackendCandidate)
    .find(Boolean);

  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'BACKEND_URL não configurado. Defina BACKEND_URL com a origem do backend (ex.: https://api.seudominio.com) ou NEXT_PUBLIC_API_URL com a URL completa da API (ex.: https://api.seudominio.com/api) e faça um redeploy.'
      );
    }
    return 'http://127.0.0.1:3001';
  }

  return raw;
};
