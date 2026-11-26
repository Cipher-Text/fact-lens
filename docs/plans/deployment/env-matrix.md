# D3: production environment matrix

Plan: `docs/plans/deployment.md`, task D3. Source of truth: the loaders in `packages/config/src/index.ts`, plus the few settings the apps read directly (noted below). Enforced by `packages/config/src/index.test.ts` (the "production: a service refuses another service's secrets" block).

Each service gets only its own variables from the platform's secret store. In production a service **refuses to start** when it is given a secret that belongs to another service (`SERVICE_SECRETS` in `packages/config`). Development is not affected: the root `.env` holds everything.

- **S** = secret (never in git, never in an image, never in a log).
- **req** = required in production.
- **—** = not read by that service.

## Secrets and their owners

| Variable | Owner | Shared with | Why |
| --- | --- | --- | --- |
| `DATABASE_URL` | api | worker (reads the outbox and schedules) | Connection string with the database password. The newsroom and the public site must not have it. |
| `REDIS_URL` | api | worker | Queue and rate limits. The newsroom and the site must not have it. |
| `INTERNAL_API_TOKEN` | api | worker | Shared secret for the worker's calls to `/internal`. Both need it; nobody else does. |
| `AUTH_SIGNING_KEY` | api | — | Signs the newsroom sessions. A new key signs everyone out. |
| `AUTH_ENCRYPTION_KEY` | api | — | Protects stored sign-in secrets. |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | api | — | Media storage (Cloudflare R2). The worker does not write media yet. |
| `GEMINI_API_KEY` | api | — | Newsroom writing suggestions. |
| `POLL_HASH_SECRET` | api | — | Keys the poll vote hashes. |
| `SESSION_SECRET` | newsroom | — | Encrypts the newsroom's session cookie. |
| `OIDC_CLIENT_SECRET` | newsroom | — | Unused since sign-in moved into the backend (ADR-046); still a secret, so it is owned by the newsroom. |

## Per-service variables

Columns: **API** (`apps/api`), **Worker** (`apps/worker`), **Newsroom** (`apps/newsroom`), **Site** (`apps/web`). Values in production are given as the variable's rule, not an example.

| Variable | API | Worker | Newsroom | Site | Production rule |
| --- | --- | --- | --- | --- | --- |
| `NODE_ENV` | req | req | req | req | `production` |
| `DATABASE_URL` | S, req | S, req | — | — | a Postgres URL on the private network |
| `REDIS_URL` | S, req | S, req | — | — | a Redis URL on the private network |
| `INTERNAL_API_TOKEN` | S, req | S, req | — | — | at least 32 characters, the same value in both |
| `API_BASE_URL` | — | req | req | — | the API's private address, for example `http://api:4000` |
| `API_HOST`, `API_PORT` | default | — | — | — | `0.0.0.0`, `4000` (behind the platform's proxy) |
| `AUTH_SIGNING_KEY`, `AUTH_ENCRYPTION_KEY` | S, req | — | — | — | `pnpm --filter @fact-lens/api auth:keygen`; the encryption key is 32 bytes |
| `AUTH_ISSUER`, `NEWSROOM_BASE_URL` | req | — | req (`NEWSROOM_BASE_URL`) | — | public `https` addresses of the API and the newsroom |
| `AUTH_AUDIENCE` | default | — | — | — | `fact-lens-api` |
| `STORAGE_DRIVER` | req (`s3`) | — | — | — | `s3` is required in production |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_FORCE_PATH_STYLE` | req (bucket) | — | — | — | the R2 endpoint, `auto`, the bucket name, `false` |
| `FS_STORAGE_DIR` | — | — | — | — | development only (`fs` driver) |
| `MAX_UPLOAD_MB` | default | — | — | — | 10 |
| `GEMINI_MODEL` | default | — | — | — | `gemini-2.5-flash` |
| `TRUST_PROXY` | opt | — | — | — | `true` only behind the one proxy that appends `X-Forwarded-For` |
| `PUBLIC_SITE_HOSTS` | opt | — | — | — | the site's host names |
| `SITE_SOCIAL_*`, `SITE_CONTACT_*` | opt | — | — | — | public social and contact details (https only) |
| `LOG_LEVEL` | default | default | — | — | `info` |
| `OIDC_*` (issuer, audience, JWKS, roles claim, MFA) | opt | — | — | — | external provider, not used by the default setup |
| `WORKER_HEALTH_HOST`, `WORKER_HEALTH_PORT` | — | default | — | — | `0.0.0.0` inside the container network, `4100` |
| `OUTBOX_POLL_MS`, `SCHEDULE_SCAN_MS`, `JOB_CONCURRENCY`, `FEED_SCAN_MS`, `ANALYTICS_ROLLUP_MS` | — | default | — | — | defaults |
| `FEED_ALLOW_PRIVATE_HOSTS` | — | refused | — | — | must be off (production refuses it) |
| `OIDC_CLIENT_ID`, `OIDC_SCOPE`, `OIDC_ISSUER` | — | — | opt (unused) | — | not needed; sign-in is in the backend |
| `SESSION_SECRET` | refused | refused | S, req (32+ characters) | refused | newsroom only |
| `OIDC_CLIENT_SECRET` | refused | refused | S, opt (unused) | refused | newsroom only, not needed |
| `NEWSROOM_TRUST_PROXY` | — | — | opt | — | `true` only behind one proxy |
| `DEV_QUICK_LOGIN` | refused | — | refused | — | must be off (production refuses it) |
| `SITE_TRUST_PROXY` | — | — | — | opt | `true` only behind one proxy |
| `FACTLENS_API_URL` | — | — | — | req (see note) | the API's public-facing address the site reads from |
| `PUBLIC_SITE_URL` | — | — | — | opt | the public address of the site, no trailing slash |

"refused" means the service refuses to start in production if the variable has a value.

## Notes for the image tasks

1. **`FACTLENS_API_URL` is read twice.** `next.config.ts` turns it into rewrites at `next build`, so the Dockerfile takes it as a build argument (D1). The site also reads it at run time (`apps/web/src/lib/api/client.ts`, `proxy.ts`, `navigation.ts`), so it must be set on the running container as well, to the same value. The D1 Dockerfile comment says the value cannot be changed at run time; that is only true of the rewrites, and it should be corrected.
2. **The newsroom loads a root `.env` outside development.** `apps/newsroom/next.config.ts` calls `loadEnvConfig` with the workspace root in every mode. A deployment must not carry a `.env` in the newsroom's image or working folder (the root `.dockerignore` keeps it out of the build context). The newsroom image is not in D1 yet.
3. **The worker has no email settings yet.** The email sender is not built (ADR-063, pending item 33). When it is, its provider key is a worker secret and must be added to `SERVICE_SECRETS` for the worker, and to nobody else.
4. **The migration release step (D5) needs `DATABASE_URL` only.** It is not a service; `loadDatabaseEnv` reads only the database address. Give that step the API's `DATABASE_URL` and nothing else.
5. **Platform secrets.** A platform that sets one environment for every service is exactly what the guard catches: a production process that receives another service's secret will not start.
