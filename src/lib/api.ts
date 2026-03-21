import axios from 'axios';

const getBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  // Se houver uma URL completa na variável de ambiente, use-a (Prioridade Máxima)
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.endsWith('/') ? envUrl : `${envUrl}/`;
  } 

  // Em produção ou local, agora usamos rotas internas do Next.js
  const url = '/api';
  const finalUrl = url.endsWith('/') ? url : `${url}/`;
  
  // Log de diagnóstico aprimorado
  if (typeof window !== 'undefined') {
    console.group('%c🔍 Diagnostico da API SORED', 'color: #6366f1; font-weight: bold;');
    console.log('Localizacao:', window.location.href);
    console.log('Modo: Rotas internas da API');
    console.log('BaseURL calculada da API:', finalUrl);
    console.groupEnd();
  }

  return finalUrl;
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
    console.log(`[API Requisicao] Chamando: ${fullUrl}`);
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros globais (ex: 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    const isPaymentEndpoint =
      url.includes('/payments/') ||
      url.includes('/webhooks/') ||
      url.includes('/subscription') ||
      url.includes('/subscriptions/plans');
    
    // Log detalhado de erro em produção para o console do navegador
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.warn(`[API Erro] Requisicao para ${url} falhou com status: ${error.response?.status}`);
      console.log('Cabecalhos:', error.response?.headers);
    }

    // Nao redirecionar automaticamente para /login em endpoints de pagamento,
    // pois checkout pode ser publico e o redirecionamento atrapalha o fluxo.
    if (error.response?.status === 401 && !isAuthEndpoint && !isPaymentEndpoint) {
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
