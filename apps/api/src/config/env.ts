import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
    SENTRY_DSN: z.preprocess(
      (value) => (value === '' || value === undefined || value === null ? undefined : value),
      z.string().url().optional(),
    ),
    /** Optional Resend — password reset emails in production. */
    RESEND_API_KEY: z.preprocess(
      (value) => (value === '' || value === undefined || value === null ? undefined : value),
      z.string().min(1).optional(),
    ),
    EMAIL_FROM: z.preprocess(
      (value) => (value === '' || value === undefined || value === null ? undefined : value),
      z.string().email().optional(),
    ),
    WEB_APP_URL: z.preprocess(
      (value) => (value === '' || value === undefined || value === null ? undefined : value),
      z.string().url().optional(),
    ),
  })
  .superRefine((data, ctx) => {
    const origins = data.CORS_ORIGIN.split(',').map((o) => o.trim());
    if (origins.includes('*')) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ORIGIN'],
        message: 'CORS_ORIGIN must not include * when credentials are enabled',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(envSource: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(envSource);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getEnv(): Env {
  if (!cachedEnv) {
    return loadEnv();
  }
  return cachedEnv;
}

/** Test helper — reset cached env between suites. */
export function resetEnvCache(): void {
  cachedEnv = null;
}
