# Fact Lens

Bangla and English news platform. This is the main repository; the rebuild plan is in [`docs/`](docs/README.md).

| Path | What |
| --- | --- |
| `apps/web` | Public site (Next.js 16), imported from `fact-lens-web` with its history. Mock data for now. |
| `apps/api` | NestJS on Fastify API: health, request IDs, error envelope. |
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
pnpm dev:api        # http://localhost:4000/health/live
pnpm check          # lint, typecheck, test, build for every workspace
```

Agent and contributor rules: [`AGENTS.md`](AGENTS.md). `apps/web` has its own rules in `apps/web/AGENTS.md`.
