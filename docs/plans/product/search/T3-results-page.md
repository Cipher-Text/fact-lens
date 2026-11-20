# Search results page and dialog (Codex)

Status: built and checked on 20 November 2026 (the lead checked the page in English and Bangla, at desktop and phone width). Parent: [doc 26, section 7, step 3](../../../26-search-and-trending.md). The API is built: `GET /public/search/:locale?q=&category=&region=&format=&limit=&cursor=` (ADR-044) and `GET /public/trending-searches/:locale` (ADR-045). The design has no results page yet (component-system.md notes it as later); the approach below was chosen by the lead: reuse the category layout.

## Goal

Submitting the search dialog opens a results page at `/search?q=...` (localised like the other pages: `/search` in Bangla at the root, `/en/search` in English). In API mode the page shows the published items the API finds, in the same story-card list a category page uses. The dialog shows the trending terms from the API, and a trending term runs a search. In mock mode nothing changes except the dialog now opens the results page, which says search is not available in this preview.

## Workspace

`fact-lens-web` (filter name `fact-lens-web`), i.e. `apps/web`. Read `apps/web/AGENTS.md` and `apps/web/CLAUDE.md` first: design-system rule IDs apply to all `apps/web` work. Do not edit `apps/web/docs/design-system/` or anything under `fact-lens-web`.

## Read first

- `src/components/header/SearchDialog.tsx` (C-20) and `src/components/header/SearchForm.tsx` (C-19): the dialog and form. The form currently sets a note on submit (mock). Keep its markup and classes; change only what submit does and how the trending terms are supplied.
- `src/components/header/SiteHeader.tsx`: passes `trendingTerms={getTrendingTerms(lang)}` (mock content). In API mode the terms come from the API.
- `src/app/[lang]/category/[id]/page.tsx` and `src/components/category/CategoryPageView.tsx`: the page and the card list to reuse. Use the same list markup and card component; do not design a new card.
- `src/lib/api/client.ts` (`apiBase`, `apiGet`, `apiLocale`, `ApiNotFound`, `ApiUnavailable`), `src/lib/api/adapters.ts` (`storyFromListItem`), `src/lib/api/pages.ts` (how a category page reads the API).
- `src/i18n/` (`en.ts`, `bn.ts`): the header and page strings. Bangla copy you add is marked `TODO-REVIEW`, like the existing unavailable text.
- Contracts: `publicSearchSchema`, `publicSearchQuerySchema`, `publicTrendingSchema`, `SEARCH_MAX_QUERY` (200) in `@fact-lens/contracts`.

## Files

Create:
- `src/lib/api/search.ts`:
  - `export async function searchFromApi(query: string, lang: Lang, cursor?: string): Promise<{ query: string; stories: Story[]; nextCursor: string | null }>`: calls `apiGet` on `/public/search/${apiLocale(lang)}?q=...&limit=20` (plus `cursor` when given), validates with `publicSearchSchema`, maps items with `storyFromListItem` (drop nulls).
  - `export async function trendingFromApi(lang: Lang): Promise<string[]>`: `/public/trending-searches/${apiLocale(lang)}`, schema `publicTrendingSchema`; `[]` on `ApiNotFound` or `ApiUnavailable` (the dialog must still open).
- `src/lib/api/search.test.ts`: stubbed `fetch` tests: the URL (encoded query, locale `bn-BD` for `bn`, cursor), mapping, `[]` on 404, `[]` on 503 for trending, and a malformed body.
- `src/app/[lang]/search/page.tsx`: the results page.
  - `searchParams` gives `q` (and `cursor`). Trim `q`.
  - Empty `q`, or one character: show the prompt line, no request.
  - Over 200 characters: show a message, no request.
  - API mode: call `searchFromApi`. Show the heading "Results for "<q>"" (the query is rendered as text, never as HTML), the count of results on this page, the card list (as the category page does), and a "Load more" link with `?q=...&cursor=...` when `nextCursor` is set. No results: a line saying nothing matched, plus the trending terms as links.
  - Mock mode (no `FACTLENS_API_URL`): the heading and a note that search is not available in this preview. No results list.
  - `robots: { index: false, follow: true }` in `generateMetadata`, and a title from the strings.
  - Use `localizedPath(lang, '/search')` for links.
- `src/components/search/SearchResults.tsx` (if the page gets large): the list and the empty and load-more parts. Reuse the category list markup.

Edit:
- `src/components/header/SearchForm.tsx`: on submit, navigate to the results page with the trimmed `q` (a plain link to `localizedPath(lang, "/search")` + `?q=`, or `router.push`; the form needs the language, so pass it in from `SearchDialog`). Keep the field, the clear button, and the focus behaviour exactly as they are. Trending term links go to the same page.
- `src/components/header/SearchDialog.tsx`: accept `lang` and the trending terms as props.
- `src/components/header/SiteHeader.tsx`: in API mode fetch the trending terms with `trendingFromApi(lang)` (it is a server component or wraps one; keep the mock path as it is).
- `src/i18n/en.ts` and `src/i18n/bn.ts`: the new strings (page title, results heading, count, nothing found, prompt for a short query, too-long query, load more, the mock note). Bangla marked `TODO-REVIEW`.
- Existing browser or unit tests that assert the mock note after a submit: update them to the new behaviour, and say which ones you changed. Do not delete tests to make the suite pass.

## Interfaces

- `GET /public/search/:locale?q=&limit=&cursor=` returns `{ query, items, nextCursor }`.
- `GET /public/trending-searches/:locale` returns `{ terms }`.
- Site language `bn` maps to API locale `bn-BD` through `apiLocale` (already in `src/lib/api/client.ts`). Never send `bn` to the API.

## What NOT to touch

- `apps/api`, `packages/contracts`, `apps/newsroom`, `apps/worker`.
- `apps/web/docs/design-system/` and any `fact-lens-web` source.
- The card component and the category page layout (reuse, do not change).
- `docs/` (the lead updates the docs).

## Acceptance criteria

- In API mode, a search for an English word shows English results in the category card layout; a Bangla search on `/search` shows Bangla results only.
- A query under two characters shows the prompt and makes no request. A query over 200 characters shows the message and makes no request.
- The query is shown as text (a query containing `<script>` renders as text).
- "Load more" follows `nextCursor` and keeps the query.
- No results: the page says so and shows the trending terms as links. Empty trending terms hide that row.
- If the search or trending call fails (API down), the page still renders with a plain message; the header and dialog still open.
- The results page is not indexed (`robots` noindex).
- Mock mode: the dialog opens the results page with the preview note; no API call is made.
- Keyboard: the dialog still closes with Escape, and focus returns to the search button (unchanged behaviour).

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```
