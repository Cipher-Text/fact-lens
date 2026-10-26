# Category review: specs vs code

Branch `page/category-review` from `origin/dev` at `4ef6c2e` (PR #11 merged). Specs: layout 2.24, components 1.19, typography 2.18, contract 2.14. Decision register: draft 4, 25 Oct 2026 (project library). Code is the reference: each row proposes a spec update unless marked as a code fix. Nothing changed yet.

## A. Spec is missing what the code does (propose spec update)

| # | Where | Code | Spec | Proposal |
| --- | --- | --- | --- | --- |
| A1 | C-02 OverlapCard | `OverlapCard.tsx:20-25`: props `eyebrow` (false drops it) and `feature` (title `type-story-lead`, body ends with `--space-lead-panel`, `.overlap-feature` takes the LeadStory container steps, `components.css:165-185`) | C-02 Variants lists only `surface`; Title row says `type-story-title` only. CL-15 was decided (name) but never written into C-02 | Add `feature` and `eyebrow` to C-02 Variants, Title row and the "Place" row (category feature story) |
| A2 | Section 6 copy-ready CSS | `components.css:568-592`: `--rank-chip-size`, `--rank-chip-digit-size`, `--rank-chip-digit-weight`, `--rank-list-gap` with their media steps | Only the token table rows (lines 88-91 of the 1.19 diff); no CSS block to copy (AGENTS rule 6.2) | Add the CSS block to Section 6 |
| A3 | `--divider-rule` | `components.css:50`, `1px`, since R4-03; Divider.rule uses it | Named in the Divider.rule row, not in any token table or CSS block | Add to the Section 6 token table and CSS |
| A4 | Section 3 names (N-05) | `CategoryPageView`, `CategoryFeatureSection`, `CategoryCardList`, `CategoryMoreStoriesSection`, `CategoryMoreStoriesList` | Only in layout 7B; Section 3.1 page table and 3.2 words cover the homepage only | Add a category page block to 3.1 (or a 3.1 row per section) |
| A5 | P-5 row, Section 3.1 | `MostReadSection` has `layout="grid" \| "columns"` (`MostReadSection.tsx:13`) | P-5 says "Numbered list, 4 / 3 / 2 / 1 per row" | Add "`columns` on the category page (C-07)" |
| A6 | 7B.1 CategoryFeatureSection row | Feature story is OverlapCard `feature`, no eyebrow; a hidden `h2` labels the section (`CategoryFeatureSection.tsx:53`) | Says "the feature story" without the component; no hidden heading | Name C-02 `feature` and the sr-only h2 (as HeroSection's hidden heading) |
| A7 | 7B.1 More stories row | `WithRail` with an empty rail (`CategoryMoreStoriesSection.tsx:63`) | "`Shell`, wrapper column" | Say "`WithRail`, rail column empty" (same result, names the part) |

## B. Spec contradicts itself or is stale (DOC- issues)

| # | Where | Problem |
| --- | --- | --- |
| B1 | Contract Section 3 row "Category page layout"; layout 14.2 | Say "the other red items are open flags", but 7B intro and the spec log say every item is decided |
| B2 | `docs/STATUS.md` "Now" | Says typography 2.17 (now 2.18), "not committed" and "waits for the PR" (PR #11 is merged); Next should be `page/home-most-read` |
| B3 | `AGENTS.md` Section 5 folder layout | No `components/category/`, no `PageTitle` in `layout/` |

## C. Code comments out of date (code fix, small)

| # | Where | Problem |
| --- | --- | --- |
| C1 | `PageTitle.tsx:11` | "No sheet yet (U-45)": C-43 exists |
| C2 | `CategoryPageView.tsx:55-56` | Says most read has "Divider.item inside a column"; `columns` has no rule (C-07, CL-21) |

## D. Matches (checked)

Route and 404 (CL-19); page order and LAY-12 spacing (CL-01); WithRail and stacking (CL-02); rail StoryList (CL-03); card rows StoryCard row third 16:9 (CL-04); no Eyebrow (CL-05); sparse removal (CL-06); load more, 10 per press, focus move (CL-07, CL-20); nav links and `aria-current` (CL-08); StoryCard `dated` grid, 8rem `--spacing(32)`, 17.5rem fallback (CL-16); Divider.rule with equal space each side (C-22); PageTitle bar and 16px (C-43); RankedList `columns` chip, sizes, weights, gaps, ink tokens in `typography.css` (C-07, typography 3.1).

## E. Decision register conflicts (register draft 4, 25 Oct 2026, searched by DR-ID)

Code gets priority: the proposal is a new DR that amends the old one, unless marked as a code fix.

| # | DR | Register says | Code and spec do | Proposal |
| --- | --- | --- | --- | --- |
| E1 | none | No entry for any 27 Oct category decision (DR-372 says the register is updated with the specs) | Specs cite "tajmin, 27 Oct 2026" with no DR-ID: RankedList `columns`, rank chip, Divider.rule, C-43 PageTitle, StoryCard `dated`, OverlapCard `feature` | Register them as DR-402 onward and put the IDs in the specs |
| E2 | DR-144 | Numeral at the top of the title; "centered on the title" rejected | `columns` chip is centered on the whole title (`components.css:606`) | New DR: amends DR-144 for `columns` only |
| E3 | DR-147 | Bangla rank digits in Noto Sans Bengali, not Noto Serif Bengali | Chip digits are serif in both languages (`--font-editorial-active`, `components.css:616`) | New DR: amends DR-147 for `columns` only |
| E4 | DR-51, DR-145 | Most read 4 / 3 / 2 / 1 per row | `columns`: 2 list columns (1 to 3, 4 and 5), list in the end two thirds from 1024 | New DR: amends both for the category page (the homepage follows in IMP-99) |
| E5 | DR-299, DR-300 | Divider.item between Most read items in a column | `columns` has no rule, items `--rank-list-gap` apart | New DR: amends both for `columns` |
| E6 | DR-44 | "Other pages: 3 [story cards per row] from 1024px" | Category card rows are 1 per row at every width (7B.2 cites LAY-07) | Flag: is DR-44 "other pages" replaced for the category page? |
| E7 | DR-398 | Opinion and op-ed are not listed on category pages | `getCategoryPage` (`src/content/index.ts:209`) takes every story of the category; the 5 homepage opinion stories (`stories.ts:287` onward) reach the economy, geopolitics, technology and other pages | Code fix: filter out `opinion` and `op-ed`. A flag, because the code would change |
| E8 | DR-153 | StoryCard split `third \| lead`; FeatureCard is C-02 | Code and spec: split `third \| feature`, C-02 is OverlapCard | Register is out of date (later renames); note it in the register, no spec change |

Matches: DR-399 (slugs and `/category/<id>`), DR-181 (Drawer rows link to the category page), DR-311 (Eyebrow target now exists), DR-331 (Analysis and Regions stay anchors), DR-308 (17.5rem fallback on `dated`), DR-338 (no-image placeholder), DR-350 and DR-351 (ink-measured Divider.item on the card rows).

## Flags (need tajmin)

- F1: Decided (tajmin, 26 Oct 2026): yes, the OverlapCard `feature` look goes into C-02 as a new decision (new DR, with E1).
- F2: Decided: DR-44 amended (DR-409).
- F3: Decided: opinion stays; DR-398 amended (DR-408). No code change.
- F4: Decided: DR-402 to DR-409 are in the register and hub_data (coordinator, 26 Oct 2026).

## Decisions (tajmin, 26 Oct 2026)

- E7 / F3: opinion stays on the category pages. No code change; DR-398 is amended by a new DR.
- A1 / F1: the OverlapCard `feature` look is written into C-02 (new DR).
- E1 to E5 / F4: the rules are amended by new DRs. The homepage RankedList moves to `columns` later (`docs/tasks/home-most-read.md`, IMP-99).
- E6 / F2: DR-44 amended; the category page has priority (tajmin). The card rows and More stories stay 1 per row (LAY-07, layout 7B.2).

## Draft DRs (to add to the register and hub_data.py)

| ID | Decision | Amends |
| --- | --- | --- |
| DR-402 | Category page (layout 7B): page order, CategoryFeatureSection as HeroSection, no Eyebrow, load more 10 at a time, sparse removal (CL-01 to CL-08, CL-19, CL-20) | – |
| DR-403 | RankedList `columns` (C-07) on the category page: 2 list columns (1 to 3, 4 and 5), the list in the end two thirds from 1024, no Divider.item, items `--rank-list-gap` apart | DR-51, DR-145, DR-299, DR-300 (category page) |
| DR-404 | Rank chip: square `--color-bar` chip, on-interactive serif digits in both languages, centered on the whole title, chip tokens and ink tokens | DR-144, DR-146, DR-147 (`columns`) |
| DR-405 | Divider.rule (C-22): the shared 1px solid horizontal rule; C-43 PageTitle: the h1 with the section bar and no rule | – |
| DR-406 | StoryCard layout `dated` (C-24): date \| body \| media from 600, stacked under 600 | – |
| DR-407 | OverlapCard `feature` and `eyebrow` (C-02): title in `type-story-lead`, body ends with `--space-lead-panel` | DR-153 |
| DR-408 | Opinion and op-ed are listed on category pages | DR-398 |
| DR-409 | Category page card rows and More stories: 1 per row at every width (LAY-07) | DR-44 ("other pages: 3 from 1024") |

## Applied on `page/category-review` (not committed)

- `component-system.md` 1.20: C-02 `feature` and `eyebrow`; Section 3.1 P-5 row and a category page table; Section 6 `--divider-rule` and the RankedList `columns` CSS, `.overlap-feature` in the container rule.
- `spacing-layout-system.md` 2.25: LAY-07 category exception; 7B.1 rows; 7B.2 card rows and Formats; 14.2; changelog.
- `agent-contract.md` 2.15: Section 3 row, Section 5 versions, DR-51 row.
- Code comments: `PageTitle.tsx`, `CategoryPageView.tsx`, `components.css` (Divider tokens).
- `docs/STATUS.md`, `AGENTS.md` (folder layout, pages).
