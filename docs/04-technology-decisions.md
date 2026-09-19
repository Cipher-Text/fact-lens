# 04 — Technology decisions

## Accepted stack

| Decision | Recommendation | Reasoning and tradeoff |
|---|---|---|
| Public frontend | Next.js + TypeScript | Matches current public route needs and supports SSR/SSG/ISR, metadata, sitemap and CDN-friendly delivery. Avoids preserving Strapi coupling. |
| Newsroom | Separate Next.js/React + TypeScript | Editorial UX has different navigation, permissions and interaction density from the public site. Shared UI/contracts may be reused; deployment can remain independently scalable. |
| API | NestJS + Fastify adapter | Explicit modules, DI, validation, guards and OpenAPI fit a large domain while Fastify improves request overhead. NestJS adds conventions/indirection; keep modules domain-focused. |
| API style | REST-first | Stable resource/command contracts are easier for public web, newsroom, workers and migration tooling. Use SSE/WebSocket only for live job/progress or collaborative signals that need it. |
| Database | PostgreSQL | Relational integrity, JSONB for bounded flexible data, FTS/`pg_trgm`, transactions and mature operations. Authoritative source; not OpenSearch. |
| Cache/ephemeral | Redis | Good fit for BullMQ, rate limits, short-lived cache and locks. Never use it as the only record of editorial state. |
| Jobs | BullMQ + Redis | Simple TypeScript queue with retry/backoff and delayed jobs. Operationally smaller than Kafka. |
| Search | PostgreSQL FTS + `pg_trgm` first | Reduces moving parts and keeps writes transactional. Move to OpenSearch only with measured advanced query/scale requirements. |
| Media | Cloudflare R2 + CDN/image transforms | Durable object storage, no egress fees when paired with Cloudflare's CDN, and immutable variants. Store metadata/rights in PostgreSQL. |
| Auth | OIDC provider | Avoid custom password/session security. Evaluate managed provider and self-hosted Keycloak-style option against cost, availability and editorial admin requirements. |
| AI | Central AI Gateway/module, Google Gemini as initial provider | Provider-neutral calls, budgets, prompt versions, provenance and safety in one place. No direct provider calls from domain modules. The Gateway's adapter pattern keeps Gemini swappable/addable alongside other providers rather than hard-wired into business logic. |
| Repo | pnpm + Turborepo-compatible TypeScript monorepo | Shared contracts/config/UI and coordinated changes are valuable. Start with workspace boundaries; add Turborepo caching when build graph justifies it. |
| Infra | Docker, GitHub Actions, managed services | Fits current deployment skills and keeps operations small. Cloudflare is the confirmed edge/WAF/CDN and object storage provider (R2); choose managed PostgreSQL/Redis first. |
| Web analytics/SEO tracking | Google Analytics 4 tag + Google Search Console site verification | Carries forward CipherPress's current tag-based approach (`GoogleTag.tsx`/GTM) onto the public site; GSC verification plus the existing sitemap satisfies indexing needs. Tag/verification only for now — pulling GSC/GA4 performance data back into the newsroom via their APIs is a later enhancement, not a Phase 1/4 dependency. |

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
