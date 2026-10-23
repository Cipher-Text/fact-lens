# Fact Lens: Agent Instructions (monorepo root)

Fact Lens is a Bangla and English news platform. This repository is the main project; `docs/` is the plan and governs everything outside `apps/web`.

## Layout

| Path | What it is |
| --- | --- |
| `apps/web` | The public site, imported from `fact-lens-web` with its history (git subtree). Mock data only; its header menu, social links and daily poll are the optional calls to the API (`FACTLENS_API_URL`). |
| `apps/api` | NestJS on Fastify. Default-deny authentication with capability checks, the editorial workflow (`/news`), comments, assignments, sources, the media library (`/media`), reference data, feature flags, a public read model (`/public`), and an internal endpoint for the worker. Owns the SQL migrations (node-pg-migrate) and the seed. |
| `apps/worker` | BullMQ worker: outbox dispatcher (leases, retries, dead letters), idempotent job runtime, scheduled-publish scanner, RSS feed fetching (guarded against private addresses), health endpoint. Reads PostgreSQL for the outbox and schedules but changes news item state only through the API's `/internal` endpoints. |
| `apps/newsroom` | Editorial workspace (Next.js 16, Tailwind 4). Server-side OIDC code flow with PKCE; the access token lives in an encrypted HttpOnly cookie and the browser reaches the API only through `/api/*`, a proxy that checks the origin and an allowlist. Desk queue, news item workspace (Tiptap editor limited to the body contract, with a media picker), media library, configuration. The source inbox (RSS feeds, triage, make a news item from an item) is built; the calendar is a placeholder. |
| `tools/dev-idp` | Fake OIDC provider for local development and tests. Refuses to run when `NODE_ENV=production`. Never deploy it. |
| `packages/config` | Typed environment validation for the API, worker and newsroom. All three read the single root `.env`. |
| `packages/contracts` | Zod schemas and enums shared across apps, including the news item body contract and job and event contracts. |
| `infrastructure/` | Local PostgreSQL, Redis and MinIO (docker compose). |
| `docs/` | The plan (docs 01 to 21) and `22-implementation-status.md`, which says what is built. `docs/15-repository-structure.md` has the layout and ownership rules. |

`packages/{ui,domain,shared}` are planned and not created.

## Rules

- `apps/web` has its own `AGENTS.md`, `CLAUDE.md` and `.claude/`. Work inside `apps/web` follows those rules (one ticket at a time, design-system rule IDs, no backend yet). Do not edit `apps/web/docs/design-system/`.
- The design source is still `fact-lens-web`. Until it is archived, sync design changes into `apps/web` by `git subtree pull --prefix=apps/web <fact-lens-web> main`.
- Schema changes are new SQL migrations in `apps/api/migrations` with both Up and Down sections. Never edit a migration that is on `main`. Database tests need `TEST_DATABASE_URL`.
- Every API route requires authentication unless marked `@Public()`. Gate actions with `@RequireCapability(...)`, never with role names. Privileged changes write an `audit_event` (and any outbox row) in the same transaction.
- The worker must not bypass domain rules: anything that changes news item, revision or schedule state goes through an API endpoint. New outbox event types need a schema in `packages/contracts/src/jobs.ts` and a route in `apps/worker/src/outbox/routes.ts`, or the dispatcher parks them. Jobs must be safe to run twice.
- The newsroom must not duplicate API rules: what a person may do next comes from the API (`transitions` on the news item detail), and hiding a menu item is only a convenience because the API enforces. Newsroom forms use `onSubmit` (see `src/lib/form.ts`), not form `action`, so a failed save does not wipe what was typed.
- Newsroom colours come from the CSS variables in `apps/newsroom/src/app/globals.css`, which follow the `dark` class on `<html>` (set by `src/lib/theme.ts` before first paint), not the system setting alone. Do not use `@media (prefers-color-scheme)` or hard-coded colours in components; use the variables or Tailwind's `dark:` classes.
- The newsroom editor (`apps/newsroom/src/lib/editor/extensions.ts`) must offer exactly the node and mark types the body contract lists; a test compares them. Add a type to `packages/contracts/src/body.ts` first, then to the editor, then to the public renderer, never the other way round.
- Upload bytes are untrusted: the type comes from the bytes, images are re-encoded, and public readers get only derivatives of images used by a live news item whose rights still allow the web. Do not add a route that serves an original or an unpublished image without sign-in. Rights rules live in `apps/api/src/news/validation.ts`; keep the newsroom's `rightsStatus` (`apps/newsroom/src/lib/media.ts`) in step with them.
- There is one `.env`, at the repository root, for the API, worker, newsroom and dev identity provider; `.env.example` is its template. A new setting goes in `packages/config`, in `.env.example` (blank if it is a secret, and add it to `GENERATED` in `scripts/init-env.mjs` if it must be random) and in the README. Never read `.env` from application code: scripts load it with `--env-file-if-exists=../../.env`, and Next loads it in `apps/newsroom/next.config.ts`. Never commit `.env`. Do not give an app another app's secrets in a deployment.
- `./run.sh` starts the whole stack for local work and is what to use to look at a change running; it is tested by `scripts/run-sh.test.mjs`. A new app that needs to run locally is added to its service list, with a port and a health URL, and to the README.
- Keep the docs true. When a change adds, removes or changes what exists, update `docs/22-implementation-status.md` and the doc it affects, and record a choice the plan did not make as an ADR in `docs/17-architecture-decisions.md`.
- Use pnpm. Do not use npm or yarn.
- `cipher-press` is read only. Do not change it.
- Run `pnpm check` from the root before you hand over.
