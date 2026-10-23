# Fact Lens

Bangla and English news platform. This is the main repository; the rebuild plan is in [`docs/`](docs/README.md), and [what is built and what is not](docs/22-implementation-status.md) is kept next to it.

| Path | What |
| --- | --- |
| `apps/web` | Public site (Next.js 16), imported from `fact-lens-web` with its history. Mock data for now; it does not call the API yet. |
| `apps/api` | NestJS on Fastify API. News items and the editorial workflow, comments, assignments, sources, the media library, a public read model, feature flags, audit. Owns the PostgreSQL schema (`apps/api/migrations`) and the seed. |
| `apps/newsroom` | The editorial workspace (Next.js): OIDC sign-in, desk queue, news item workspace with a rich-text editor, media library, configuration. Reaches the API only through its own server. |
| `apps/worker` | BullMQ worker: outbox dispatcher, job runtime, scheduled publishing. Changes news item state only through the API. |
| `tools/dev-idp` | A fake OpenID Connect provider for local sign-in. Development only. |
| `packages/config` | Typed environment validation for each app. |
| `packages/contracts` | Shared schemas, enums and the news item body contract. |
| `infrastructure/` | Local PostgreSQL, Redis and MinIO (`pnpm infra:up`). |
| `docs/` | The plan and what is built: start at [`docs/README.md`](docs/README.md) and [`docs/22-implementation-status.md`](docs/22-implementation-status.md). |

## Start

The quickest way is one command. It checks the tools, creates `.env` if needed, starts PostgreSQL, Redis and MinIO with Docker if they are not already running, applies the migrations and seed, then starts the apps one after another (dev identity provider, API, worker, newsroom, web), each only after the previous one answers its health check:

```bash
pnpm install
./run.sh            # Ctrl-C stops everything; ./run.sh -d runs in the background
./run.sh status     # what is running      ./run.sh logs api   # follow a log      ./run.sh stop
```

If PostgreSQL is already running on the port in `DATABASE_URL`, `run.sh` uses it, but first checks that the login in `.env` works. When it does not (for example your own PostgreSQL has no `factlens` login), it prints the exact `psql` commands that create it, or you can point `DATABASE_URL` at a login you already have. It changes nothing in your database. A login that is used for the test suites also needs `CREATEDB`.

Options: `--no-infra` (do not start Docker services), `--no-web`, `-d`/`--detach`. Logs and process ids are in `.run/`. If a service does not come up, `run.sh` prints its last log lines and stops the ones it started. To start the pieces yourself:

```bash
pnpm install
pnpm env:init       # creates the root .env from .env.example, with random secrets
pnpm infra:up       # PostgreSQL, Redis and MinIO; needs Docker
pnpm --filter @fact-lens/api migrate up   # apply migrations
pnpm --filter @fact-lens/api seed         # desks, categories, default config, feature flags (idempotent)

pnpm dev:idp        # fake sign-in provider on :4300 (development only)
pnpm dev:api        # http://localhost:4000/health/live (uploads go to .data/media)
pnpm dev:worker     # health at :4100/health; needs the API running
pnpm dev:newsroom   # http://localhost:3100
pnpm dev:web        # http://localhost:3000 (Bangla), /en (English); has its own setup

pnpm check          # lint, typecheck, test, build for every workspace
```

## Configuration

The API, the worker, the newsroom and the dev identity provider share **one** file: `.env` in the repository root. Copy `.env.example` (or run `pnpm env:init`) and edit it. Each app reads only its own variables, and the file is ignored by git. `pnpm env:init` never replaces a value in an existing `.env`; it only fills secrets that are still blank.

- Variables that must agree across apps appear once: `DATABASE_URL`, `REDIS_URL`, `INTERNAL_API_TOKEN` (API and worker), `API_BASE_URL` (worker and newsroom), `OIDC_ISSUER` (API and newsroom).
- `GEMINI_API_KEY` (API only, optional) turns on the newsroom's "Generate with Gemini" and "Translate with Gemini" buttons; `GEMINI_MODEL` changes the model. Without the key the buttons report that suggestions are not set up. The news text is sent to Google when a button is used.
- `FACTLENS_API_URL` (`apps/web` only, optional) makes the public site's header menu, social links and daily poll read the API; leave it unset to keep the static menu and the mock poll.
- `POLL_HASH_SECRET`, `POLL_VOTES_PER_IP_PER_DAY` and `TRUST_PROXY` (API only, optional) control poll voting. Behind a proxy or the public site, set `TRUST_PROXY=true` only if the API cannot be reached any other way, or the per-address limit can be faked.
- `FEED_SCAN_MS` and `FEED_ALLOW_PRIVATE_HOSTS` (worker only, optional) control the source inbox's RSS fetching. Leave private hosts off outside development: it is what keeps a feed address from reaching inside the network.
- A variable set in the shell or by a deployment wins over the file.
- The root `.env` is for development. In a deployment each service gets only its own variables from the platform's secret store; the newsroom, for example, should not be given the database password.
- Test settings (`TEST_DATABASE_URL` and the others below) are not read from the file. Pass them in the shell.

```bash
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

