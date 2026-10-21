# Fact Lens: Agent Instructions (monorepo root)

Fact Lens is a Bangla and English news platform. This repository is the main project; `docs/` is the plan and governs everything outside `apps/web`.

## Layout

| Path | Status |
| --- | --- |
| `apps/web` | The public site. Imported from `fact-lens-web` with its history (git subtree). Mock data only. |
| `docs/` | The rebuild plan (docs 01 to 21). `docs/15-repository-structure.md` is the target layout. |
| `apps/api`, `packages/{config,contracts}` | Phase 1 foundation: NestJS and Fastify API (health, request IDs, error envelope), typed env config, transport schemas. Migrations (node-pg-migrate, SQL) for locale, configuration, feature flags, taxonomy, contributors, media, story/revision/translation, slug registry, sources, assignments, comments, corrections, publishing schedule, card templates and generated cards, advertising (advertiser, campaign, placement, ad, ad_event), audit and outbox, roles and capabilities. Story endpoints (`/stories`, workflow transitions, corrections) review comments, assignments, sources and the story timeline, and the public read model (`/public/stories`). Auth: OIDC bearer tokens (jose), default-deny guard, capability checks, MFA for privileged capabilities. |
| `apps/worker` | BullMQ worker: outbox dispatcher (leases, retries, dead letters), idempotent job runtime, scheduled-publish scanner, health endpoint. Reads PostgreSQL for the outbox and schedules but changes story state only through the API's `/internal` endpoints. |
| `apps/newsroom` | Editorial workspace (Next.js 16, Tailwind 4). Server-side OIDC code flow with PKCE; the access token lives in an encrypted HttpOnly cookie and the browser reaches the API only through `/api/*`, a proxy that checks the origin and an allowlist. Desk queue, story workspace (Tiptap rich-text editor limited to the body contract), configuration; inbox, media and calendar are placeholders. |
| `tools/dev-idp` | Fake OIDC provider for local development and tests. Refuses to run when `NODE_ENV=production`. Never deploy it. |
| `packages/{ui,domain,shared}` | Planned, not created yet. See Phase 1 in `docs/16-implementation-roadmap.md`. |

## Rules

- `apps/web` has its own `AGENTS.md`, `CLAUDE.md` and `.claude/`. Work inside `apps/web` follows those rules (one ticket at a time, design-system rule IDs, no backend yet). Do not edit `apps/web/docs/design-system/`.
- The design source is still `fact-lens-web`. Until it is archived, sync design changes into `apps/web` by `git subtree pull --prefix=apps/web <fact-lens-web> main`.
- Schema changes are new SQL migrations in `apps/api/migrations` with both Up and Down sections. Never edit a migration that is on `main`. Database tests need `TEST_DATABASE_URL`.
- Every API route requires authentication unless marked `@Public()`. Gate actions with `@RequireCapability(...)`, never with role names. Privileged changes write an `audit_event` (and any outbox row) in the same transaction.
- The worker must not bypass domain rules: anything that changes story, revision or schedule state goes through an API endpoint. New outbox event types need a schema in `packages/contracts/src/jobs.ts` and a route in `apps/worker/src/outbox/routes.ts`, or the dispatcher parks them. Jobs must be safe to run twice.
- The newsroom must not duplicate API rules: what a person may do next comes from the API (`transitions` on the story detail), and hiding a menu item is only a convenience because the API enforces. Newsroom forms use `onSubmit` (see `src/lib/form.ts`), not form `action`, so a failed save does not wipe what was typed.
- The newsroom editor (`apps/newsroom/src/lib/editor/extensions.ts`) must offer exactly the node and mark types the body contract lists; a test compares them. Add a type to `packages/contracts/src/body.ts` first, then to the editor, then to the public renderer, never the other way round.
- Use pnpm. Do not use npm or yarn.
- `cipher-press` is read only. Do not change it.
- Run `pnpm check` from the root before you hand over.
