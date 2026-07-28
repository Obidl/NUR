import axios from 'axios';
import { env } from '@/config/env';
import { endpoints } from '@/services/endpoints';

/** Fire-and-forget wake for Render cold starts (can take 30–60s). */
export function warmApi(): void {
  void axios
    .get(`${env.apiBaseUrl}${endpoints.health}`, { timeout: 60000 })
    .catch(() => {
      // Ignore — next user request will retry after wake.
    });
}
