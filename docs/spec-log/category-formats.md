# Category formats spec log

Branch `page/category-formats` · Brief `docs/briefs/category-formats.md` · Issue IMP-118 · Started 28 October 2026

This log keeps what the build adds or finds wrong. Open code items are rows in `docs/ISSUES.md`.

## Kinds

| Kind | Use when |
| --- | --- |
| Reuse | An existing rule, token or component is used in a new place. Name it |
| New token | A tweak has no token step. Give the name, the value and the scale it joins (`CPT-07`) |
| New component | A part that no sheet in `component-system.md` §7 covers. Give the name per `N-01` to `N-05` |
| New rule | A behavior that no rule covers |
| Changed rule | The page needs an existing rule to change. Always a flag |

## Items

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| CF-01 | Changed rule | The category page splits stories by format (DR-415, replaces 7B.2 "Formats", DR-408): feature story, rail and card rows are news only; an analysis and opinion row sits directly above Most read; More stories lists news and analysis not shown above, never opinion, newest first. No story shows twice. No new mock data while a block has a story (tajmin, 28 Oct 2026). Load more now shows on geopolitics and economy only (8 More stories on history and technology, 8 on security with the analysis row); `content.test.ts` checks the second load on those two and one load on the others | `src/content/index.ts:226`, `:241`; `src/components/category/CategoryPageView.tsx:68` | DR-415, DR-408, layout 7B.1, 7B.2, 7C.3 | checkpoint 1 || green: changed rule decided by tajmin (DR-415, brief answers 28 Oct 2026) |
| CF-02 | New component | `CategoryFormatsSection`: the analysis and opinion row. The P-3 layout: one row of two CategoryBlocks (C-23), Analysis at the start, Opinion at the end, 1 per row on phones; up to 5 stories per block; `Shell`, `WithRail` with the rail empty (the P-3 block widths). Sparse: an empty block is not shown, the other keeps its size; both empty, no row. MoreLinks to `/analysis` and `/opinion` (404 until IMP-18). `space-module` after the ad band, `space-section` to Most read | `src/components/category/CategoryFormatsSection.tsx:29` | C-23, `LAY-05`, `LAY-07`, `LAY-12`, `LAY-13`, `N-05`, layout 7.3 | checkpoint 2 || green: add the name to component-system Section 3 |
| CF-03 | Changed rule | C-23 CategoryBlock takes `name`, `heading` and `href` from the page instead of a category id, and an optional body that replaces the feature card and StoryList. The homepage passes the same values, so P-3 is unchanged (DR-370). The C-23 sheet says the MoreLink goes to the category page; on the category page it goes to a format hub | `src/components/home/grouped/CategoryBlock.tsx:34`, `:52`; `src/components/home/grouped/GroupedCategoriesSection.tsx:80` | C-23, C-10, DR-110, DR-122, DR-370 | checkpoint 2 || green: changed rule; P-3 output unchanged (DR-370) |
| CF-04 | Reuse | The Opinion block uses the P-4 OpinionList quote rows (quote mark, title, author, time, no image), split out as `OpinionRows`; the homepage OpinionList uses the same rows (tajmin, 28 Oct 2026) | `src/components/home/analysis/OpinionList.tsx:48`, `src/components/category/CategoryFormatsSection.tsx:55` | C-06, DR-299, DR-300, DR-351 | checkpoint 2 tweak || green |
| CF-05 | Reuse | `groupedRow`: the P-3 row classes (1 column, 2 from 600, `--grid-column-gap`, `--grid-row-gap`) shared by P-3 and the category page row | `src/components/home/grouped/GroupedCategoriesSection.tsx:16` | `LAY-07`, `LAY-21` | checkpoint 2 || green |
| CF-06 | Changed rule | C-43 PageTitle is a band on every page that uses it: `surface` background across the full width, the content in the shell, block inset `space-page-title-band` 24px under 600px, 32px from 600px, 40px from 1024px (tajmin, 28 Oct 2026; not the LAY-20 panel band values, CPT-07), first row of `main` under the ad-top row in place of `space-page-start`. `Divider.section` (bar on the rule) replaces `PageTitle.bar`, `space-section-rule-title` to the title. Space after the band: `space-module` (was `space-section-title-after`). The colour is `surface`, at tajmin's request (28 Oct 2026, after `surface-elevated` first): no rule names `surface` for a band; the page is `background` (#fff9ed light, #18191e dark), the band #fffcf7 / #202126. tajmin's "bar-above-rule" is read as Divider.section | `src/components/layout/PageTitle.tsx:28`, `:32`; `src/components/category/CategoryPageView.tsx:48` | C-43, C-22, C-13, `LAY-20`, DR-264, DR-405 | tweak after checkpoint 3 || green: `surface` approved by tajmin in chat (28 Oct 2026), U-50 closed |
| CF-07 | Changed rule | More stories: an analysis row shows the C-08 `format` Eyebrow (বিশ্লেষণ / Analysis, a link to `/analysis`) above the title at every width; news rows show none. Amends DR-153 and 7B.2 "No Eyebrow" for this row only (tajmin, 28 Oct 2026). StoryCard option `formatLabel`, dated layout only. Closes U-49 for More stories | `src/components/story/StoryCard.tsx:126`, `src/components/category/CategoryCards.tsx:59` | C-08, C-24, DR-153, DR-417, U-49 | tweak after checkpoint 3 || green: changed rule approved by tajmin in chat (28 Oct 2026); U-49 closed for More stories |
| CF-08 | Reuse | `MissingTranslationNote` sits in the PageTitle band, above the Divider (a `note` slot); still a gap with no sheet (U-48) | `src/components/category/MissingTranslationNote.tsx:27`, `src/components/layout/PageTitle.tsx:31` | DR-401, U-48 | tweak after checkpoint 3 || green |

## Flags

None open. CF-06 band colour (U-50): tajmin approved `surface` (28 Oct 2026).
