import * as Sentry from '@sentry/node';
import type { Env } from '../config/env.js';

const SENSITIVE_KEYS = /password|token|authorization|cookie|secret|refresh/i;

function scrubValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.test(key)) return '[Filtered]';
  return value;
}

/**
 * Initializes Sentry when SENTRY_DSN is set. No-op otherwise (local/test safe).
 */
export function initSentry(env: Env): boolean {
  if (!env.SENTRY_DSN) {
    return false;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.headers) {
        const headers = { ...event.request.headers };
        for (const key of Object.keys(headers)) {
          if (SENSITIVE_KEYS.test(key)) {
            headers[key] = '[Filtered]';
          }
        }
        event.request.headers = headers;
      }
      if (event.request?.data && typeof event.request.data === 'object') {
        const data = event.request.data as Record<string, unknown>;
        for (const key of Object.keys(data)) {
          data[key] = scrubValue(key, data[key]);
        }
      }
      return event;
    },
  });

  return true;
}

export function captureUnexpectedError(error: unknown): void {
  if (!Sentry.getClient()) return;
  Sentry.captureException(error);
}

export { Sentry };
