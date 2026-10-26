# Category page spec log

Branch `page/category` · Brief: `docs/briefs/category.md` · Specs at branch start: color 2.16, typography 2.17, layout 2.23, components 1.18.1, contract 2.13.1

This log records how the category page code uses or changes the design system (DR-372). It does not edit `docs/design-system/` until the final checkpoint. The code is the reference: after tajmin marks the items, the green items go into the specs.

## Kinds

| Kind | Use when |
| --- | --- |
| Reuse | An existing rule, token or component is used in a new place. Name it |
| New token | A tweak has no token step. Give the name, the value and the scale it joins (`CPT-07`) |
| New component | A part that no sheet in `component-system.md` §7 covers. Give the name per `N-01` to `N-05` |
| New rule | A behavior that no rule covers |
| Changed rule | The page needs an existing rule to change. Always a flag |

## Items

### Reuse

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| CL-01 | Reuse | Site header, top ad row, band ad rows and footer, unchanged. The ad space belongs to the section before it (space-module), main starts with space-page-start and ends with space-section | `CategoryPageView.tsx:27`, `:29`, `:34`, `:52`, `:70`, `:83` | C-16 to C-19, C-21, `LAY-09` to `LAY-13` | checkpoint 1 | green: refs match; C-16 to C-21 reused with LAY-12 spacing |
| CL-02 | Reuse | `CategoryFeatureSection` laid out as HeroSection: `Shell`, `WithRail`, `Wrapper`, `Rail`. From 1024 the rail is beside the wrapper; below, it goes under the whole wrapper. With no latest stories the wrapper spans the shell | `CategoryFeatureSection.tsx:57`, `:59` | `LAY-05`, layout 7.3 | tajmin, checkpoint 2 | green: as HeroSection; refs match |
| CL-03 | Reuse | Latest rail: C-13 `SectionHeading`, C-03 `StoryList` of C-25 `StoryListItem`, the 5 newest after the feature story, time and reading time, no category | `CategoryFeatureSection.tsx:65` | C-03, C-13, C-25, DR-153 | checkpoint 2 | green: C-13 and C-03 reused |
| CL-04 | Reuse | Card rows: C-24 `StoryCard` row, 16:9, split third (text : image = 2 : 1), summary, Divider.item between rows, measured to the image top | `CategoryCards.tsx:25` | C-22, C-24, DR-268, DR-350, `LAY-07` | checkpoint 3 | green: C-24 row and Divider.item as AnalysisList |
| CL-05 | Reuse | No Eyebrow on any card: the page title names the category | `CategoryFeatureSection.tsx:41`, `CategoryCards.tsx:37` | DR-153 | brief | green: DR-153 |
| CL-06 | Reuse | A section with no stories is removed, with its ad row | `CategoryPageView.tsx:43`, `:58`, `:75` | layout 7.3, `LAY-13` | brief | green: layout 7.3 and LAY-13 |
| CL-07 | Reuse | Load more is a C-12 primary `Button` | `CategoryMoreStoriesSection.tsx:79` | C-12, `COL-05`, `COL-13` | checkpoint 5 | green: C-12 primary |
| CL-08 | Reuse | NavBar and Drawer category items go to `/category/<id>` (`/en/...`); the open category has `aria-current="page"` (the NavBar bar underline, the Drawer row). Region and Analysis links stay homepage anchors | `navItems.ts:33` to `:37`, `NavBar.tsx:116`, `Drawer.tsx:247` | DR-181, DR-331, IMP-14 | checkpoint 5 | green: refs match; region and Analysis links stay anchors |

### New tokens

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| CL-09 | New token | `--more-story-date-width` 8rem: the date column of the More stories item from 600 (removed: `--spacing(32)`) | `components.css:258` | `CPT-07` | tajmin, after checkpoint 5 | red: one component, a scale step (8rem = `w-32`); CPT-07 asks for a scale class unless tajmin approves a token; decided: the token is removed, the date column is `--spacing(32)` (tajmin, U-44) |
| CL-10 | New token | `--rank-chip-size` 2.25rem (2.75rem from 1024), `--rank-chip-digit-size` 1.5rem (2rem from 1024), `--rank-chip-digit-weight` 700 (600 from 1024): the rank chip of the RankedList columns layout | `components.css:558`, `:572` | `CPT-07`, C-07, C-11 | tajmin, after checkpoint 5 | red: scale values for one component; the breakpoint steps may justify a token; follows CL-22; decided: tajmin approved the columns layout for the category page, 27 Oct 2026, written into C-07 (U-42) |
| CL-11 | New token | `--rank-chip-ink-start` and `--rank-chip-ink-end` per language (en 0.205em and 0.143em, bn 0.17em and 0.19em): the blank space above and below the serif digits, measured from the fonts, so the chip centers the ink | `typography.css:114`, `:234` | `CPT-07`, typography 3.1, DR-355 | tajmin, after checkpoint 5 | red: ink tokens belong in `typography.css` with the other `--type-*-ink-*` tokens (typography 3.1); decided: tajmin approved the columns layout for the category page, 27 Oct 2026, written into C-07 (U-42); decided: moved to `typography.css`, typography 3.1 and 8.2 (tajmin, U-44) |
| CL-12 | New token | `--rank-list-gap` 1.5rem, 1.75rem from 600, 2rem from 1280: the space between the RankedList columns items, which have no rule | `components.css:561`, `:566`, `:580` | `CPT-07` | tajmin, after checkpoint 5 | red: exists only for the no-rule layout of CL-21; decided: tajmin approved the columns layout for the category page, 27 Oct 2026, written into C-07 (U-42) |
| CL-13 | Changed rule | `--type-rank-nudge` en -0.1em to -0.14em, bn -0.125em to -0.05em (the homepage numerals). It changes a token value, and the en value breaks the C-22 16px ink check on the homepage at 360 and 768 (`small-parts.spec.ts:102`, most read 13 to 14px). -0.12em passes | `typography.css:136`, `:250` | `TYP-17`, DR-144, C-22, DR-350 | tajmin, after checkpoint 5 | red: changed rule (token value, locked homepage); breaks the C-22 ink test on /en at 360 and 768; closed: values set back to dev, the homepage list moves to the columns layout on its own branch (DOC-55, IMP-99) |

### New components

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| CL-14 | New component | `PageTitle` (was CategoryHeader; tajmin, 27 Oct 2026, U-43): the page title, the category name as the h1 in `type-page-title`, in the shell, with the Divider.section bar (`--bar-section-width`, `--bar-section-height`, `--color-bar`) 16px above it and no rule. No description. No sheet | `PageTitle.tsx:13` | `N-05`, C-22, `COL-04` | tajmin, checkpoint 2 | red: the bar is a new Divider.section use without its rule (U-45); name decided: `PageTitle` (tajmin, U-43); decided: the bar stays alone, no rule (tajmin, U-45); written as C-43 PageTitle |
| CL-15 | New component | `OverlapCard` variant of C-02 (not a new component): props `feature` (was `lead`, U-43; title in `type-story-lead`, the text block ends with `--space-lead-panel`, which steps with the card width as in LeadStory, `.overlap-feature`) and `eyebrow` (false drops the Eyebrow) | `OverlapCard.tsx:25`, `:55`, `:65`, `components.css:169` | C-01, C-02, DR-153 | tajmin, checkpoint 2 | red: a C-02 variant needs a sheet update; name decided: `feature` (tajmin, U-43) |
| CL-16 | New component | StoryCard layout `dated` (C-24 variant, was the separate CategoryMoreList grid; tajmin, 27 Oct 2026): under 600 the image, the title and deck, then the date; from 600 three columns, date (8rem, `--spacing(32)`) \| title and deck \| image (2 : 1). The date is the time only. Grid areas, no `order`. Stacks under a 17.5rem card (DR-308). `CategoryMoreStoriesList` renders it | `StoryCard.tsx:21`, `:71`, `components.css:253`, `CategoryCards.tsx:46` | C-24, `CPT-02`, `LAY-14`, DR-267, DR-308, DR-338 | tajmin, after checkpoint 5 | decided: one card with a dated variant, not a second card pattern (tajmin, 27 Oct 2026); written into C-24 |
| CL-17 | New component | `CategoryMoreStoriesSection` (was CategoryMoreNews; tajmin, U-43): the More stories section (আরও পড়ুন / More stories), 10 at a time, in the wrapper column; a 1px rule (`--divider-rule`, `bg-border`) and the load more button, both gone when none are left. Focus moves to the title link of the first added story | `CategoryMoreStoriesSection.tsx:33`, `:44`, `:71` | C-12, C-13, C-22, `COL-13` | tajmin, checkpoint 5 and after | red: the rule is a hand-made div, not a Divider part (U-45); name decided, N-01 met (tajmin, U-43); the rule is now Divider.rule (C-22, tajmin, U-45); the section stays red with CL-16; decided with CL-16 (tajmin, 27 Oct 2026) |
| CL-18 | New component | `RankedList` columns layout and `MostReadSection` `layout="columns"`: SectionHeading across the shell; from 1024 a 3-column grid with the start third empty and the list in the middle and end thirds; 600 to 1023 the list spans the shell; CSS columns, column-first, 1 to 3 then 4 and 5, the column tops lined up; phone one column | `MostReadSection.tsx:44`, `RankedList.tsx:26`, `:52`, `:72` | C-07, C-13, DR-51, DR-145, `LAY-14` | tajmin, after checkpoint 5 | red: contradicts C-07, DR-51 and DR-145 (items per row); a second RankedList pattern; decided: tajmin approved the columns layout for the category page, 27 Oct 2026, written into C-07 (U-42) |

### New and changed rules

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| CL-19 | New rule | Category page route and order: `/[lang]/category/[id]`, 12 static pages, an unknown id is a 404. Order: header, top ad, title, CategoryFeatureSection (feature story and card rows, latest rail), band ad, most read (top 5), band ad, More stories, footer | `page.tsx:9`, `:39`, `CategoryPageView.tsx:19` | L-19 (this page), DR-17, DR-19, IMP-35 | brief | green: route, `dynamicParams = false` and order match the brief |
| CL-20 | New rule | Load more pattern: a list shows 10, each press adds 10 and moves focus to the first new item; the button goes when none are left | `CategoryMoreStoriesSection.tsx:33` | `COL-13`, C-12 | brief, checkpoint 5 | green: no conflict; focus move tested in `category.spec.ts` |
| CL-21 | Changed rule | RankedList columns layout has no Divider.item between items in a column (C-07 and DR-299 put one there); the items are `--rank-list-gap` apart | `RankedList.tsx:70` | C-07, C-22, DR-299 | tajmin, after checkpoint 5 | red: changed rule (drops the DR-299 Divider.item); decided: tajmin approved the columns layout for the category page, 27 Oct 2026, written into C-07 (U-42) |
| CL-22 | Changed rule | The rank in the columns layout is a square chip in `--color-bar` with `on-interactive` serif digits (Source Serif 4, Noto Serif Bengali), centered on the whole title; C-07 has a `type-rank` numeral in `interactive` at the top of the item | `components.css:591`, `RankedList.tsx:78` | C-07, C-11, typography 7.1 `type-rank`, `COL-04`, `COL-05` | tajmin, after checkpoint 5 | red: changed rule (C-07 numeral, C-11 chip, COL-04, COL-05); decided: tajmin approved the columns layout for the category page, 27 Oct 2026, written into C-07 (U-42) |

## Later

- The homepage keeps its most read grid layout and numerals for now. tajmin wants it replaced by the columns layout on its own branch after this merge: `docs/tasks/home-most-read.md` (IMP-99).
- IMP-97: article URLs and the format Eyebrow, its own branch.
- 200% browser text size (visual check, 1280, root font 200%): the More stories item grid collapses (U-46). Not fixing (tajmin, 27 Oct 2026). The rest of the page holds.
- Mock data: 8 of the first 10 older economy stories have no image, so More stories shows mostly the no-image placeholder (DR-338). More images would show the layout better.
