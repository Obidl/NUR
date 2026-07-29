import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import {
  persistAuthTokens,
  readAccessToken,
  readRefreshToken,
} from '@/features/auth/lib/tokenStorage';
import { endpoints } from '@/services/endpoints';

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  // Render free-tier cold start can exceed 15s.
  timeout: 60000,
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = readRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const { data } = await axios.post<{ data: { tokens: { accessToken: string; refreshToken: string } } }>(
      `${env.apiBaseUrl}${endpoints.auth.refresh}`,
      { refreshToken },
      { timeout: 60000 },
    );

    const tokens = data.data.tokens;
    persistAuthTokens(tokens.accessToken, tokens.refreshToken);
    return tokens.accessToken;
  } catch {
    persistAuthTokens(null, null);
    return null;
  }
}

http.interceptors.request.use((config) => {
  const accessToken = readAccessToken();
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
