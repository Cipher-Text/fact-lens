# 15 — Repository structure

Recommended starting shape:

```text
fact-lens/
  apps/
    web/                 # public Next.js
    newsroom/            # internal Next.js
    api/                 # NestJS + Fastify
    worker/              # BullMQ processors
  packages/
    contracts/           # OpenAPI/DTO/Zod schemas, generated clients
    domain/              # shared value objects and policy types only
    ui/                  # accessible shared primitives
    config/              # typed runtime/build config
    shared/              # small framework-neutral utilities
  infrastructure/        # Docker, migrations, deploy/runbooks, IaC later
  docs/
```

This is a recommendation, not a requirement to create every package immediately. Start with `web`, `newsroom`, `api`, `worker`, `contracts`, `config`, `ui`; add `domain` when shared domain types are stable.

## Ownership rules

- API owns persistence and domain invariants.
- Worker owns job processors, not business-rule bypasses.
- `contracts` contains transport schemas, never database entities.
- `domain` contains portable policies/value objects, not Next/Nest imports.
- `ui` cannot import API/database modules.
- Web/newsroom call API through contracts; they do not share ad hoc fetch DTOs.
- Infrastructure never contains secrets; environments provide them.

Use pnpm workspaces. Add Turborepo task caching after the build graph is real; do not create package fragmentation before ownership is clear.
