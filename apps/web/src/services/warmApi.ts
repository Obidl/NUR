import axios from 'axios';
import { env } from '@/config/env';
import { endpoints } from '@/services/endpoints';

const RENDER_HEALTH = 'https://nur-api-ow0b.onrender.com/health';

function healthUrl() {
  return `${env.apiBaseUrl}${endpoints.health}`;
}

export type WarmProgress = {
  attempt: number;
  maxAttempts: number;
  ready: boolean;
};

export function pokeRenderDirect(): void {
  if (typeof window === 'undefined') return;
  void fetch(RENDER_HEALTH, { method: 'GET', mode: 'no-cors', cache: 'no-store' }).catch(
    () => undefined,
  );
  // Same-origin proxy poke (readable when ready).
  void fetch(healthUrl(), { method: 'GET', cache: 'no-store' }).catch(() => undefined);
}

export async function warmApi(): Promise<boolean> {
  pokeRenderDirect();
  try {
    const { data, status } = await axios.get(healthUrl(), {
      timeout: 55000,
      validateStatus: (code) => code < 500,
    });
    if (status !== 200) return false;
    const payload = data as { data?: { status?: string; mongo?: string } };
    if (payload?.data?.mongo === 'up') return true;
    return payload?.data?.status === 'ok' || payload?.data?.status === 'degraded';
  } catch {
    return false;
  }
}

let backgroundWarmStarted = false;

/**
 * Start warming immediately and keep the API awake while the tab is open.
 * Also hits /api/keepalive (Vercel function → Render) when available.
 */
export function warmApiBackground(): void {
  pokeRenderDirect();
  void warmApi();
  void fetch('/api/keepalive', { cache: 'no-store' }).catch(() => undefined);

  if (backgroundWarmStarted || typeof window === 'undefined') return;
  backgroundWarmStarted = true;

  const tick = () => {
    if (document.visibilityState !== 'visible') return;
    pokeRenderDirect();
    void warmApi();
    void fetch('/api/keepalive', { cache: 'no-store' }).catch(() => undefined);
  };

  window.setInterval(tick, 2 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick();
  });
}

/**
 * Keep trying until ready or deadline (default ~3 minutes).
 */
export async function waitForApiReady(options?: {
  maxAttempts?: number;
  delayMs?: number;
  deadlineMs?: number;
  onProgress?: (progress: WarmProgress) => void;
  signal?: AbortSignal;
}): Promise<boolean> {
  const delayMs = options?.delayMs ?? 2000;
  const deadline = Date.now() + (options?.deadlineMs ?? 60_000);
  let attempt = 0;
  const maxAttempts = options?.maxAttempts ?? 60;

  while (Date.now() < deadline && attempt < maxAttempts) {
    if (options?.signal?.aborted) return false;
    attempt += 1;
    options?.onProgress?.({ attempt, maxAttempts, ready: false });
    const ok = await warmApi();
    if (ok) {
      options?.onProgress?.({ attempt, maxAttempts, ready: true });
      return true;
    }
    await new Promise((resolve) => {
      const id = window.setTimeout(resolve, delayMs);
      options?.signal?.addEventListener(
        'abort',
        () => {
          window.clearTimeout(id);
          resolve(undefined);
        },
        { once: true },
      );
    });
  }
  return false;
}
