# imp-125-followup spec log

Branch `task/imp-125-followup` · Follow-up to IMP-125 (spec log imp-125, IM-01 to IM-11) · Decisions DR-464 to DR-470 (tajmin, 4 Nov 2026: "All yes") · Started 5 Nov 2026

This log keeps what the work changes in the specs. Open code items are rows in `docs/ISSUES.md`. After the merge, the log stays as the record of what the work changed in the specs (`AGENTS.md` Section 9, step 6).

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
| FU-01 | Changed rule | StoryCard `side`: the image column is 2 / 3 of the whole card width, no minimum and no maximum; the text takes the rest minus `--grid-column-gap`. `grid-template-columns: minmax(0, 1fr) calc(100% * var(--story-side-media-share))`. `--story-side-media-min` (420px) removed; the share token, the 17.5rem stack (DR-308) and the stacked look under 768 stay. Fixes U-62 | `src/styles/components.css:32`, `src/styles/components.css:246` | CPT-07, DR-451, DR-464 | tajmin, 4 Nov 2026: "All yes" (DR-464) | Green |
| FU-02 | Changed rule | StoryCard `side` with `large`: the cover title drops `text-balance`; `story-side` wraps it pretty. OverlapCard `large` and LeadStory keep `text-balance`. TYP-13 exception covers `large` | `src/components/story/StoryCard.tsx:72` | TYP-13, DR-468 | tajmin, 4 Nov 2026: "All yes" (DR-468) | Green |
| FU-03 | Changed rule | Data keys by role (N-06): `FeaturedSection.lead` to `feature` (types, homepage plans, `getHomepage`, FeaturedCategorySection); `AnalysisPage.lead` to `cover` (types, `getAnalysisPage`, AnalysisPageView). `HeroContent.lead` stays | `src/content/types.ts:81`, `src/content/types.ts:167`, `src/content/index.ts:152`, `src/content/index.ts:292` | N-06, DR-465 | tajmin, 4 Nov 2026: "All yes" (DR-465) | Green |
| FU-04 | Changed rule | English category cover hidden name: `categoryPage.cover` is "Main story" (was "Top story"). Bangla প্রধান খবর stays. component-system Section 3 names it | `src/i18n/en.ts:55` | T-27, N-06, DR-469 | tajmin, 4 Nov 2026: "All yes" (DR-469) | Green |
| FU-05 | Reuse | Spec text: layout 7B.1 Formats says "the cover story"; 7.2 P-2 and 7F drop the 420px minimum; component-system C-24 `side` row, P-2 featureStory rows and Section 6 `story-side` CSS match FU-01. N-06 stays as written (DR-466) | `docs/design-system/spacing-layout-system.md:257`, `docs/design-system/component-system.md:687` | N-06, DR-464, DR-466 | tajmin, 4 Nov 2026: "All yes" (DR-464 to DR-470) | Green |
| FU-06 | Reuse | C-24 places table: `top` adds the category page analysis block (`CategoryFormatsSection`, CategoryBlock first story) and names the P-6 region first story at every width | `src/components/category/CategoryFormatsSection.tsx`, `src/components/home/regions/RegionsSection.tsx:58` | CPT-02, DR-459 | tajmin, 4 Nov 2026: "All yes" (DR-464 to DR-470) | Green |
| FU-07 | Reuse | Names in comments and AGENTS.md: AnalysisList rows are StoryCard `thumbnail`, 3:2, list title (was "row, 16:9, sm"); AGENTS.md Section 5 names `CategoryCoverSection` and `AnalysisCoverSection` | `src/components/home/analysis/AnalysisList.tsx:20`, `AGENTS.md:83`, `AGENTS.md:85` | N-05, DR-450 | tajmin, 4 Nov 2026: "All yes" (DR-464 to DR-470) | Green |
