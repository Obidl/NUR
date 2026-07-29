/**
 * API base URL.
 * - Local: http://localhost:4000
 * - Production: same origin (Vercel rewrites /api + /health → Render)
 */
function resolveConfigured(value: string | undefined): string {
  if (value === undefined || value === null) return '';
  return value.trim().replace(/\/$/, '');
}

function resolveApiBaseUrl(): string {
  const configured = resolveConfigured(import.meta.env.VITE_API_BASE_URL as string | undefined);
  if (configured) return configured;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export const env = {
  get apiBaseUrl() {
    return resolveApiBaseUrl();
  },
  appName: 'NUR',
} as const;
