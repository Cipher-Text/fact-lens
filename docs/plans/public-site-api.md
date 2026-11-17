# Plan: wire the public site to the API (Phase 4, step 2)

Status: **done**. The unavailable page answers 503 (open question 30, resolved). The ads stay mock content. T1 to T7 are merged; the lead image change came in with T4 (`9aa7ae1`).

## Goal

The article, category, tag, analysis and region pages of `apps/web` read published news from the API, not from `src/content/*.ts`. The API stays the only source of what readers see (ADR-039, `AGENTS.md`).

## Current state (checked in the code)

- `apps/web` reads content only through `src/content/index.ts`, which says a backend can replace the data behind it without changing components. That seam is the place to wire.
- `apps/web` has no dependency on `@fact-lens/contracts`. Its API helpers (`src/lib/navigation.ts`, `src/lib/poll-api.ts`) use hand-written types, so drift is not caught automatically.
- The site already calls the API for the header menu, social links and the daily poll, and falls back to static content when `FACTLENS_API_URL` is unset or the call fails.
- The API already has what the pages need: `GET /public/news/:locale` (filters: category, tag, region, format; cursor paging; list items with lead image), `GET /public/news/:locale/:ref` (full item: body, media, contributors, corrections, alternates, categories, regions, tags), `GET /public/navigation/:locale`, `GET /public/regions/:locale`, `GET /public/most-read/:locale`, and `GET /public/media/:id/:variant`.
- The mock `Story` type uses closed unions for categories and regions. The API's categories and regions are data. The five seeded menu sections (geopolitics, economy, security, technology, history) have the same keys the site uses, so the mapping is direct.
- Gaps: no homepage composition endpoint; the article body is a Tiptap document, while the site renders its own `Block` type; the site shows images from its own origin, while media is served by the API.

## Decisions (recommended, to approve)

1. **Shared types.** Add `@fact-lens/contracts` to `apps/web` and parse API responses with its schemas. Hand-written types are removed as each call moves. Contract tests then catch drift.
2. **Homepage.** Derive it from existing lists first: the lead and top stories from the newest items, the latest rail from the list, and each section from its category list. No new endpoint now. A composition endpoint waits until editors need hand-picked homepage layouts.
3. **API unavailable.** When `FACTLENS_API_URL` is set and a page's data call fails, show an error page with status 503, not mock content. When it is unset (development and previews), keep the mock content, so the existing suite still runs. Header and poll already fall back quietly; they keep that behaviour.
4. **Images.** Serve media through the site's own origin with a Next rewrite to `/public/media/:id/:variant`, so the site never depends on a second origin.
5. **Article body.** Map Tiptap nodes to the site's `Block` types. Unknown nodes become plain paragraphs and are logged, never dropped silently.
6. **Tests.** The existing Playwright suite runs in mock mode (`FACTLENS_API_URL` unset), as now. A small API-mode smoke test runs against a seeded local API.

Out of scope for this plan (later steps): reading time, Read next, search, the view beacon, sitemap and redirects, newsletter, GA4 and ads. Ads stay mock.

## Tasks

| ID | Task | Owner | Status |
| --- | --- | --- | --- |
| T1 | Add `@fact-lens/contracts` to `apps/web`; one API client with a timeout and schema parsing; error type for "API unavailable" | Codex | done (9ef0e8d) |
| T2 | Adapters: API list and item to the site's `Story`, with mapping tests (contract fixtures) | Codex | done (b80da5b) |
| T3 | Category, tag and analysis pages from the list endpoint with filters | Codex | done (7ae6c43) |
| T4 | Article page from `GET /public/news/:locale/:ref`: body mapping, contributors, corrections, alternates, 404 for unknown items | Codex | done (65e0c89) |
| T5 | Homepage and region pages derived from lists (decision 2) | Codex | done (ec4b94c) |
| T6 | Same-origin media rewrite and image mapping (decision 4) | Codex | done (0c69bfe) |
| T7 | Unavailable-API behaviour (decision 3); mock-mode e2e stays green; API-mode smoke test | Codex, then Claude reviews | done (e2e34ee) |
| T8 | 503 when the API is down: cached readiness check in the middleware (decision 3, open question 30) | Codex | done (7bbe77e); checked by hand |

Each task is small and ships on its own. T2 comes first, because T3 to T5 depend on it. T6 can run alongside T3 to T5.

## Verification

- Each task: `pnpm --filter fact-lens-web typecheck`, `lint`, `test` (and `build` for T1, T6, T7).
- T4 and T7: the mapping and the 503 path are reviewed by Claude against the API contract before merge.
- Before merge of T7: `pnpm check` at the root, with the test variables set.
- After T7: Claude checks an article, a category and the homepage by hand with `./run.sh` against the seeded API.

## Risks

- A body node the mapping does not know will look wrong on the page. Logging unknown nodes makes that visible.
- Derived homepage layouts will look different from the mock until editors can pick stories. Decision 2 accepts that for now.
- The mock content is used in the existing e2e tests, so the mock path must stay working until the suite is rewritten.
