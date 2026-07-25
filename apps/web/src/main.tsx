import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { initWebSentry, Sentry } from '@/shared/lib/sentry';
import '@/styles/index.css';

initWebSentry();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
          <h1 className="text-xl font-medium text-nur-ink">Xatolik yuz berdi</h1>
          <p className="mt-2 text-sm text-nur-muted">
            Sahifani yangilang. Muammo davom etsa, keyinroq urinib ko‘ring.
          </p>
          <button
            type="button"
            className="mt-6 rounded-[var(--radius-m)] bg-nur-lamp px-5 py-3 text-sm font-medium text-nur-lamp-ink"
            onClick={() => window.location.assign('/')}
          >
            Bosh sahifa
          </button>
        </main>
      }
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
