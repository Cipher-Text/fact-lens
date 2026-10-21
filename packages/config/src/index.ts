import { z } from 'zod';

/**
 * Typed deployment/environment config only. Editorial and runtime
 * configuration and feature flags are DB-backed (docs/21), not read here.
 */
export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  // OIDC (provider-neutral). Unset in development means every protected route returns 401.
  OIDC_ISSUER: z.string().url().optional(),
  OIDC_AUDIENCE: z.string().min(1).optional(),
  OIDC_JWKS_URI: z.string().url().optional(),
  /** Claim holding role keys; a dotted path such as `realm_access.roles` is allowed. */
  OIDC_ROLES_CLAIM: z.string().min(1).default('roles'),
  OIDC_REQUIRE_MFA: z.stringbool().default(true),
  /** Shared secret for the worker's calls to /internal. Unset disables those endpoints. */
  INTERNAL_API_TOKEN: z.string().min(32).optional(),
}).superRefine((env, ctx) => {
  if (env.NODE_ENV === 'production') {
    for (const key of ['OIDC_ISSUER', 'OIDC_AUDIENCE', 'INTERNAL_API_TOKEN'] as const) {
      if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'required in production' });
    }
  }
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function loadApiEnv(source: Record<string, string | undefined> = process.env): ApiEnv {
  const parsed = apiEnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${issues}`);
  }
  return parsed.data;
}

/** For CLI tools (migrations, seed) that need the database but not Redis. */
export const databaseEnvSchema = z.object({ DATABASE_URL: z.string().url() });
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export function loadDatabaseEnv(source: Record<string, string | undefined> = process.env): DatabaseEnv {
  const parsed = databaseEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }
  return parsed.data;
}

export const workerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  /** Base URL of the API, reached over the private network. */
  API_BASE_URL: z.string().url(),
  INTERNAL_API_TOKEN: z.string().min(32),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  WORKER_HEALTH_PORT: z.coerce.number().int().min(1).max(65535).default(4100),
  OUTBOX_POLL_MS: z.coerce.number().int().min(100).default(1000),
  SCHEDULE_SCAN_MS: z.coerce.number().int().min(1000).default(30000),
  JOB_CONCURRENCY: z.coerce.number().int().min(1).max(50).default(5),
});
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function loadWorkerEnv(source: Record<string, string | undefined> = process.env): WorkerEnv {
  const parsed = workerEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')}`);
  }
  return parsed.data;
}
