import axios from 'axios';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const normalizeApiBaseUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) return '';
  return stripTrailingSlash(trimmed);
};

const getDirectPaymentBaseUrl = () => {
  const explicitApiUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_PAYMENT_API_URL);
  if (explicitApiUrl) return explicitApiUrl;

  const publicApiUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  if (publicApiUrl) return publicApiUrl;

  const publicBackendUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_BACKEND_URL);
  if (publicBackendUrl) return `${publicBackendUrl}/api`;

  return '';
};

export const getPaymentApiBaseUrl = () => {
  const directUrl = getDirectPaymentBaseUrl();
  if (directUrl) {
    return directUrl.endsWith('/') ? directUrl : `${directUrl}/`;
  }

  return '/api/';
};

export const getPaymentApiConfigurationError = () => {
  if (typeof window === 'undefined') return '';

  const usingDirectBackend = Boolean(getDirectPaymentBaseUrl());
  if (usingDirectBackend) return '';

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '';
  }

  return '';
};

const paymentApi = axios.create({
  baseURL: getPaymentApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

paymentApi.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default paymentApi;
