# Fact Lens: Agent Instructions (monorepo root)

Fact Lens is a Bangla and English news platform. This repository is the main project; `docs/` is the plan and governs everything outside `apps/web`.

## Layout

| Path | Status |
| --- | --- |
| `apps/web` | The public site. Imported from `fact-lens-web` with its history (git subtree). Mock data only. |
| `docs/` | The rebuild plan (docs 01 to 21). `docs/15-repository-structure.md` is the target layout. |
| `apps/api`, `packages/{config,contracts}` | Phase 1 foundation: NestJS and Fastify API (health, request IDs, error envelope), typed env config, transport schemas. Migrations (node-pg-migrate, SQL) for locale, configuration, feature flags, taxonomy, contributors, media, story/revision/translation, slug registry, sources, assignments, comments, corrections, publishing schedule, card templates and generated cards, audit and outbox. |
| `apps/{newsroom,worker}`, `packages/{ui,domain,shared}` | Planned, not created yet. See Phase 1 in `docs/16-implementation-roadmap.md`. |

## Rules

- `apps/web` has its own `AGENTS.md`, `CLAUDE.md` and `.claude/`. Work inside `apps/web` follows those rules (one ticket at a time, design-system rule IDs, no backend yet). Do not edit `apps/web/docs/design-system/`.
- The design source is still `fact-lens-web`. Until it is archived, sync design changes into `apps/web` by `git subtree pull --prefix=apps/web <fact-lens-web> main`.
- Schema changes are new SQL migrations in `apps/api/migrations` with both Up and Down sections. Never edit a migration that is on `main`. Database tests need `TEST_DATABASE_URL`.
- Use pnpm. Do not use npm or yarn.
- `cipher-press` is read only. Do not change it.
- Run `pnpm check` from the root before you hand over.
