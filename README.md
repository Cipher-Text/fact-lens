# Fact Lens

Bangla and English news platform. This is the main repository; the rebuild plan is in [`docs/`](docs/README.md).

| Path | What |
| --- | --- |
| `apps/web` | Public site (Next.js 16), imported from `fact-lens-web` with its history. Mock data for now. |
| `apps/api` | NestJS on Fastify API: health, request IDs, error envelope, PostgreSQL migrations (`apps/api/migrations`) for the core editorial schema. |
| `apps/newsroom` | The editorial workspace (Next.js): sign-in with OIDC, desk queue, story workspace, configuration. Talks to the API only through its own server. |
| `apps/worker` | BullMQ worker: transactional outbox dispatcher, scheduled publishing, job runtime. Changes story state only through the API. |
| `tools/dev-idp` | A fake OpenID Connect provider for local sign-in. Development only. |
| `packages/config` | Typed environment validation. |
| `packages/contracts` | Transport schemas shared by apps. |
| `infrastructure/` | Local Postgres, Redis and MinIO (`pnpm infra:up`). |
| `docs/` | The plan: architecture, domain model, roadmap, decisions. |

## Start

```bash
pnpm install
pnpm dev:web        # http://localhost:3000 (Bangla), /en (English)
pnpm infra:up       # needs Docker
cp apps/api/.env.example apps/api/.env
pnpm dev:api        # http://localhost:4000/health/live (uploads go to .data/media; set STORAGE_DRIVER=s3 for MinIO or R2)
pnpm dev:worker     # needs apps/worker/.env and the API running; health at :4100/health
pnpm dev:idp        # fake sign-in provider on :4300 (development only)
pnpm dev:newsroom   # http://localhost:3100; copy apps/newsroom/.env.example to .env first
pnpm --filter @fact-lens/api migrate up   # apply migrations (DATABASE_URL in apps/api/.env)
pnpm --filter @fact-lens/api seed         # desks, categories, default config, feature flags (idempotent)
pnpm check          # lint, typecheck, test, build for every workspace

# Database tests are skipped unless TEST_DATABASE_URL points at a Postgres server
# (worker queue tests also need TEST_REDIS_URL, and the storage tests TEST_S3_ENDPOINT):
TEST_DATABASE_URL=postgres://factlens:factlens@localhost:5432/postgres TEST_REDIS_URL=redis://localhost:6379 pnpm check
```

Agent and contributor rules: [`AGENTS.md`](AGENTS.md). `apps/web` has its own rules in `apps/web/AGENTS.md`.

## Testing storage against MinIO

CI runs the storage tests against a real MinIO server. To do the same locally (needs Docker):

```bash
pnpm infra:up
TEST_S3_ENDPOINT=http://localhost:9000 TEST_S3_ACCESS_KEY=factlens TEST_S3_SECRET_KEY=factlens-local \
  TEST_S3_VERIFIES_SIGNATURES=true TEST_DATABASE_URL=postgres://factlens:factlens@localhost:5432/postgres \
  pnpm --filter @fact-lens/api test
```

Without `TEST_S3_ENDPOINT` those tests are skipped, and on CI a missing service fails a guard test instead of skipping silently.

