import axios from 'axios';
import { env } from '@/config/env';
import { endpoints } from '@/services/endpoints';

function healthUrl() {
  return `${env.apiBaseUrl}${endpoints.health}` || endpoints.health;
}

/** Wake Render (via same-origin proxy in production). Returns true if healthy. */
export async function warmApi(): Promise<boolean> {
  try {
    await axios.get(healthUrl(), { timeout: 60000 });
    return true;
  } catch {
    return false;
  }
}

/** Fire-and-forget warm on app boot. */
export function warmApiBackground(): void {
  void warmApi();
}
