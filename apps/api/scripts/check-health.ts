/**
 * Uptime-style check against GET /health.
 * Usage: HEALTH_URL=https://api.example.com/health npm run check:health
 */
const url = process.env.HEALTH_URL ?? 'http://localhost:4000/health';

async function main() {
  const started = Date.now();
  const res = await fetch(url);
  const ms = Date.now() - started;
  const body = (await res.json()) as {
    data?: { status?: string; mongo?: string };
  };

  console.info(`HTTP ${res.status} in ${ms}ms`);
  console.info(JSON.stringify(body, null, 2));

  if (!res.ok || body.data?.status !== 'ok' || body.data?.mongo !== 'up') {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[check:health] failed', error);
  process.exit(1);
});
