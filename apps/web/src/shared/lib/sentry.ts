import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

/**
 * Initializes browser Sentry when VITE_SENTRY_DSN is set. No-op otherwise.
 */
export function initWebSentry(): boolean {
  if (!dsn?.trim()) {
    return false;
  }

  Sentry.init({
    dsn: dsn.trim(),
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.headers) {
        const headers = { ...event.request.headers };
        for (const key of Object.keys(headers)) {
          if (/authorization|cookie|token/i.test(key)) {
            headers[key] = '[Filtered]';
          }
        }
        event.request.headers = headers;
      }
      return event;
    },
  });

  return true;
}

export { Sentry };
