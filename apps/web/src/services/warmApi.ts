import axios from 'axios';
import { env } from '@/config/env';
import { endpoints } from '@/services/endpoints';

/** Direct Render URL — used only to poke cold starts (opaque / best-effort). */
const RENDER_HEALTH = 'https://nur-api-ow0b.onrender.com/health';

function healthUrl() {
  return `${env.apiBaseUrl}${endpoints.health}`;
}

export type WarmProgress = {
  attempt: number;
  maxAttempts: number;
  ready: boolean;
};

/** Best-effort poke so Render starts spinning even if Vercel rewrite times out. */
function pokeRenderDirect(): void {
  if (typeof window === 'undefined') return;
  void fetch(RENDER_HEALTH, {
    method: 'GET',
    mode: 'no-cors',
    cache: 'no-store',
  }).catch(() => {
    // ignore — wake-only
  });
}

/**
 * Wake Render via Vercel rewrite.
 * Free-tier cold start can take 30–60s for a single request — timeout must cover that.
 */
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

/** Fire-and-forget warm; also schedules a quiet keep-alive while the tab is open. */
export function warmApiBackground(): void {
  pokeRenderDirect();
  void warmApi();
  if (backgroundWarmStarted || typeof window === 'undefined') return;
  backgroundWarmStarted = true;

  window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      pokeRenderDirect();
      void warmApi();
    }
  }, 4 * 60 * 1000);
}

/**
 * Poll until API is reachable or attempts exhausted.
 * Default budget ≈ several minutes for stubborn cold starts.
 */
export async function waitForApiReady(options?: {
  maxAttempts?: number;
  delayMs?: number;
  onProgress?: (progress: WarmProgress) => void;
  signal?: AbortSignal;
}): Promise<boolean> {
  const maxAttempts = options?.maxAttempts ?? 8;
  const delayMs = options?.delayMs ?? 1500;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (options?.signal?.aborted) return false;
    options?.onProgress?.({ attempt, maxAttempts, ready: false });
    const ok = await warmApi();
    if (ok) {
      options?.onProgress?.({ attempt, maxAttempts, ready: true });
      return true;
    }
    if (attempt < maxAttempts) {
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
  }
  return false;
}
