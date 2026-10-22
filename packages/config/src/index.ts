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
  // Object storage for media. `fs` writes to a local folder (development); `s3` is any S3-compatible
  // store such as Cloudflare R2 or MinIO.
  STORAGE_DRIVER: z.enum(['fs', 's3']).default('fs'),
  FS_STORAGE_DIR: z.string().min(1).default('.data/media'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().min(1).default('auto'),
  S3_BUCKET: z.string().min(1).optional(),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  S3_FORCE_PATH_STYLE: z.stringbool().default(false),
  MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(25).default(10),
  /** Gemini API key for the newsroom's writing suggestions. Unset turns the suggestion endpoint off. */
  GEMINI_API_KEY: z.string().optional().transform((v) => v?.trim() || undefined),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
}).superRefine((env, ctx) => {
  if (env.STORAGE_DRIVER === 's3') {
    for (const key of ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const) {
      if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'required when STORAGE_DRIVER is s3' });
    }
  }
  if (env.NODE_ENV === 'production' && env.STORAGE_DRIVER !== 's3') {
    ctx.addIssue({ code: 'custom', path: ['STORAGE_DRIVER'], message: 'must be s3 in production' });
  }
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

/** Settings for the newsroom's server side. Secrets stay on the server; nothing here reaches the browser. */
export const newsroomEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** The public origin of the newsroom, used for the OIDC redirect URI and the origin check on writes. */
  NEWSROOM_BASE_URL: z.string().url(),
  /** Where the browser's requests are forwarded to, over the private network. */
  API_BASE_URL: z.string().url(),
  OIDC_ISSUER: z.string().url(),
  OIDC_CLIENT_ID: z.string().min(1),
  /** Unset for a public client using PKCE only. */
  OIDC_CLIENT_SECRET: z.string().min(1).optional(),
  OIDC_SCOPE: z.string().min(1).default('openid profile'),
  /** Encrypts the session cookie. 32+ characters, random, never reused across environments. */
  SESSION_SECRET: z.string().min(32),
});
export type NewsroomEnv = z.infer<typeof newsroomEnvSchema>;

export function loadNewsroomEnv(source: Record<string, string | undefined> = process.env): NewsroomEnv {
  const parsed = newsroomEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')}`);
  }
  return parsed.data;
}
