import axios from 'axios';

const ensureTrailingSlash = (value: string) => {
  if (!value) return '';
  return value.endsWith('/') ? value : `${value}/`;
};

const isLocalhost = (host: string | null | undefined) => {
  return host === 'localhost' || host === '127.0.0.1';
};

const shouldUseInternalApi = (envUrl: string) => {
  if (typeof window === 'undefined') return false;
  if (!envUrl.startsWith('http')) return false;

  try {
    const parsed = new URL(envUrl);
    const frontendPort = window.location.port || '80';
    const backendPort = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    if (isLocalhost(window.location.hostname) && isLocalhost(parsed.hostname) && backendPort !== frontendPort) {
      console.warn('[SORED API] NEXT_PUBLIC_API_URL aponta para localhost com porta diferente; usando rota interna /api/ para evitar CORS.');
      return true;
    }
  } catch (error) {
    console.warn('[SORED API] Falha ao analisar NEXT_PUBLIC_API_URL:', error);
  }

  return false;
};

const getBaseURL = () => {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  const internalApi = '/api/';

  if (!envUrl) {
    return internalApi;
  }

  if (shouldUseInternalApi(envUrl)) {
    return internalApi;
  }

  // Em produção, sempre usar o backend externo
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return ensureTrailingSlash(envUrl);
  }

  // Aceita tanto caminhos relativos quanto URLs completas
  if (envUrl.startsWith('/')) {
    return ensureTrailingSlash(envUrl);
  }

  try {
    const parsed = new URL(envUrl);
    return ensureTrailingSlash(`${parsed.origin}${parsed.pathname}`);
  } catch (error) {
    console.warn('[SORED API] NEXT_PUBLIC_API_URL inválido:', error);
    return internalApi;
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para adicionar o token JWT e logar a URL final (debug)
api.interceptors.request.use((config) => {
  // Log para depuração em produção
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`[API Request] Calling: ${fullUrl}`);
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404) {
      console.error('[API Error] 404 - Endpoint not found:', error.config.url);
      console.error('[API Error] Base URL:', error.config.baseURL);
      console.error('[API Error] Full URL:', `${error.config.baseURL}${error.config.url}`);
    }
    return Promise.reject(error);
  }
);

export default api;

// Interceptor para tratar erros globais (ex: 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    
    // Log detalhado de erro em produção para o console do navegador
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.warn(`[API Error] Request to ${url} failed with status: ${error.response?.status}`);
      console.log('Headers:', error.response?.headers);
    }

    if (error.response?.status === 401 && !isAuthEndpoint) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
