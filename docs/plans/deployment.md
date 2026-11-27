# Plan: deployment path (P0, item 3)

Status: **platform decided: one Hetzner VM and Cloudflare R2** (see decision 1). Domains and migrations are still open.

## Goal

The API, worker and public site run in a real environment, built from images in CI, configured only by their own variables, with health checks the platform can use, and with the database migrated as a separate release step. Everything after this (abuse controls, error tracking, SEO, consent) is tested against that environment.

## Current state (checked in the code)

- Each app has a production start command: API `node dist/main.js`, worker `node dist/main.js`, newsroom `next start --port 3100`, site `next start`.
- `packages/config` already refuses production without S3 storage, backend sign-in settings and `INTERNAL_API_TOKEN`.
- The API listens on `API_PORT`/`API_HOST`. The worker has a health server on `WORKER_HEALTH_PORT`. The API has `/health/live` and `/health/ready`. The site has no health route.
- `infrastructure/docker-compose.yml` runs local PostgreSQL, Redis and RustFS only. There are no Dockerfiles.
- CI (`.github/workflows/ci.yml`) runs `pnpm check`. It builds no images.
- `docs/13-observability-and-operations.md` says: images built by GitHub Actions with pinned Node and pnpm, dependency scans, managed services first, and each service deployed independently.

## Decisions needed from you

1. **Platform (decided).** One VPS runs every service in Docker Compose behind Caddy (TLS and routing): the public site, the API, the worker, the newsroom, PostgreSQL and Redis. Cloudflare R2 stores media through its S3 API. Only ports 80 and 443 are open; PostgreSQL and Redis are reachable only inside the compose network. Trade-off: we run the database ourselves, so nightly encrypted backups to R2 and a restore drill are our job (D7).
2. **Domains.** Which hostnames for the site, the newsroom and the API? The site and the API must be on the same site for the media rewrite to avoid a second origin for images.
3. **Migrations.** Run them as a release step before the new API starts (recommended), not on app start.

## Tasks (proposed)

| ID | Task | Owner |
| --- | --- | --- |
| D1 | Dockerfiles for the API, the worker and the site: multi-stage, pinned Node 22 and pnpm 12.9.1, non-root user, only production dependencies in the final image, no `.env` copied in | Codex |
| D2 | CI: build the three images on `main` and check they start (not run), with a dependency scan step | Codex, Claude reviews |
| D3 | Per-service environment matrix: the variables each service receives in production, and a check that a service refuses to start with another service's secrets | Claude (config is critical) |
| D4 | Health for the platform: the site gets a `/health` route; the worker and API probes are wired to the platform | Codex (site route), Claude (probe wiring) |
| D5 | Migration release step: `migrate up` runs once per release before the API starts; a failed migration stops the release | Claude (migrations are critical) |
| D6 | Staging environment (a second VPS, or a second compose project on the same host if budget requires), and a smoke-test runbook (sign-in, a published item, a card render, a poll vote, the 503 page with the API stopped) | Claude |
| D7 | Backups and one restore drill: nightly `pg_dump` encrypted and copied to an R2 bucket with a retention rule, a restore into a scratch database, and the result recorded | Claude |

## Order

D1 and the decisions run first. D2 needs D1. D3 and D5 can run in parallel with D2. D4 needs D1. D6 needs D1 to D5. D7 can run any time after the database exists.

## Verification

- D1 and D2: the images build in CI and the three containers start with a valid environment and exit with a clear error without one.
- D6: the smoke-test runbook is run end to end once, and each step is recorded.
- D7: the restore is checked against row counts from before the backup.

## Risks

- One VPS is a single point of failure. Acceptable at launch scale; the restore drill (D7) and a documented rebuild steps are what make it recoverable.
- Self-run PostgreSQL: a missing backup is a permanent loss. D7 must pass before any real content is loaded.
- Images that contain secrets are a leak. D1 must check that no `.env` file reaches an image.

## Sign-in keys and the first administrator (added with auth plan A9)

- Node 24.7 or later runs the API, because password hashing uses Node's built-in Argon2id.
- Once per environment: `pnpm --filter @fact-lens/api auth:keygen` prints `AUTH_SIGNING_KEY` and `AUTH_ENCRYPTION_KEY`. Keep them in the VM's environment file, never in git. A new signing key signs out everyone.
- Set `AUTH_ISSUER` (the API's public address) and `NEWSROOM_BASE_URL` (the newsroom's public address). Production refuses to start without the four `AUTH_*` and `NEWSROOM_BASE_URL` settings.
- Create the first administrator with `pnpm --filter @fact-lens/api auth:bootstrap -- --email <address> --name "<name>"`. It prints a one-time link (valid 72 hours) to set a password and an authenticator app. It refuses once an administrator exists.
- The API should not be reachable from the internet except through the public site or the newsroom. Behind them, set `TRUST_PROXY=true` on the API and `SITE_TRUST_PROXY=true` on the site (only behind one proxy that appends to `X-Forwarded-For`); set `NEWSROOM_TRUST_PROXY=true` on the newsroom when it sits behind one (ADR-048, ADR-050). Without these, poll votes, view counts and search share one address, and every editor's sign-in shares the newsroom's limit.
- Before launch: the external security review, and the full common-password list (docs/plans/auth-in-app.md, A8).

## Status

- **D1 (Dockerfiles): committed (`f46d2db`), pushed.** `.dockerignore`, `apps/api/Dockerfile`, `apps/worker/Dockerfile`, `apps/web/Dockerfile`. Checks in `docs/plans/deployment/results/D1.txt`. Node 24 (not the Node 22 in the table above) because the API needs `node:crypto` argon2 (Node 24.7+).
- **D2 (CI image job): done locally, not committed.** The base image is pinned by digest. The runtime stage removes npm and corepack, which carried high advisories (undici 6.28.0, brace-expansion) that were not in the app. The test job in `ci.yml` moves from Node 22 to 24: on Node 22 `crypto.argon2` is undefined, so `hashPassword` cannot run in CI. The new `images` job (main only, after `check`) builds the three images for linux/amd64, checks that the API and worker refuse to start without configuration and that the site answers, and runs a Trivy scan (high and critical, unfixed ignored, pinned by digest). Locally: all three pass the start checks and the Trivy gate (exit 0). The workflow itself has not run on GitHub yet.
- Still open: the CI test job's checks on Node 24 are unconfirmed until the next green run.
- **D3 (environment matrix and guard): done locally, not committed.** `docs/plans/deployment/env-matrix.md` lists each service's variables, its secrets and the production rule for each. In `packages/config`, `SERVICE_SECRETS` records which service owns which secret, and each production loader refuses another service's secret (blank values are fine, development is unaffected). Tests: 22 config tests pass, including 7 new ones. Checks: the API, worker and newsroom test suites pass (DB, Redis and S3 tests skipped without their variables); typecheck passes. End to end: the built worker in production refuses `AUTH_SIGNING_KEY` and names it.
- **D4 (health for the platform): done locally, not committed.** The site has `/health` (liveness only, no API call, outside the language routing: the proxy matcher excludes it). Each image has a `HEALTHCHECK` that runs inside the container: the API on `/health/live`, the worker on `/health` (503 when the dispatcher is stale or the database cannot be read), the site on `/health`. Checked with real Postgres and Redis: the API stays live through a database outage and its readiness goes to 503 and back. The platform should use `/health/ready` only where a 503 should take the API out of rotation.
- **D5 (migration release step): done locally, not committed.** `apps/api/src/release/migrate.ts` (compiled to `dist/release/migrate.js`, script `release:migrate`) applies the pending migrations and exits 1 on the first failure. It reads only `DATABASE_URL`. The API never migrates on start. Run it from the API image before the new API starts: `docker run --rm -e DATABASE_URL=... <api image> node dist/release/migrate.js`. The platform must wait for exit 0 before starting the API (D6 wires this).
- **D6 (staging stack and runbook): partly done, blocked.** `deploy/staging/` has the single-host compose stack (only Caddy publishes ports; the release step runs first and the API waits for it), a Caddyfile, env templates and `apps/newsroom/Dockerfile`. `docs/plans/deployment/runbook-smoke.md` has the first deploy and the seven smoke checks. A local dry run passed the wiring checks, including the 503 page with the API stopped. Site caching decided: the public site renders on request (`dynamic = "force-dynamic"` in the `[lang]` layout and the sitemap), so the image builds with the real internal API URL. Still blocked: no staging host or domains yet (decisions 1 and 2). Smoke checks 2 to 5 need a person in a browser.
