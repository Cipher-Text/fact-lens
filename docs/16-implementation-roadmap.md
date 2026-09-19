# 16 — Implementation roadmap

## Phase 0 — Inventory and migration prototypes

Deliverables: frozen Strapi schema/URL/media inventory; canonical locale policy; domain/event contracts; HTML-to-editor conversion spike; importer dry-run; redirect registry prototype; benchmark baseline.

Exit: representative bilingual stories round-trip, every current route class is accounted for, unresolved product choices are listed, and no write is made to `cipher-press`.

## Phase 1 — Foundation and newsroom shell

Deliverables: monorepo/tooling, NestJS/Fastify API, PostgreSQL migrations, OIDC, capability checks, audit/outbox, Redis/BullMQ skeleton, media abstraction, contracts package, newsroom shell and health/observability baseline.

Exit: authenticated users can create a draft story/revision/translation through the API; tests cover authorization, audit and transaction/outbox behavior.

## Phase 2 — Editorial core

Deliverables: taxonomy/contributors, source records, Tiptap editor, revision timeline, comments/assignments, workflow transitions, corrections, media library, scheduling primitives. In parallel, build the advertising module (Advertiser/Campaign/Placement/Ad/AdEvent tables, targeting rules, admin screens) as a separate commercial domain module — it does not block or extend the editorial workflow.

Exit: a human can draft, review, fact-check, approve, schedule, publish and correct a bilingual story with complete audit history; campaigns/placements can be created and targeted in the newsroom.

## Phase 3 — Migration tooling and rehearsal

Deliverables: deterministic Strapi exporter/reader, media copier, relation/localization validator, HTML parser, counts/checksums, URL/redirect registry, dual-read comparator and delta import.

Exit: staging import passes data/SEO/media/relation checks for a full source snapshot and a repeatable delta rehearsal.

## Phase 4 — Public web and cutover

Deliverables: Next.js public site, article/category/tag/search routes, SEO/schema/sitemap/robots, cache tags, analytics consent, legacy redirects, performance tests, Cloudflare/CDN configuration, and ad serving/signed-redirect endpoints with strict target-URL validation.

Exit: URL coverage and representative page parity are signed off; rollback switch and monitoring are tested; ad delivery and redirect abuse controls are verified; only then cut over public traffic.

## Phase 5 — Ingestion and AI assistance

Deliverables: RSS/API connectors, source inbox, normalization/dedupe, AI Gateway, proposals, provenance/cost controls and worker dashboards.

Exit: ingestion is rate-limited/idempotent, AI cannot publish silently, failures are retryable/visible, and editors accept/reject proposals in the newsroom.

## Phase 6 — Distribution and analytics

Deliverables: social-card generation, distribution jobs/connectors, publication analytics, advanced campaign analytics/optimization and operational dashboards.

Exit: distribution retries are idempotent and attribution/consent boundaries are documented.

## Phase 7 — Advanced discovery

Deliverables: entity resolution, claims/evidence, richer source intelligence, autocomplete/faceting, and possibly OpenSearch/semantic search.

Exit: measured product need and operational evidence justify each added subsystem independently.

## Dependency order

Foundation → editorial core → migration rehearsal → public cutover. Ingestion/AI must depend on source/revision/audit contracts. Distribution depends on publication events and media variants. Advanced search depends on stable identifiers and rebuildable projections.
