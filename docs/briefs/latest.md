# Brief: Latest page

Branch `page/latest` (from `dev` after PR #17) · Issue IMP-18 (the `/latest` part) · Drafted 28 October 2026

## Goal and URL

The news hub `/latest` and `/en/latest` (layout 7C.2 Paths, News hub row: news only; the page layout has no spec yet). One feed of the newest news across all 5 categories, newest first. It replaces today's 404 page. The homepage Latest rail and its "আরও দেখুন" / See more link do not change (DR-370, IMP-120). The NavBar and the Drawer do not change.

## Page order

| Row | Component | Notes |
| --- | --- | --- |
| Site header | C-17 TopBar, C-18 NavBar | As on the category page. No current item: Latest is not a nav item |
| `ad-top` | AdSlot | As on the homepage (layout 9). No `ad-band` on the page |
| Page title | C-43 PageTitle | সর্বশেষ / Latest, the page `h1`, in the `surface` band, as on the category page |
| Latest list | Reuse: `Shell`, `WithRail` (the rail stays empty), `Wrapper` | StoryCard `dated` rows (C-24) as in `MoreStoriesList` (was `CategoryMoreStoriesList`, renamed for U-51): the 3 columns from 600px, the date column at a fixed width. Divider.item between the rows. Each row shows the C-08 `category` Eyebrow. 10 stories first, then each press of the load more Button (C-12) adds 10 (was 20 first; tajmin, 28 Oct 2026). The added rows fade in and their images fade in when loaded (progress file, Decisions). Then Divider.rule (C-22) and the Button, as in More stories |
| Footer | C-21 Footer | As on the homepage |

## Content and mock data

- New `getLatestPage(lang)` in `src/content/index.ts`: every news story (`format: "news"`) from `stories.ts`, `category-stories.ts` and `category-stories-older.ts`, newest first by `publishedAt`, with no duplicates. Every story has a category, so the page has no region-only news. Analysis and opinion are not shown.
- No new mock stories: about 92 news stories, so the page shows 10, then load more 9 times.
- Strings: the title comes from the existing `latest` key (`সর্বশেষ` / `Latest`) and the button from the existing `categoryPage.loadMore` key. A shared `latestPage` key is added only if a string is missing.

## Reuse and what is new

- New: the route `src/app/[lang]/latest/page.tsx` (static, `bn` and `en`) and `LatestPageView`.
- Reuse: the load-more logic of `MoreStoriesSection` (was `CategoryMoreStoriesSection`, renamed for U-51) as it is: 10 first, then 10. No copied layout utilities.
- Reuse: StoryCard `dated` with `eyebrow` (`category` mode). An analysis row cannot occur (news only), so `formatLabel` is not used.
- Sparse (layout 7.3): with no news the list section is removed. With 10 or fewer stories there is no Button.

## Rules that apply

Layout 7B.1 and 7B.2 (as the pattern), 7C.2 Paths (News hub row), 7.3, 9, 13; C-08, C-12, C-22, C-24, C-43; `LAY-05`, `LAY-07`, `LAY-09`, `LAY-14`, `LAY-17`, `COL-13`, `TYP-03`, `TYP-14`, `N-05`, `T-27`. Decisions: DR-350, DR-370, DR-153 (the Eyebrow shows here: the page mixes categories).

## Checkpoints

1. Content: `getLatestPage` (news only, all categories, newest first) and its unit tests.
2. Route and shell: `/latest` and `/en/latest` with the header, `ad-top`, PageTitle and footer; the 404 for `/latest` goes.
3. The list: dated StoryCard rows with the category Eyebrow, 10 first, then load more by 10 with focus on the first added story.
4. Final: e2e, visual check at the test widths, `/checkpoint`.

## Test files

- `src/content/content.test.ts` (changed): `getLatestPage`.
- `tests/e2e/latest.spec.ts` (new): both languages, news only and order, the Eyebrow, 10 then 10, focus after load more, keyboard, axe, no sideways scroll at the test widths.
- `tests/e2e/hero.spec.ts` (run, not changed): the hero "আরও দেখুন" link to `/latest` now opens the page.
