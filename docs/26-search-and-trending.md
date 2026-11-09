# 26 — Public search and trending search terms

**Status: PROPOSED. Not approved, not built.** This records the concept for the public site's search and its "Trending" row, and the decision to write it down first ([ADR-034](./17-architecture-decisions.md)). It builds on the plan in [09](./09-search-and-discovery.md) (PostgreSQL first, OpenSearch later). Nothing here is in the database, the API, the worker or the newsroom yet.

## 1. What the public site has

From the site's own design (`apps/web`, `component-system.md` C-19 and C-20):

- **The search dialog.** A search button in the top bar from 768 px opens a panel from the top; below 768 px the same field is in the menu drawer. It has a field with a submit button and a clear button, and in the dialog (not the drawer) a **Trending** row.
- **Trending terms.** Up to 6 terms in one wrapping row; each is a link that **runs a search** for that term. The source is not decided in the spec: "editorial or analytics, later" (DR-190 to DR-192). The mockup uses a fixed list per language.
- **Search itself is a mock.** Submitting shows a note instead of results. There is **no search results page**, no `/search` path in the URL spec and no search result card. Those need their own design and are not part of this document's build.

## 2. What the backend has today

Nothing for the public site. The worker's `search.index` job logs and succeeds, and the outbox already sends it an event for each published or archived news item, so a projection can be added without changing the API ([09](./09-search-and-discovery.md)). The newsroom cannot search news text either. The rate-limit setting `rate_limit.search` exists in the configuration and is not used.

## 3. Search (proposed)

`GET /public/search/:locale?q=&category=&region=&format=&limit=&cursor=`

- **Scope.** Published news only, in the page's language only (languages are never mixed, [ADR-020](./17-architecture-decisions.md)), the same filters as the other public lists.
- **Result.** The same list items as the public lists (id, short id, slug, title, standfirst, format, date, section, lead image), so the site's cards work unchanged, in a stable order with a cursor.
- **Ranking.** Text relevance first, with a recency boost so a new article beats an equal old one; a title match counts more than a body match. Ties go to the newest.
- **Query handling.** The text is trimmed and limited in length (for example 200 characters); an empty or one-character query returns no results (`200` with an empty list, not an error); the query is never used as SQL or as a tsquery operator, only as plain words.
- **Limits.** Public, read only, rate limited by `rate_limit.search` per client address (hashed, as the poll and the view beacon do), cached briefly per query. A malformed request is `400`.

## 4. How it is indexed (proposed)

- **A search column per translation of the published revision** (title, standfirst, body text), kept by the worker from the `search.index` event after the commit that published or changed the news item. It is rebuildable from the stored text, and a **reindex command** is safe to run repeatedly. The lag is a metric.
- **English:** PostgreSQL full-text search with the `english` configuration.
- **Bangla:** PostgreSQL has no Bangla stemmer. Use the `simple` configuration (no stemming) for matching words, plus **trigram** matching (`pg_trgm`) on the title for typos and partial words. Word splitting for Bangla must follow the same rules as the reading-time count ([24](./24-reading-time.md)): by word with `Intl.Segmenter`, not by spaces, so the text is split before it is indexed.
- **Other languages** (the `locale` rows are data, [ADR-020](./17-architecture-decisions.md)) use `simple` until a better configuration is chosen for them.
- **Only live news is searchable:** unpublishing or archiving removes the row from the results.
- **When PostgreSQL stops being enough** (autocomplete latency, faceting, semantic search, corpus growth), OpenSearch takes over as a projection of the same documents, behind the same endpoint ([09](./09-search-and-discovery.md)). The documents and IDs stay in PostgreSQL.

## 5. Trending search terms (proposed)

Two sources, in this order of priority:

1. **Editorial list (first version).** An editor keeps a short list per language in the newsroom: up to 6 terms, in an order, each at most 60 characters. Stored as `trending_term(locale, position, term)`, changed in one save (the whole list replaced, audited, needs `config.manage` or a new capability if wanted). Predictable, safe, and does not depend on traffic.
2. **Computed from searches (later).** Count each normalised query once per session in hourly counters (the same pattern as views, [25](./25-most-read-and-performance.md)) and rank the last 24 hours, with rules so one person cannot make a term trend: a **minimum number of distinct sessions**, a minimum length, a blocklist and a profanity and personal-data filter, and an editor's veto. The editorial terms stay pinned first; computed terms fill the rest.

`GET /public/trending-searches/:locale` returns `{ terms: ["…"] }`, at most 6, in order, cached briefly. An empty list hides the row (the site's design already allows an empty row).

**Why editorial first.** Raw queries can contain personal or offensive text; a new site has too little traffic for a computed list to be meaningful; and the mockup already assumes a short curated row.

## 6. Privacy

- Search queries are **not stored** with a session, address or any identifier. The counters for computed trending (when built) hold only the normalised term and a count, and the sessions that make a term count are hashed and expire with their keys.
- A query that looks like personal data (an email address, a phone number, a long digit string) is not counted.
- Whether queries are kept at all for search quality (for example "searches with no results") is open (question 28).

## 7. Build order

1. The search column, the worker projection and the reindex command, then `GET /public/search/:locale`, tested with fixtures in English and Bangla (word matching, typos, language isolation, only live news, filters, cursor, rate limit, empty and over-long queries).
2. The editorial trending list: table, newsroom screen, `GET /public/trending-searches/:locale`.
3. The site: a search results page (its own design), the dialog calling both endpoints.
4. Later: computed trending terms, and search statistics for administrators (queries with no results, top queries) once question 28 is answered.

## 8. Open questions

These are numbers 26 to 28 in [19](./19-open-questions.md):

- **26.** Trending from the editorial list first, with computed terms later, as proposed?
- **27.** Bangla matching: is `simple` plus trigram on titles enough for the first version, or must stemming or a Bangla-specific dictionary be in place before launch?
- **28.** May search queries be kept (anonymously, as counts) to improve search and to compute trending, and for how long?
