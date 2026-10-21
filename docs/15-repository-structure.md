# 15 — Repository structure

Current shape (the target shape plus what was added while building):

```text
fact-lens/
  apps/
    web/                 # public Next.js; imported from fact-lens-web via git subtree (history kept), mock data until Phase 4 wires the API
    newsroom/            # internal Next.js: server-side OIDC session, proxy to the API, editor, media library
    api/                 # NestJS + Fastify; owns the database schema (migrations/) and the seed
    worker/              # BullMQ processors and the outbox dispatcher
  packages/
    contracts/           # Zod schemas and shared enums (transport only); no OpenAPI generation yet
    config/              # typed environment/deployment config only — not editorial/runtime configuration or feature flags (those are DB-backed, see docs/21)
  tools/
    dev-idp/             # fake OIDC provider for local sign-in and tests; never deployed
  infrastructure/        # local PostgreSQL, Redis and MinIO (docker-compose); deployment and IaC later
  docs/
```

Not created yet, and only to be added when something needs them: `packages/ui` (accessible shared primitives), `packages/domain` (portable value objects and policy types) and `packages/shared` (small framework-neutral utilities). The workflow rules and readiness checks that `domain` was meant for live in `apps/api/src/stories/` for now, because only the API uses them.

Migrations are in `apps/api/migrations`, not in `infrastructure/`: the API owns the schema, and the worker's tests run the API's migrations. `docs/22-implementation-status.md` says what is built.

## `apps/web` provenance

`apps/web` is the `fact-lens-web` codebase, not a rebuild. It was added with `git subtree add --prefix=apps/web` so its history and the rule/decision IDs cited in its commits are preserved. It keeps its own `AGENTS.md`, `CLAUDE.md`, `.claude/` and read-only `docs/design-system/`. Until `fact-lens-web` is archived, design changes land there first and are pulled in with `git subtree pull`. Phase 4 replaces its mock data (`src/content/`) with API clients from `packages/contracts`.

## Ownership rules

- API owns persistence and domain invariants.
- Worker owns job processors, not business-rule bypasses.
- `contracts` contains transport schemas, never database entities. Where a value set mirrors a database CHECK constraint, a test fails if they drift apart.
- `domain` contains portable policies/value objects, not Next/Nest imports.
- `ui` cannot import API/database modules.
- Web/newsroom call API through contracts; they do not share ad hoc fetch DTOs.
- Infrastructure never contains secrets; environments provide them.

Use pnpm workspaces. Add Turborepo task caching after the build graph is real; do not create package fragmentation before ownership is clear.

## Dependency direction as built

`apps/newsroom` and `apps/api` and `apps/worker` depend on `packages/contracts` and `packages/config`. The newsroom reaches the API over HTTP only, through its own server. The worker reads the outbox and schedules from PostgreSQL but changes story state only through the API's internal endpoints. `tools/dev-idp` is a dev dependency of the newsroom (for tests) and is never imported by application code.
