import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { endpoints } from '@/services/endpoints';

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('nur_refresh_token');
  if (!refreshToken) {
    return null;
  }

  try {
    const { data } = await axios.post<{ data: { tokens: { accessToken: string; refreshToken: string } } }>(
      `${env.apiBaseUrl}${endpoints.auth.refresh}`,
      { refreshToken },
      { timeout: 15000 },
    );

    const tokens = data.data.tokens;
    localStorage.setItem('nur_access_token', tokens.accessToken);
    localStorage.setItem('nur_refresh_token', tokens.refreshToken);
    return tokens.accessToken;
  } catch {
    localStorage.removeItem('nur_access_token');
    localStorage.removeItem('nur_refresh_token');
    return null;
  }
}

http.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('nur_access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    // Do not try refresh-loop on auth endpoints themselves.
    const url = original.url ?? '';
    if (
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const newAccessToken = await refreshPromise;
    if (!newAccessToken) {
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newAccessToken}`;
    return http(original);
  },
);
