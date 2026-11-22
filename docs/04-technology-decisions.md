# 04 — Technology decisions

## Accepted stack

| Decision | Recommendation | Reasoning and tradeoff |
|---|---|---|
| Public frontend | Next.js 16 + TypeScript (React 19, Tailwind 4, shadcn/ui), imported from `fact-lens-web` as `apps/web` | Matches current public route needs and supports SSR/SSG/ISR, metadata, sitemap and CDN-friendly delivery. Avoids preserving Strapi coupling. |
| Newsroom | Separate Next.js/React + TypeScript | Editorial UX has different navigation, permissions and interaction density from the public site. Shared UI/contracts may be reused; deployment can remain independently scalable. |
| API | NestJS + Fastify adapter | Explicit modules, DI, validation, guards and OpenAPI fit a large domain while Fastify improves request overhead. NestJS adds conventions/indirection; keep modules domain-focused. |
| API style | REST-first | Stable resource/command contracts are easier for public web, newsroom, workers and migration tooling. Use SSE/WebSocket only for live job/progress or collaborative signals that need it. |
| Database | PostgreSQL | Relational integrity, JSONB for bounded flexible data, FTS/`pg_trgm`, transactions and mature operations. Authoritative source; not OpenSearch. |
| Cache/ephemeral | Redis | Good fit for BullMQ, rate limits, short-lived cache and locks. Never use it as the only record of editorial state. |
| Jobs | BullMQ + Redis | Simple TypeScript queue with retry/backoff and delayed jobs. Operationally smaller than Kafka. |
| Search | PostgreSQL FTS + `pg_trgm` first | Reduces moving parts and keeps writes transactional. Move to OpenSearch only with measured advanced query/scale requirements. |
| Media | Cloudflare R2 + CDN/image transforms | Durable object storage, no egress fees when paired with Cloudflare's CDN, and immutable variants. Store metadata/rights in PostgreSQL. |
| Auth | Backend-managed accounts and sessions | Resolved by ADR-046: admin invitations, Argon2id passwords, TOTP, rotating refresh tokens, and newsroom sign-in. |
| AI | Central AI Gateway/module, Google Gemini as initial provider | Provider-neutral calls, budgets, prompt versions, provenance and safety in one place. No direct provider calls from domain modules. The Gateway's adapter pattern keeps Gemini swappable/addable alongside other providers rather than hard-wired into business logic. |
| Repo | pnpm + Turborepo-compatible TypeScript monorepo | Shared contracts/config/UI and coordinated changes are valuable. Start with workspace boundaries; add Turborepo caching when build graph justifies it. |
| Infra | Docker Compose on one Hetzner VM, with Cloudflare R2 for media | Platform decision is recorded in [deployment plan](./plans/deployment.md). PostgreSQL and Redis run on the VM in the private Compose network; backups and restore drills remain to be built. |
| Web analytics/SEO tracking | Google Analytics 4 tag + Google Search Console site verification | Carries forward CipherPress's current tag-based approach (`GoogleTag.tsx`/GTM) onto the public site; GSC verification plus the existing sitemap satisfies indexing needs. Tag/verification only for now — pulling GSC/GA4 performance data back into the newsroom via their APIs is a later enhancement, not a Phase 1/4 dependency. |

## Choices made while building

| Area | Choice | Note |
|---|---|---|
| Migrations | `node-pg-migrate`, plain SQL files with Up and Down sections, in `apps/api/migrations` | No ORM; see ADR-017 |
| Contracts | Zod 4 schemas in `packages/contracts` | Not OpenAPI-first; see ADR-018 |
| Language | TypeScript 7 in the API, worker and packages; TypeScript 5 in the Next.js apps | `typescript-eslint` does not support 7 yet |
| API runtime | NestJS 12 on Fastify 5, `pg` for queries | |
| Token validation | `jose`, asymmetric algorithms only, issuer and audience checked | |
| Browser sign-in | Newsroom sign-in page with server-side API session proxy | See ADR-046 and ADR-047; OIDC remains for local development and tests. |
| Queues | BullMQ 6 with ioredis | One queue per job family |
| Editor | Tiptap 3 limited to the body contract | |
| Images | `sharp` for decoding, re-encoding and variants; `@aws-sdk/client-s3` for storage | |
| Frontends | Next.js 16, React 19, Tailwind 4 | `apps/web` follows its own design-system rules |
| Tests | Vitest everywhere; real PostgreSQL, Redis and (in CI and locally) an S3-compatible server, RustFS, for integration tests | No browser tests yet |

## Alternatives considered

- **Strapi:** useful current migration source, but insufficient workflow/revision/source/audit semantics and would make the newsroom depend on generic Admin UX.
- **Java/Spring:** technically viable, but the target should be selected from product/runtime coherence, not an individual developer’s familiarity. TypeScript across web/API/workers reduces contract and hiring friction for this product.
- **Microservices:** defer. They multiply deployment, data consistency and observability cost before boundaries are proven.
- **GraphQL:** defer. REST is sufficient and easier to cache/authorize for initial public and newsroom use cases.
- **OpenSearch:** defer until faceting/autocomplete/semantic/hybrid search or measured corpus/latency needs exceed PostgreSQL.
- **Temporal:** defer until workflows are long-running, human-interrupted, durable across deploys and complex enough that BullMQ state machines become unsafe.
- **Kafka:** defer until event volume, independent consumers, replay/retention and cross-system streaming justify the operational cost.
- **Kubernetes:** defer until multi-service scheduling, autoscaling or multi-environment operational requirements exceed managed containers/Compose-like deployment.
- **ClickHouse:** defer until analytics volume/query patterns demand columnar analysis; start with operational PostgreSQL plus an external analytics product if needed.
- **Other AI providers (OpenAI, Anthropic, etc.):** not excluded — the AI Gateway's adapter pattern supports adding or swapping providers per use case; Gemini is the confirmed initial provider, not an exclusivity decision.

## Deliberate initial omissions

No Kubernetes, Kafka, OpenSearch, Temporal, ClickHouse, service mesh, event-sourced primary model, or direct LLM calls inside request handlers. These are not forbidden; each has a revisit trigger in [ADRs](./17-architecture-decisions.md).
