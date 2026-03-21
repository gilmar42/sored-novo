const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const ensureHasScheme = (value: string) => {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

export const resolveBackendUrl = () => {
  const raw = process.env.BACKEND_URL;
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BACKEND_URL is not configured');
    }
    return 'http://127.0.0.1:3001';
  }

  return stripTrailingSlash(ensureHasScheme(raw.trim()));
};

