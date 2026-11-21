# Search results page: layout (Codex)

Status: built and committed (158b0aa). Checked in the browser: title, prefilled search row, count, cards, ad band, no-results; "More results" not yet seen (the dev data has fewer than ten matches). Design: [docs/design/search-results.md](../../../design/search-results.md) (decisions settled as recommended; the design owner still approves the layout later). The API is built: `GET /public/search/:locale?q=&limit=&cursor=` returns `{ query, items, nextCursor }`; there is no total count.

## Goal

The search results page at `/search?q=` (and `/en/search?q=`) follows the design proposal: a title with the query, a search row prefilled with the query, a count of the results on this page, one story card per row, a "More results" link for the next page, the trending terms when there are no results, one ad band after the results, and the footer. Ten results per page. No sidebar, no analysis or opinion blocks.

## Workspace

`fact-lens-web` (`apps/web`). Read `apps/web/AGENTS.md` and `apps/web/CLAUDE.md` first. Do not edit `apps/web/docs/design-system/` or any `fact-lens-web` file. Do not edit `docs/`.

## Read first

- `src/app/[lang]/search/page.tsx`: the current page (title, prompt, too-long message, unavailable message, results, trending row, load more). Keep its behaviour; change the layout and the page size.
- `src/lib/api/search.ts`: `searchFromApi` (requests `limit=20` today; change to 10).
- `src/components/header/SearchForm.tsx` and `SearchDialog.tsx`: the field and submit button. Add an optional `initialValue` prop to `SearchForm` (uncontrolled `defaultValue`) so the page's search row is prefilled. Do not change the dialog's behaviour.
- `src/app/[lang]/category/[id]/page.tsx` and `src/components/category/CategoryPageView.tsx`: the page order, `PageTitle`, the ad band component, the `MoreStoriesList` card list, and the `WithRail` / `Shell` / `Wrapper` layout. Reuse these components; do not design new cards.
- `src/i18n/en.ts` and `bn.ts`: the existing `searchPage` strings. Add the new strings (count, the search-row label, "More results", "Showing N results"), with Bangla marked `TODO-REVIEW`.

## Changes

1. **Page size.** `searchFromApi` requests `limit=10`.
2. **Search row.** Render `SearchForm` (size "dialog") above the count, with `initialValue` = the query, inside the page's `Shell`.
3. **Count.** "Showing N results" (en) / "N টি ফলাফল দেখানো হচ্ছে" (bn), where N is the number of items on this page. Hidden for prompts, the too-long message, the unavailable message and the mock preview.
4. **Results.** Use `MoreStoriesList` (StoryCard `thumbnail`, one per row, `Divider.item` between rows) for the items. Keep `titleAs="h2"`.
5. **More results.** When `nextCursor` is set, a link (not a button) to `/search?q=<query>&cursor=<cursor>` with the label "More results" / "আরও ফলাফল". Keep the link inside the page's `Shell`.
6. **No results.** Keep the message and the trending row (only when there are terms).
7. **Ad band.** After the results (and after the "More results" link), the same ad band component the category page uses after its list. Show it only when there are results or a no-results message, not in the prompt, too-long, unavailable or preview states.
8. **Layout order.** Site header, `ad-top` (as the category page), page title, search row, count, results, "More results", the no-results row, ad band, footer. Use the category page's spacing tokens (`space-module`, `space-section`) as it does.

## What NOT to touch

- `apps/api`, `packages/contracts`, the newsroom, the worker.
- `docs/` and `apps/web/docs/design-system/`.
- The dialog's behaviour and styles, and the card component.
- The mock content (`reader-articles.ts`, mock trending terms) except as read.

## Acceptance criteria

- `/en/search?q=India` in API mode shows the title, the search row with "India" in it, "Showing N results", up to 10 story cards one per row, and "More results" when there are more.
- `/search?q=...` (Bangla) works the same, with Bangla strings.
- A query under two characters, or over 200, shows its message with no results list and no ad band.
- No results: the message and, if the editors have terms, the trending row.
- The API being down shows the unavailable message; the header and footer still render.
- Mock mode (no `FACTLENS_API_URL`) shows the preview note with no results list.
- The page is not indexed (unchanged).
- No horizontal scroll at 375 px.
- Existing tests keep passing; update tests that assert the old layout, and say which ones you changed.

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```
