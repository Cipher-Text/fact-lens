# 15 — Repository structure

Recommended starting shape:

```text
fact-lens/
  apps/
    web/                 # public Next.js; imported from fact-lens-web via git subtree (history kept), mock data until Phase 4 wires the API
    newsroom/            # internal Next.js
    api/                 # NestJS + Fastify
    worker/              # BullMQ processors
  packages/
    contracts/           # OpenAPI/DTO/Zod schemas, generated clients
    domain/              # shared value objects and policy types only
    ui/                  # accessible shared primitives
    config/              # typed environment/deployment config only — not editorial/runtime configuration or feature flags (those are DB-backed, see docs/21)
    shared/              # small framework-neutral utilities
  infrastructure/        # Docker, migrations, deploy/runbooks, IaC later
  docs/
```

This is a recommendation, not a requirement to create every package immediately. Start with `web`, `newsroom`, `api`, `worker`, `contracts`, `config`, `ui`; add `domain` when shared domain types are stable.

## `apps/web` provenance

`apps/web` is the `fact-lens-web` codebase, not a rebuild. It was added with `git subtree add --prefix=apps/web` so its history and the rule/decision IDs cited in its commits are preserved. It keeps its own `AGENTS.md`, `CLAUDE.md`, `.claude/` and read-only `docs/design-system/`. Until `fact-lens-web` is archived, design changes land there first and are pulled in with `git subtree pull`. Phase 4 replaces its mock data (`src/content/`) with API clients from `packages/contracts`.

## Ownership rules

- API owns persistence and domain invariants.
- Worker owns job processors, not business-rule bypasses.
- `contracts` contains transport schemas, never database entities.
- `domain` contains portable policies/value objects, not Next/Nest imports.
- `ui` cannot import API/database modules.
- Web/newsroom call API through contracts; they do not share ad hoc fetch DTOs.
- Infrastructure never contains secrets; environments provide them.

Use pnpm workspaces. Add Turborepo task caching after the build graph is real; do not create package fragmentation before ownership is clear.
