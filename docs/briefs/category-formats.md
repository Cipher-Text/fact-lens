# Brief: Category page formats (run 2 of 2)

Branch `page/category-formats` (from `dev` after PR #15) · Issue IMP-118 · Decision DR-415 · Drafted 28 October 2026

## Goal and URL

The category page `/[lang]/category/<id>` (5 categories, layout 7B) splits its stories by format (layout 7C.3). The main stream is news only. Analysis and opinion get their own section directly above Most read. More stories lists news and analysis, never opinion. The homepage does not change (DR-370; its Latest rail is IMP-120).

## Page order (layout 7B.1, changed rows in bold)

| Row | Component | Change |
| --- | --- | --- |
| Page title | C-43 PageTitle | None |
| CategoryFeatureSection | C-02 OverlapCard, card rows C-24, rail C-03 StoryList | **Feature story and rail: news only (tajmin, 28 Oct 2026). Card rows: news only too (DR-415 main stream; tajmin, 28 Oct 2026)** |
| `ad-band` | AdSlot | None |
| **Analysis and opinion** | **P-3 GroupedCategoriesSection layout, 2 × C-23 CategoryBlock** | **New row. One row of two blocks: Analysis at the start, Opinion at the end; 1 per row on phones (`LAY-07`). Each block: heading, feature StoryCard (3:2), StoryList, MoreLink** |
| Most read | C-07 RankedList | None |
| `ad-band` | AdSlot | None |
| CategoryMoreStoriesSection | C-24 `dated` | **News and analysis, never opinion; only stories not shown above** |

## Rules for the new row

- At most 5 stories per block: 1 feature StoryCard and up to 4 StoryList rows, newest first. Show what the category has; no new mock data while a block has at least one story (tajmin, 28 Oct 2026).
- Sparse (layout 7.3): an empty block is not shown and the other keeps its size, the other half of the row empty (P-3 odd rule). Both empty: the row is removed.
- Headings: বিশ্লেষণ / Analysis and মতামত / Opinion from `analysisOpinion` (no new strings). No Eyebrow (DR-153).
- CategoryBlock takes a heading, an id and a MoreLink target instead of a category, so the homepage P-3 output stays the same (DR-370).
- Container: `Shell`, `WithRail` with the rail empty, as CategoryMoreStoriesSection, so the blocks have the P-3 widths. MoreLink targets: `/analysis` and `/opinion`, the nav targets of UF-07; 404 until the hub pages (IMP-18). Spacing: `space-module` after the ad band (`LAY-12`) and `space-section` to Most read (tajmin, 28 Oct 2026).

## Content and mock data

- `getCategoryPage` (`src/content/index.ts`): feature, rail and card rows from news; `analysis` and `opinion`, 5 at most each; `more` = news and analysis not shown in the feature, rail, card rows or the analysis block, newest first.
- No new mock stories. Today per category (news / analysis / opinion): geopolitics 20 / 3 / 1, security 17 / 5 / 0, history 17 / 4 / 1, economy 22 / 2 / 2, technology 17 / 4 / 1. Security shows the Analysis block only.

## Rules that apply

Layout 7B, 7C.3, 7.3, 13; C-02, C-03, C-07, C-23, C-24; `LAY-05`, `LAY-07`, `LAY-12`, `LAY-13`, `LAY-14`, `COL-13`, `TYP-03`, `TYP-14`, `N-05`, `T-27`. Decisions: DR-415, DR-408 (amended), DR-153, DR-370.

## Checkpoints

1. Content: the format split in `getCategoryPage` and its unit tests.
2. CategoryBlock takes heading, id and link; the analysis and opinion row above Most read.
3. More stories without opinion and without repeats; sparse cases (security, one block, no block).
4. Final: `/checkpoint`, the spec update of layout 7B (7B.1 row, 7B.2 Formats replaces DR-408), STATUS, ISSUES (IMP-118).

## Test files

- Unit: `src/content/content.test.ts`, `src/components/home/grouped/grouped.test.tsx`.
- e2e: `tests/e2e/category.spec.ts` (formats per section, the new row in bn and en, sparse, no repeats), `tests/e2e/grouped.spec.ts` (homepage P-3 unchanged).
