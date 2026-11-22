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
- The API should not be reachable from the internet except through the reverse proxy, since it trusts the forwarded client address for its limits (`TRUST_PROXY`).
- Before launch: the external security review, and the full common-password list (docs/plans/auth-in-app.md, A8).
