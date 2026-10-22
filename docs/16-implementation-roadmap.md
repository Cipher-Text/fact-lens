# 16 — Implementation roadmap

## Phase 0 — Inventory and migration prototypes

**Status:** not started.

Deliverables: frozen Strapi schema/URL/media inventory; canonical locale policy; domain/event contracts; HTML-to-editor conversion spike; importer dry-run; redirect registry prototype; benchmark baseline.

Exit: representative bilingual news items round-trip, every current route class is accounted for, unresolved product choices are listed, and no write is made to `cipher-press`.

## Phase 1 — Foundation and newsroom shell

**Status:** mostly done. Missing: OpenAPI generation, Docker images and a deployment skeleton, tracing, metrics and Sentry, and a real identity provider (only the fake one has been used).

Deliverables: monorepo/tooling, NestJS/Fastify API, PostgreSQL migrations, OIDC, capability checks, audit/outbox, Redis/BullMQ skeleton, media abstraction, contracts package, newsroom shell and health/observability baseline.

Exit: authenticated users can create a draft news item/revision/translation through the API; tests cover authorization, audit and transaction/outbox behavior.

## Phase 2 — Editorial core

**Status:** largely done: taxonomy tables and contributors, source records, the Tiptap editor, timeline, comments, assignments, workflow, corrections, scheduling with a publishing worker, and the media library. Missing: branded card generation, taxonomy and assignment screens, and the advertising module beyond its tables.

Deliverables: taxonomy/contributors, source records, Tiptap editor, revision timeline, comments/assignments, workflow transitions, corrections, media library, scheduling primitives, and branded photocard/poster generation (CardTemplate/GeneratedCard, deterministic template compositing). In parallel, build the advertising module (Advertiser/Campaign/Placement/Ad/AdEvent tables, targeting rules, admin screens) as a separate commercial domain module — it does not block or extend the editorial workflow.

Exit: a human can draft, review, fact-check, approve, schedule, publish and correct a bilingual news item with complete audit history; campaigns/placements can be created and targeted in the newsroom; an editor can generate a branded photocard/poster from a photo.

## Phase 3 — Migration tooling and rehearsal

**Status:** not started.

Deliverables: deterministic Strapi exporter/reader, media copier, relation/localization validator, HTML parser, counts/checksums, URL/redirect registry, dual-read comparator and delta import.

Exit: staging import passes data/SEO/media/relation checks for a full source snapshot and a repeatable delta rehearsal.

## Phase 4 — Public web and cutover

**Status:** early. The design exists in `apps/web` on mock data; the API serves a published news item by locale and slug and its derivatives. Everything else in this phase is not built.

Deliverables: Next.js public site (starts from `apps/web`, imported from `fact-lens-web`: homepage, design system and i18n already built on mock data; this phase adds article/category/tag/search routes and replaces mock content with the API), article/category/tag/search routes, SEO/schema/sitemap/robots, cache tags, GA4 tag and GSC site verification with analytics consent, legacy redirects, performance tests, Cloudflare/CDN configuration, ad serving/signed-redirect endpoints with strict target-URL validation, first-party news item-view tracking (beacon endpoint, Redis trending counters, `NewsPerformanceDaily` rollup) powering "most read"/trending surfaces, and newsletter subscription capture (double opt-in, unsubscribe, `newsletter.dispatch` job).

Exit: URL coverage and representative page parity are signed off; rollback switch and monitoring are tested; ad delivery and redirect abuse controls are verified; news item-view tracking is abuse-resistant and rollups are accurate; only then cut over public traffic.

## Phase 5 — Ingestion and AI assistance

**Status:** not started. Flags, AI configuration rows and job stubs are in place.

Deliverables: RSS/API connectors (including a Telegram channel connector via Bot API), source inbox, normalization/dedupe, AI Gateway, proposals, provenance/cost controls and worker dashboards.

Exit: ingestion is rate-limited/idempotent, AI cannot publish silently, failures are retryable/visible, and editors accept/reject proposals in the newsroom.

## Phase 6 — Distribution and analytics

**Status:** not started.

Deliverables: automated distribution of already-generated photocards/posters to social channels, distribution jobs/connectors, publication analytics, advanced campaign analytics/optimization and operational dashboards. Facebook Page connector: a `distribution.social_post` job publishes already-generated photocards/posters to FactLens's own Facebook Page via the Graph API using a Business Manager System User access token (managed secret, not env-committed, per [configuration and feature flags](./21-configuration-and-feature-flags.md)); a companion `analytics.facebook_sync` job pulls Page- and post-level Insights (reach, reactions, clicks) back for posts FactLens published, checkpointed by post ID/since-timestamp, and rolls them up against the originating News item/GeneratedCard alongside `NewsPerformanceDaily`.

Exit: distribution retries are idempotent and attribution/consent boundaries are documented; Facebook Insights rollups are linked to their originating News item and gated by the same retention/consent policy as other performance data (open question 9 in [open questions](./19-open-questions.md)).

## Phase 7 — Advanced discovery

**Status:** not started.

Deliverables: entity resolution, claims/evidence, richer source intelligence, autocomplete/faceting, and possibly OpenSearch/semantic search.

Exit: measured product need and operational evidence justify each added subsystem independently.

## Dependency order

Foundation → editorial core → migration rehearsal → public cutover. Ingestion/AI must depend on source/revision/audit contracts. Distribution depends on publication events and media variants. Advanced search depends on stable identifiers and rebuildable projections.
