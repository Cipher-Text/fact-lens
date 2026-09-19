# 09 — Search and discovery

## Phase 1: PostgreSQL

Index published title, excerpt/body text, locale, workflow/publication state, category, tags and timestamps. Use PostgreSQL full-text search for ranked lexical search and `pg_trgm` for typo-tolerant title/slug matching. Keep newsroom draft search permission-filtered; public search sees only published content.

The current `cipher-press/apps/web/src/lib/strapi.ts` search uses case-insensitive title/excerpt filters. Migration should preserve basic behavior while improving ranking, pagination and locale handling.

## Indexing architecture

Publication and story update transactions emit `StoryPublished`, `StoryUpdated` or `StoryCorrected`. A worker updates derived search columns/materialized data after commit. Search lag is observable and rebuildable from PostgreSQL. A reindex command must be safe to run repeatedly.

## OpenSearch later

Introduce OpenSearch only when at least one is measured: complex faceting, autocomplete at unacceptable PostgreSQL latency, semantic/hybrid search, corpus/traffic growth that strains DB, or operational need for independent search scaling. Keep IDs and source documents in PostgreSQL; index documents are projections with version/checksum and lag metrics.

## Discovery

Start related stories with shared category/tag/entity/source signals plus recency. Later add entity co-occurrence, claim/evidence links and embeddings behind explicit editorial/privacy policy. Do not let similarity ranking imply factual equivalence.

First-party story-view counts (see [target architecture](./03-target-architecture.md)) can also power "most read"/trending discovery surfaces once available in Phase 4. Treat popularity as a distinct, clearly labeled signal from editorial curation — do not let it silently override desk-selected placement.
