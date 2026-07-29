/**
 * API base URL.
 * - Local: http://localhost:4000
 * - Production (Vercel): empty → same-origin `/api` + `/health` rewritten to Render
 */
function resolveApiBaseUrl(value: string | undefined): string {
  if (value === undefined || value === null) return '';
  return value.trim().replace(/\/$/, '');
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined),
  appName: 'NUR',
} as const;
