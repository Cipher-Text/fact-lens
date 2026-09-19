# 03 — Target architecture

## Recommendation

Use a TypeScript monorepo with two Next.js applications, one NestJS/Fastify API, and one worker process. Keep domain modules in a modular monolith and use PostgreSQL as the authoritative store. Redis/BullMQ handles work that should not block HTTP requests. The public web reads a publication-oriented API, not the newsroom database directly.

```mermaid
flowchart LR
  CDN[Cloudflare CDN/WAF] --> WEB[Next.js public web]
  Editors[Editors] --> NEWS[Next.js newsroom]
  WEB --> API[NestJS API / Fastify]
  NEWS --> API
  API --> DB[(PostgreSQL source of truth)]
  API --> REDIS[(Redis)]
  API --> OBJ[(R2/S3 object storage)]
  API --> OUTBOX[Transactional outbox]
  OUTBOX --> WORKER[BullMQ worker]
  WORKER --> REDIS
  WORKER --> OBJ
  WORKER --> AI[AI Gateway]
  WORKER --> IDX[PostgreSQL search index initially]
  IDX -. later .-> OS[OpenSearch]
  API --> OIDC[OIDC provider]
```

## Component responsibilities

| Component | Responsibility | Boundary |
|---|---|---|
| Public web | Render approved stories, listing pages, metadata, sitemap, redirects and cache tags | No editorial writes; safe public API only |
| Newsroom | Editor, source inbox, assignments, review, media and analytics screens | OIDC session; writes through API |
| API | Domain commands/queries, authz, REST contracts, transactions, outbox records | Stateless; no direct UI-specific database coupling |
| Worker | Ingestion, media variants, search indexing, AI proposals, notifications, distribution | Idempotent jobs with retry/backoff |
| PostgreSQL | Stories, revisions, translations, taxonomy, sources, media metadata, workflow, audit, outbox | Source of truth |
| Redis | Queue state, short-lived cache, rate-limit counters, locks where needed | Rebuildable/ephemeral |
| Object storage | Originals and derived media | Immutable-ish objects plus DB metadata |

## Sync versus async

Synchronous request: validate command, authorize, write domain state and outbox event in one PostgreSQL transaction, return a durable identifier.

Asynchronous job: consume outbox event, perform external/API/media/search work, record attempts and result, emit a follow-up event. Public cache invalidation should happen after a committed publication event, not before.

```mermaid
sequenceDiagram
  participant E as Newsroom
  participant A as API
  participant P as PostgreSQL
  participant W as Worker
  participant C as CDN/public web
  E->>A: Publish story command
  A->>P: Transaction: state + audit + outbox
  P-->>A: Commit
  A-->>E: Published revision id
  W->>P: Claim StoryPublished outbox row
  W->>C: Invalidate story/listing cache tags
  W->>P: Mark outbox delivered / record failure
```

## Why modular monolith first

Editorial transactions are tightly coupled: a publish command touches revision state, translation readiness, audit, schedule, URL, search/indexing intent and cache invalidation. A modular monolith keeps these invariants transactional and deployable as one unit while giving each domain explicit ownership. Split a module only when independent scaling, security isolation, release cadence or failure containment is demonstrated.

## Availability and scaling posture

Run multiple stateless API replicas behind a managed load balancer when traffic justifies it. Use PostgreSQL connection pooling, indexes on publication state/locale/slug/time, CDN caching for public reads, Redis for short-lived coordination, and independently scalable workers. Add read replicas only after measured read pressure. Queue backpressure and idempotency are more valuable than adding infrastructure early.
