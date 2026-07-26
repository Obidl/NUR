import type { CorsOptions } from 'cors';
import type { Env } from './env.js';

export function createCorsOptions(env: Env): CorsOptions {
  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  function isAllowed(origin: string): boolean {
    if (allowedOrigins.includes(origin)) return true;
    // Vercel production aliases / deployment URLs for this project
    try {
      const host = new URL(origin).hostname;
      if (host === 'nur-web-orcin.vercel.app') return true;
      if (host.startsWith('nur-') && host.endsWith('-obidls-projects.vercel.app')) return true;
      if (host === 'nur-web-obidls-projects.vercel.app') return true;
      if (host === 'nur-web-obidl-obidls-projects.vercel.app') return true;
    } catch {
      return false;
    }
    return false;
  }

  return {
    origin(origin, callback) {
      // Non-browser clients (health checks, curl) may omit Origin.
      if (!origin || isAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  };
}
