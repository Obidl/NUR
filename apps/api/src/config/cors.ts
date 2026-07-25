import type { CorsOptions } from 'cors';
import type { Env } from './env.js';

export function createCorsOptions(env: Env): CorsOptions {
  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      // Non-browser clients (health checks, curl) may omit Origin.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  };
}
