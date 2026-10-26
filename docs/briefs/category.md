# Category page brief

Branch `page/category` · Spec log: `docs/spec-log/category.md` · Specs at start: color 2.16, typography 2.17, layout 2.23, components 1.18.1, contract 2.13.1

## Goal and URL

One page template for every category: `/[lang]/category/[id]` (Bangla `/category/economy`, English `/en/category/economy`). The 6 ids are bangladesh, geopolitics, economy, security, technology and history. `generateStaticParams` builds the 12 pages; an unknown id gives `notFound()` (404). Closes IMP-35 and the category part of IMP-18. Covers L-19 (page patterns) for this page only.

## Sections, top to bottom

| # | Section | Component |
| --- | --- | --- |
| 1 | Site header, top ad row | C-17, C-18, C-19, C-16 (unchanged) |
| 2 | Page title: the category name, `type-page-title`, h1, no description | New: `PageTitle` |
| 3 | `CategoryFeatureSection`, laid out as the homepage hero: the wrapper holds the feature story, with the title in `type-story-lead` (the C-01 title size), then the card rows (4); the rail holds the category's latest 5 stories (newest first, not the top story). Below 1024 the rail goes under the whole wrapper (LAY-05) | `WithRail`, `Wrapper`, C-02 `OverlapCard` (tajmin's tweak at checkpoint 2), `Rail`, C-13 `SectionHeading`, C-03 `StoryList` of C-25 `StoryListItem` |
| 4 | Card rows, in the CategoryFeatureSection wrapper under the feature story (no rail ad): 3 stories, one per row, text left, 16:9 image right (2 : 1), as in the CategoryBlock list | C-03 `StoryList` of C-24 `StoryCard` row, C-22 `Divider` |
| 5 | Band ad row, after CategoryFeatureSection | C-16 |
| 6 | Most read in this category, numbered, the top 5 (tajmin's redesign after checkpoint 5). SectionHeading across the shell, as in every section. Under it, from 1024, a grid of three equal columns: the start column stays empty, items 1 to 3 in the middle column and items 4 and 5 in the end column. 600–1023: the two list columns span the shell (1 to 3, 4 and 5, column-first). Phone: one column. The first list column takes 3 items in the sparse case. No Divider.item: the items are `--rank-list-gap` apart (24px, 28px from 600, 32px from 1280), and the tops of the two columns line up (tajmin, after checkpoint 5). Rank: a square chip in `--color-bar` with `on-interactive` digits, as the label Chip (C-11); serif digits in both languages (Source Serif 4, Noto Serif Bengali), 24px at weight 700 in a 36px chip, 32px at 600 in 44px from 1024, 16px to the title; the digits are trimmed to their ink, so they sit in the chip's center; the chip and the whole title center on each other (tajmin, after checkpoint 5). The `type-rank` nudge stays as on `dev` (tajmin, final checkpoint: DOC-55). The homepage keeps its layout and numerals; its own branch replaces them with this layout (`docs/tasks/home-most-read.md`, IMP-99) | C-13 `SectionHeading`, C-07 `RankedList` (columns layout) |
| 7 | Band ad row | C-16 |
| 8 | More stories (আরও পড়ুন): older stories, 10 at a time. Phone: the basic image card (image, title, deck, date). From 600: three columns, the date, the title and deck, the 16:9 image (date column `--more-story-date-width`, then 2 : 1). Divider.item between items. A 1px solid rule, then the "load more" button that adds 10; the rule and the button go when none are left (tajmin, after checkpoint 5) | `CategoryMoreStoriesSection`: C-13, `CategoryMoreStoriesList` of C-24 `StoryCard` dated, C-22 Divider.rule, C-12 `Button` |
| 9 | Footer | C-21 (unchanged) |

No Eyebrow on any card: every story is in this category and the page title names it (DR-153). A section with no stories is removed (layout §7.3 pattern).

## Header links

NavBar and Drawer category items go to `/category/<id>` (`/en/...`) instead of `/#category-<id>`. Only these links change. The current category gets `aria-current="page"`, and the Drawer opens on it (DR-181).

## Content and mock data

- At least 16 stories per category, so every section is full and More news has a second load. A Haiku agent writes the new stories, following the `mock-content` skill. Bangla and English for each.
- A most read ranking per category (8 ids).
- New strings in `src/i18n/bn.ts` and `en.ts`: Latest, Most read, More stories and Load more headings or labels.

## Rules

`COL-04`, `COL-05`, `COL-13`, `TYP-03`, `TYP-04`, `TYP-08`, `TYP-14`, `LAY-06`, `LAY-07`, `LAY-09` to `LAY-14`, `LAY-17`, `CPT-05`, `CPT-06`, `CPT-07`, `N-05`, DR-51, DR-145, DR-153, DR-181, DR-370.

## Checkpoints

1. Route, 404 for unknown ids, mock data, header and top ad row, page title
2. CategoryFeatureSection: the feature story and the latest rail
3. Card rows and the first band ad
4. Most read section and the second band ad
5. More news with load more; NavBar and Drawer links with `aria-current`
6. Final: `/checkpoint`

## Test files

- New: `tests/e2e/category.spec.ts` (sections, widths, 404, load more, keyboard, axe, Bangla and English)
- Changed: `tests/e2e/header.spec.ts` (category link targets, `aria-current`)
- Unit: `src/content/content.test.ts` (16 stories per category, most read ids exist)

## Not in scope

Subcategories, a category description, IMP-97 (article URLs and the format Eyebrow: its own branch later).
