# Search results page: design proposal

Status: **decisions taken for now (21 November 2026) so the page can be built; the design owner still approves the layout.** The six open decisions below are settled as recommended. Earlier wording of the status: The design-system rules (apps/web/docs/design-system) say the results page is "IA-10, later" and have no layout for it. This proposal fills that gap by following the category page (spacing-layout-system.md, 7B) and the search dialog (component-system.md, C-20). Once approved, the design owner adds it to the design system (apps/web/docs/design-system is not changed from this repo). Until then the build uses this proposal.

## Purpose

A reader who searched, from the dialog or the trending row, sees the matching published stories, can refine the search, and is not left at a dead end when nothing matches.

## URL

`/search?q=<text>` in Bangla (at the root) and `/en/search?q=<text>` in English (7C). Not indexed (`noindex, follow`). Page size and paging: see the open decisions.

## Page order (proposal)

| Row | Content |
| --- | --- |
| Site header | As on every page (TopBar, NavBar) |
| `ad-top` | As on the homepage |
| Page title | `PageTitle`: "Results for “<query>”" (en) / "“<query>” এর ফলাফল" (bn), the page `h1`. The query is shown as text. |
| Search row | The search field from the dialog (SearchDialog.field, 56px, attached submit button), prefilled with the query, so a reader can refine it on the page. Same behaviour as the dialog. |
| Count | One line, ink-secondary: "12 results" (en) / "১২ টি ফলাফল" (bn). Hidden when the query is too short or failed. |
| Results | One card per row: `StoryCard` `thumbnail` (3:2 image at the end, text : image = 2 : 1), `Divider.item` between rows, the same as More stories on the category page (7B.2, LAY-07). One per row at every width. |
| Load more | The C-12 primary `Button`, "More results" (en) / "আরও ফলাফল" (bn), adds the next page and moves focus to the first added title (7B.2 Load more). Gone when no results are left. |
| Trending row | Only when there are no results: the trending terms as in the dialog (SearchDialog.trending), each a link to a search. Hidden when the editors have none. |
| `ad-band` | After the results, as on the category page. |
| Footer | As on every page |

No rail, no Most read, no analysis or opinion blocks: the page is a list of results and nothing else.

## States

| State | Shown |
| --- | --- |
| Empty query, or one letter | The search row with a prompt: "Type at least two letters." / "কমপক্ষে দুটি অক্ষর লিখুন।" No request is made. |
| Query over 200 characters | "Search for fewer words." / "আরও কম শব্দে খুঁজুন।" No request. |
| No matches | "No stories matched “<query>”." / "“<query>” দিয়ে কোনো খবর পাওয়া যায়নি।", then the trending row. |
| Search unavailable (API down or error) | "Search is not available right now. Try again in a moment." / "এখন অনুসন্ধান করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।" The page still renders with its header and footer. |
| Preview (no API, mock mode) | "Search is not available in this preview." |

## Copy

All new strings go in `en.ts` and `bn.ts`. The Bangla strings above are a first draft and must be reviewed by a native speaker before launch (the same rule as the unavailable page).

## Responsive

- One column at every width. Cards stay one per row (LAY-07, DR-409).
- At 200% browser text size the search row stacks and nothing scrolls sideways (DR-81).
- The search field keeps 56px height and the submit button stays attached, as in the dialog.

## Open decisions (settled for now, as recommended)

1. **Search row on the page.** Decided: yes, prefilled.
2. **Page size.** Decided: 10 results per page. The API default is 20; the page requests 10.
3. **Sort.** Decided: relevance only (the API order).
4. **Opinion.** Decided: opinion stays out of results (ADR-044).
5. **Ad band.** Decided: one band after the results, as on the category page.
6. **Bangla copy.** Native review of every new string before launch (open; the drafts are marked for review).

## What the build needs once approved

- `src/app/[lang]/search/page.tsx` already exists and reads the API; it needs the layout above (its current page is the category layout without the search row and states).
- `SearchForm` and `SearchDialog` already exist; the search row reuses them.
- The API page size is a query parameter (`limit`), so 10 needs no API change.
