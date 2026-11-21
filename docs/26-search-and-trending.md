# 26 — Public search and trending search terms

**Status: APPROVED on 17 November 2026 (decisions in [19](./19-open-questions.md), questions 22 to 28). Step 1 is built: the index, worker job, reindex command and `GET /public/search/:locale` (ADR-044). Step 2 is built: editorial trending terms in the API and newsroom configuration screen (ADR-045). Step 3 is built: the results page at `/search` and the dialog link to it. The layout follows [design/search-results.md](./design/search-results.md); design approval remains open.** ADR-034 specified this work; ADR-044 amends its search-index ownership and matching details. See [09](./09-search-and-discovery.md) for the PostgreSQL-first plan.

## 1. What the public site has

From the site's own design (`apps/web`, `component-system.md` C-19 and C-20):

- **The search dialog.** A search button in the top bar from 768 px opens a panel from the top; below 768 px the same field is in the menu drawer. It has a field with a submit button and a clear button, and in the dialog (not the drawer) a **Trending** row.
- **Trending terms.** Up to 6 terms in one wrapping row; each is a link that **runs a search** for that term. The source is not decided in the spec: "editorial or analytics, later" (DR-190 to DR-192). The mockup uses a fixed list per language.
- The search dialog opens the built `/search` results page. The design system has not yet approved the page layout; implementation follows [design/search-results.md](./design/search-results.md).

## 2. What the backend has today

The public search index and API endpoint are built (ADR-044): the worker's `search.index` job and outbox events drive the index ([09](./09-search-and-discovery.md)). The newsroom cannot search news text; it can manage editorial trending terms (ADR-045). Public search enforces the `rate_limit.search` setting.

## 3. Search (built)

`GET /public/search/:locale?q=&category=&region=&format=&limit=&cursor=`

- **Scope.** Published news only, in the page's language only (languages are never mixed, [ADR-020](./17-architecture-decisions.md)), the same filters as the other public lists. Opinion pieces are excluded unless the `format` filter explicitly asks for opinion ([ADR-044](./17-architecture-decisions.md)).
- **Result.** The same list items as the public lists (id, short id, slug, title, standfirst, format, date, section, lead image), so the site's cards work unchanged, in a stable order with a cursor.
- **Ranking.** The API scores text rank, adds half the title similarity and a recency boost of up to 0.2 that halves every 30 days. The title is weighted above the body. See ADR-044.
- **Query handling.** The text is trimmed and limited to 200 characters. A query under two characters returns no items; one over 200 characters is refused with `400`. The query is handled as plain text, not SQL or a tsquery operator.
- **Limits.** Public, read only, rate limited by `rate_limit.search` per client address, and cached briefly per query. A malformed request is `400`.

## 4. How it is indexed (built)

- The API keeps one `news_search` document per live item and language. The worker sends `search.index` updates to `POST /internal/search/:id`; the API owns the SQL. The index is rebuildable, and `pnpm --filter @fact-lens/api search:reindex` is safe to run repeatedly (ADR-044).
- **English:** PostgreSQL full-text search with the `english` configuration; other languages use `simple`.
- **Typo matching:** the title has a trigram index. A title or body text match counts, as does a title similarity of at least 0.4. The API weights the title above the body.
- **Only live news is searchable:** unpublishing or archiving removes the row from the results.
- **When PostgreSQL stops being enough** (autocomplete latency, faceting, semantic search, corpus growth), OpenSearch takes over as a projection of the same documents, behind the same endpoint ([09](./09-search-and-discovery.md)). The documents and IDs stay in PostgreSQL.

## 5. Trending search terms

Two sources, in this order of priority:

1. **Editorial list (first version).** An editor keeps a short list per language in the newsroom: up to 6 terms, in an order, each at most 60 characters. Stored as `trending_term(locale, position, term)`, changed in one save (the whole list replaced, audited, needs `config.manage` or a new capability if wanted). Predictable, safe, and does not depend on traffic.
2. **Computed from searches (later).** Count each normalised query once per session in hourly counters (the same pattern as views, [25](./25-most-read-and-performance.md)) and rank the last 24 hours, with rules so one person cannot make a term trend: a **minimum number of distinct sessions**, a minimum length, a blocklist and a profanity and personal-data filter, and an editor's veto. The editorial terms stay pinned first; computed terms fill the rest.

`GET /public/trending-searches/:locale` returns `{ terms: ["…"] }`, at most 6, in order, cached briefly. An empty list hides the row (the site's design already allows an empty row).

**Why editorial first.** Raw queries can contain personal or offensive text; a new site has too little traffic for a computed list to be meaningful; and the design assumes a short curated row. The editorial list is built; computed trending terms are not.

## 6. Privacy

- Search queries are **not stored** with a session, address or any identifier. The counters for computed trending (when built) hold only the normalised term and a count, and the sessions that make a term count are hashed and expire with their keys.
- A query that looks like personal data (an email address, a phone number, a long digit string) is not counted.
- Whether queries are kept at all for search quality (for example "searches with no results") is open (question 28).

## 7. Build order

1. The search column, the worker projection and the reindex command, then `GET /public/search/:locale`, tested with fixtures in English and Bangla (word matching, typos, language isolation, only live news, filters, cursor, rate limit, empty and over-long queries).
2. The editorial trending list: table, newsroom screen, `GET /public/trending-searches/:locale`.
3. The site: a search results page (its own design), the dialog calling both endpoints. Built: the page follows the proposal in docs/design/search-results.md (the layout is approved by the design owner later); the dialog calls the search and trending endpoints.
4. Later: computed trending terms, and search statistics for administrators (queries with no results, top queries) once question 28 is answered.

## 8. Open questions

These are numbers 26 to 28 in [19](./19-open-questions.md):

- **26.** Trending from the editorial list first, with computed terms later, as proposed?
- **27.** Bangla matching: is `simple` plus trigram on titles enough for the first version, or must stemming or a Bangla-specific dictionary be in place before launch?
- **28.** May search queries be kept (anonymously, as counts) to improve search and to compute trending, and for how long?
