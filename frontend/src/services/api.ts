import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,       // 60s for AI generation calls
  withCredentials: true, // Send httpOnly refresh-token cookie on every request
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getAccessToken  = () => localStorage.getItem('trrip_token');
const setAccessToken  = (t: string) => localStorage.setItem('trrip_token', t);
const clearAuthStorage = () => {
  localStorage.removeItem('trrip_token');
  localStorage.removeItem('trrip_user');
};

// Track whether a refresh is already in-flight to avoid multiple parallel attempts
let isRefreshing = false;
// Queue of callbacks waiting for the new access token
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (newToken: string) => {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
};

// ─── Request interceptor — attach access token ────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor — silent refresh on TOKEN_EXPIRED ──────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string; message?: string }>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status   = error.response?.status;
    const code     = error.response?.data?.code;

    // Only attempt refresh on 401 TOKEN_EXPIRED, and never retry the refresh
    // call itself (which goes to /api/auth/refresh).
    if (
      status === 401 &&
      code === 'TOKEN_EXPIRED' &&
      !original._retry &&
      original.url !== '/auth/refresh'
    ) {
      // Extract userId from the stored (expired) token's payload so the
      // refresh endpoint knows which user's refresh token to look up.
      const storedToken = getAccessToken();
      let userId: string | null = null;

      if (storedToken) {
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          userId = payload.id as string;
        } catch {
          // Malformed token — fall through to forced logout
        }
      }

      if (!userId) {
        clearAuthStorage();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Another request already kicked off a refresh — queue this one
        return new Promise((resolve) => {
          refreshQueue.push((newToken: string) => {
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // The httpOnly cookie is sent automatically (withCredentials: true)
        const res = await api.post<{ data: { accessToken: string } }>(
          '/auth/refresh',
          { userId }
        );
        const newAccessToken = res.data.data.accessToken;

        setAccessToken(newAccessToken);
        processQueue(newAccessToken);

        // Retry the original failed request with the fresh token
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch {
        // Refresh failed — session is truly dead
        clearAuthStorage();
        refreshQueue = [];
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // Any other 401 (e.g. INVALID_TOKEN, NO_TOKEN) — clear and redirect
    if (status === 401 && !original._retry) {
      clearAuthStorage();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(
      new Error(error.response?.data?.message || error.message || 'Something went wrong')
    );
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (userId: string) =>
    api.post('/auth/refresh', { userId }),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

// ─── Documents ────────────────────────────────────────────────────────────────
export const documentsApi = {
  upload: (files: File[], onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },
  getAll: (page = 1, limit = 10) =>
    api.get('/documents', { params: { page, limit } }),
  delete: (id: string) => api.delete(`/documents/${id}`),
  getSignedUrl: (id: string) => api.get(`/documents/${id}/signed-url`),
};

// ─── Itineraries ──────────────────────────────────────────────────────────────
export const itinerariesApi = {
  generate: (documentIds: string[]) =>
    api.post('/itineraries/generate', { documentIds }),
  getAll: (page = 1, limit = 10) =>
    api.get('/itineraries', { params: { page, limit } }),
  getById: (id: string) => api.get(`/itineraries/${id}`),
  getShared: (token: string) => api.get(`/itineraries/shared/${token}`),
  toggleShare: (id: string, isShared: boolean) =>
    api.patch(`/itineraries/${id}/share`, { isShared }),
  delete: (id: string) => api.delete(`/itineraries/${id}`),
};
