import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = 'http://localhost:8080';
const BASE_URL2 = 'http://10.220.112.111:8083';

// ── Instância principal (Porta 8081) ───────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// ── Segunda Instância (Porta 8083) ───────────────────────────
export const apiV2: AxiosInstance = axios.create({
  baseURL: `${BASE_URL2}`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// ── Configuração de Interceptadores compartilhados ──────────────

const setupInterceptors = (instance: AxiosInstance) => {
  // Request interceptor: injeta Bearer token
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: refresh automático
  let isRefreshing = false;
  let failedQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = [];

  const processQueue = (error: unknown, token: string | null) => {
    failedQueue.forEach(({ resolve, reject }) =>
      error ? reject(error) : resolve(token!)
    );
    failedQueue = [];
  };

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return instance(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) throw new Error('No refresh token');

          // O refresh token geralmente bate na porta auth (8081), mantemos a chamada via axios base ou api
          const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
            refreshToken,
          });

          localStorage.setItem('access_token', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('refresh_token', data.refreshToken);
          }

          // Atualiza o Zustand store se possível
          try {
            const stored = localStorage.getItem('helpdesk-auth');
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.state.accessToken = data.accessToken;
              if (data.refreshToken) parsed.state.refreshToken = data.refreshToken;
              localStorage.setItem('helpdesk-auth', JSON.stringify(parsed));
            }
          } catch { /* ignore store sync errors */ }

          instance.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
          processQueue(null, data.accessToken);

          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
          }
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          
          reauthenticateEvent.dispatchEvent(new CustomEvent('reauthenticate'));
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      
      if (error.response?.status === 403) {  
        console.log(error.response.data.message || 'Acesso negado');
      }

      return Promise.reject(error);
    }
  );
};

// ── Event para re-autenticação ─────────────────────────────
export const reauthenticateEvent = new EventTarget();

// Aplica os interceptadores para ambas as instâncias
setupInterceptors(api);
setupInterceptors(apiV2);

export default api;