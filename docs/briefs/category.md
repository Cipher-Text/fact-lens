# Category page brief

Branch `page/category` · Spec log: `docs/spec-log/category.md` · Specs at start: color 2.16, typography 2.17, layout 2.23, components 1.18.1, contract 2.13.1

## Goal and URL

One page template for every category: `/[lang]/category/[id]` (Bangla `/category/economy`, English `/en/category/economy`). The 6 ids are bangladesh, geopolitics, economy, security, technology and history. `generateStaticParams` builds the 12 pages; an unknown id gives `notFound()` (404). Closes IMP-35 and the category part of IMP-18. Covers L-19 (page patterns) for this page only.

## Sections, top to bottom

| # | Section | Component |
| --- | --- | --- |
| 1 | Site header, top ad row | C-17, C-18, C-19, C-16 (unchanged) |
| 2 | Page title: the category name, `type-page-title`, h1, no description | New: `CategoryHeader` |
| 3 | Lead block: the top story, and the rail with the category's latest 5 stories (newest first, not the top story) | C-01 `LeadStory`, `Rail`, C-13 `SectionHeading`, C-03 `StoryList` of C-25 `StoryListItem` |
| 4 | Card rows: 3 stories, one per row at full width, text left, 16:9 image right (2 : 1), as in the CategoryBlock list | C-03 `StoryList` of C-24 `StoryCard` row, C-22 `Divider` |
| 5 | Band ad row | C-16 |
| 6 | Most read in this category, numbered: 4 per row from 1280px, 3 at 1024–1279px | C-13, C-07 `RankedList` |
| 7 | Band ad row | C-16 |
| 8 | More news: older stories, 10 at a time, and a "load more" button that adds 10; the button goes when none are left | C-13, C-03 of C-25, C-12 `Button` |
| 9 | Footer | C-21 (unchanged) |

No Eyebrow on any card: every story is in this category and the page title names it (DR-153). A section with no stories is removed (layout §7.3 pattern).

## Header links

NavBar and Drawer category items go to `/category/<id>` (`/en/...`) instead of `/#category-<id>`. Only these links change. The current category gets `aria-current="page"`, and the Drawer opens on it (DR-181).

## Content and mock data

- At least 16 stories per category, so every section is full and More news has a second load. A Haiku agent writes the new stories, following the `mock-content` skill. Bangla and English for each.
- A most read ranking per category (8 ids).
- New strings in `src/i18n/bn.ts` and `en.ts`: Latest, Most read, More news and Load more headings or labels.

## Rules

`COL-04`, `COL-05`, `COL-13`, `TYP-03`, `TYP-04`, `TYP-08`, `TYP-14`, `LAY-06`, `LAY-07`, `LAY-09` to `LAY-14`, `LAY-17`, `CPT-05`, `CPT-06`, `CPT-07`, `N-05`, DR-51, DR-145, DR-153, DR-181, DR-370.

## Checkpoints

1. Route, 404 for unknown ids, mock data, header and top ad row, page title
2. Lead block: LeadStory and the latest rail
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
