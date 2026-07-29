/** Vercel serverless keep-alive — hit Render so free-tier does not sleep. */
export default async function handler(_req, res) {
  const targets = [
    'https://nur-api-ow0b.onrender.com/health',
    'https://nur-web-orcin.vercel.app/health',
  ];

  const results = await Promise.all(
    targets.map(async (url) => {
      const started = Date.now();
      try {
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          signal: AbortSignal.timeout(55000),
        });
        const text = await response.text();
        return {
          url,
          ok: response.ok,
          status: response.status,
          ms: Date.now() - started,
          body: text.slice(0, 200),
        };
      } catch (error) {
        return {
          url,
          ok: false,
          status: 0,
          ms: Date.now() - started,
          error: error instanceof Error ? error.message : 'failed',
        };
      }
    }),
  );

  const ready = results.some((r) => r.ok);
  res.status(ready ? 200 : 503).json({ ok: ready, results });
}
