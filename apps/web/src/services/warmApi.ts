import axios from 'axios';
import { env } from '@/config/env';
import { endpoints } from '@/services/endpoints';

function healthUrl() {
  return `${env.apiBaseUrl}${endpoints.health}`;
}

export type WarmProgress = {
  attempt: number;
  maxAttempts: number;
  ready: boolean;
};

/** Single health probe (through Vercel → Render in production). */
export async function warmApi(): Promise<boolean> {
  try {
    const { data, status } = await axios.get(healthUrl(), {
      timeout: 12000,
      validateStatus: (code) => code < 500,
    });
    if (status !== 200) return false;
    const payload = data as { data?: { status?: string; mongo?: string } };
    return payload?.data?.status === 'ok' && payload?.data?.mongo === 'up';
  } catch {
    return false;
  }
}

export function warmApiBackground(): void {
  void warmApi();
}

/**
 * Poll until API is reachable or attempts exhausted.
 * Free Render cold starts often need 20–50s.
 */
export async function waitForApiReady(options?: {
  maxAttempts?: number;
  delayMs?: number;
  onProgress?: (progress: WarmProgress) => void;
  signal?: AbortSignal;
}): Promise<boolean> {
  const maxAttempts = options?.maxAttempts ?? 12;
  const delayMs = options?.delayMs ?? 2000;

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
        options?.signal?.addEventListener('abort', () => {
          window.clearTimeout(id);
          resolve(undefined);
        });
      });
    }
  }
  return false;
}
