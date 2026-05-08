/**
 * api.js — Centralised Axios instance for Kōru.
 *
 * - All requests automatically carry the JWT from localStorage.
 * - 401 responses automatically clear the token and redirect to /login.
 * - Token is stored / read under the key TOKEN_KEY ("koru_token").
 */
import axios from 'axios';

export const TOKEN_KEY = 'koru_token';
export const USER_KEY  = 'koru_user';

const resolveApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  if (typeof window === 'undefined') return 'http://localhost:5001';

  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5001';
  }

  if (hostname.endsWith('.app.github.dev')) {
    const forwardedHost = hostname.replace(/-(5173|5174)(\.|$)/, '-5001$2');
    if (forwardedHost !== hostname) {
      return `${protocol}//${forwardedHost}`;
    }
  }

  return 'http://localhost:5001';
};

const API_URL = resolveApiUrl();

export const getApiBaseUrl = () => API_URL;

export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  return API_URL.replace(/\/api$/, '');
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Request interceptor — attach Bearer token ── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response interceptor — handle 401 globally ── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state and bounce to login
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.startsWith('/') || window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

/* ── Auth helpers used throughout the app ── */

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw && raw !== 'undefined') return JSON.parse(raw);
  } catch (_) {}
  return null;
};

export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;
  try {
    // Decode without verifying signature (server will verify)
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload));
    // exp is in seconds
    return decoded.exp * 1000 > Date.now();
  } catch (_) {
    return false;
  }
};

export const saveAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Also clear old keys from previous versions of the app
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export default api;
