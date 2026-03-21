const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const ensureHasScheme = (value: string) => {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

export const resolveBackendUrl = () => {
  const raw =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http')
      ? process.env.NEXT_PUBLIC_API_URL
      : '');

  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'BACKEND_URL não configurado. Defina BACKEND_URL (recomendado) ou NEXT_PUBLIC_API_URL (URL completa) nas Environment Variables do projeto na Vercel e faça um redeploy.'
      );
    }
    return 'http://127.0.0.1:3001';
  }

  return stripTrailingSlash(ensureHasScheme(raw.trim()));
};
