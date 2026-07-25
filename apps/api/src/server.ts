import 'dotenv/config';
import { loadEnv } from './config/env.js';
import { createApp } from './app.js';
import { connectDatabase } from './infrastructure/db/mongoose.js';
import { initSentry, captureUnexpectedError } from './infrastructure/sentry.js';

async function bootstrap() {
  const env = loadEnv();
  const sentryEnabled = initSentry(env);
  if (sentryEnabled) {
    console.info('[api] Sentry error tracking enabled');
  }

  await connectDatabase(env.MONGODB_URI);
  console.info('[api] connected to MongoDB');

  const app = createApp(env);

  app.listen(env.PORT, () => {
    console.info(`[api] NUR API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

bootstrap().catch((error) => {
  console.error('[api] failed to start', error);
  captureUnexpectedError(error);
  process.exit(1);
});
