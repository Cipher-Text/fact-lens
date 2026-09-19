# 02 — Product and platform scope

## Definition

FactLens is a digital newsroom platform with three related surfaces:

1. **Public website:** fast, bilingual, SEO-first publishing and discovery.
2. **Newsroom application:** professional editorial workspace for research, writing, review, fact-checking, scheduling and corrections.
3. **Automation platform:** ingestion, media processing, AI proposals, search indexing, distribution and analytics jobs.

The public site is a consumer of approved publication state. It must not become the place where editorial truth is assembled.

## Functional boundaries

### Phase 1 product boundary

- Story creation and revisioned editing.
- English/Bengali translations linked to a story.
- Contributors, desks, categories, tags and basic entities.
- Source and StorySource records with URL and retrieval metadata.
- Editorial assignments, comments, review/approval, correction records and audit events.
- Media assets, variants, rights/attribution metadata.
- Scheduled publishing and public delivery.
- PostgreSQL search and basic newsroom filters.
- OIDC login and capability-based permissions.
- Advertising: Advertiser, Campaign, Placement, Ad and AdEvent records with signed ad-redirect delivery, carried forward from CipherPress's current design. Modeled as a commercial/distribution capability, separate from the editorial Story graph (see [domain model](./05-domain-model.md)).
- Branded photocard/poster generation from a raw photo, using deterministic FactLens template compositing — not generative AI (see [media architecture](./10-media-architecture.md)).
- Per-story performance tracking (first-party view counts, not GA4-derived) powering "most read"/"trending" rankings — ships with Phase 4 public web launch, since it requires the public site to exist (see [target architecture](./03-target-architecture.md)).

### Later product boundary

- Automated RSS/API ingestion (including Telegram channels via Bot API) and source intelligence.
- AI research summaries, extraction, translation, article rewrite drafts and headline/SEO proposals.
- Social/distribution connectors and advanced campaign analytics/optimization.
- Claims/evidence graph, entity resolution, semantic search and advanced newsroom analytics (including pulling GSC/GA4 performance data back into the newsroom via their APIs — GA4 tag and GSC verification themselves are Phase 4 scope).

### Explicit non-goals initially

- Rebuilding Strapi Admin or exposing a generic CRUD console.
- Microservices, Kubernetes, Kafka, Temporal, OpenSearch or ClickHouse before measured need.
- Fully automated publishing by AI.
- Treating external source text as trusted HTML or trusted instructions.

## Success measures

- No loss of live URL coverage or unexplained ranking regressions at cutover.
- Every imported story has traceable source identity, attribution, timestamps and locale mapping.
- Editors can create, revise, submit, approve, schedule, publish and correct without Strapi.
- Public pages remain cacheable and meet defined latency/error budgets.
- Async failures are observable and retryable without duplicate publication or media generation.
