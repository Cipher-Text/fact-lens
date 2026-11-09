# 09 — Search and discovery

## Phase 1: PostgreSQL

Index published title, excerpt/body text, locale, workflow/publication state, category, tags and timestamps. Use PostgreSQL full-text search for ranked lexical search and `pg_trgm` for typo-tolerant title/slug matching. Keep newsroom draft search permission-filtered; public search sees only published content.

The current `cipher-press/apps/web/src/lib/strapi.ts` search uses case-insensitive title/excerpt filters. Migration should preserve basic behavior while improving ranking, pagination and locale handling.

## Indexing architecture

Publication and news item update transactions emit `NewsPublished`, `NewsUpdated` or `NewsCorrected`. A worker updates derived search columns/materialized data after commit. Search lag is observable and rebuildable from PostgreSQL. A reindex command must be safe to run repeatedly.

## OpenSearch later

Introduce OpenSearch only when at least one is measured: complex faceting, autocomplete at unacceptable PostgreSQL latency, semantic/hybrid search, corpus/traffic growth that strains DB, or operational need for independent search scaling. Keep IDs and source documents in PostgreSQL; index documents are projections with version/checksum and lag metrics.

## Discovery

Start related news items with shared category/tag/entity/source signals plus recency. Later add entity co-occurrence, claim/evidence links and embeddings behind explicit editorial/privacy policy. Do not let similarity ranking imply factual equivalence.

First-party news view counts (see [target architecture](./03-target-architecture.md)) can also power "most read"/trending discovery surfaces once available in Phase 4. Treat popularity as a distinct, clearly labeled signal from editorial curation — do not let it silently override desk-selected placement.

## Status

Not built. The worker has a `search.index` job that logs and succeeds, and the outbox already sends it a publish or archive event for each news item, so the projection can be added without changing the API. The newsroom list can filter by status only; there is no text search over news items. Media library search is a simple case-insensitive match on file name, alt text, credit and rights owner. See [implementation status](./22-implementation-status.md).

The public search endpoint, the indexing of the published text per language (including Bangla), and the trending search terms behind the site's search dialog are specified in [26](./26-search-and-trending.md) (not built).
