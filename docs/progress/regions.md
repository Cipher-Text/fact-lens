# regions progress

Branch `page/regions` · Brief `docs/briefs/regions.md` · Issue IMP-18 (`/regions` part) · Started 4 Nov 2026

This file is the memory of the work. tajmin clears the context often; a new session knows only what this file, the brief and the code say. The session-start hook prints the "Now" section and the last log entry on this branch.

## How to keep it

- Update it **before you stop**: after each checkpoint, after each batch of tajmin's tweaks, and before a long command or a question to tajmin. Do not wait for "next".
- Write everything the work adds, changes or decides, also what is not a spec item: files, components, props, tokens, CSS classes, strings (`bn.ts` and `en.ts`), mock data, tests, renames, removed code, helpers.
- Name the code by `file` and symbol (component, function, token, class). Do not write line numbers: they move. `/checkpoint` adds them in the spec log.
- Write tajmin's words for each decision and tweak, with the date. "Next" or "go on" is not an approval (`AGENTS.md` Section 8).
- If a later step undoes an earlier one, change the earlier entry and say so. The file says what is true now.
- At the final checkpoint, `/checkpoint` makes the spec log and the spec updates from this file.

## Now

- State: committed (93875b4, 3b555ed) and pushed; PR 27 to `dev` open. Second review fixes made, waiting for tajmin's commit yes
- Next step: on tajmin's yes, commit the review fixes on `page/regions` and push; then tajmin's merge. RG-09 stays an open flag (DOC-61)
- Open questions to tajmin: the page title is অঞ্চলসমূহ / Regions (the nav label, DR-345), not অঞ্চল as the brief says. DOC-61 is a flag for the spec log
- Uncommitted: the PR 27 review fixes (see the last log entry)

## Decisions

| Date | Decision | Source |
| --- | --- | --- |
| 4 Nov 2026 | Page: summary line below the title as on the analysis hub; hero: one cover overlap card and a Latest rail; regions: the grouped categories layout, every region gets a column; no More stories | tajmin: "Summary: A little one line summary below page title, just like analysis hub. Hero: 1 lead overlap card and latest rail. Regions: use grouped categories layout. all regions should get a colum. no rail. No more stories section" |
| 4 Nov 2026 | URL `/regions`, `/en/regions`, build time; অঞ্চল / Regions current nav item. Description বিশ্বের প্রতিটি অঞ্চলের খবর ও বিশ্লেষণ / News and analysis from every region of the world | tajmin: "1, 2 = ok" |
| 4 Nov 2026 | Latest rail: the newest stories with any region; no MoreLink to `/latest` | tajmin: "latest story with any region. there will be no latest link" |
| 4 Nov 2026 | The cover story is an editorial decision: any mock story | tajmin: "its an editorial decision. you dont need to worry. just put any mock story there." |
| 4 Nov 2026 | The regions section uses the rail (`WithRail`), replacing "no rail" | tajmin: "6. use rail." |
| 4 Nov 2026 | One CategoryBlock per region, 7C.2 order, `format` Eyebrow, MoreLink to `/regions/<slug>`; mock stories so all 8 regions show, code keeps the 7.3 rule | tajmin: "7 and = ok" (read as 7 and 8) |
| 4 Nov 2026 | Repeats across the page: backend and editorial decision; no de-duplication logic in the mock | tajmin: "again, backend and editorial decision." |
| 4 Nov 2026 | Ads: ad-top, ad-band after the cover, one ad-inset at most after the second region row (DR-447). Superseded 5 Nov 2026: no ad-inset; a full-width ad-band between region groups | tajmin: "10. ok" |
| 5 Nov 2026 | The regions in groups of 4: each group 2 rows of 2 blocks with its own rail ad; a full-width ad-band between the groups; no ad-inset | tajmin: "make smaller chunks of the regions. 4 regions + 1 ad rail = 1 group then full width ad-band. then again 4 regions and 1 ad rail." |
| 4 Nov 2026 | IMP-125 (story role names, DR-450) is fixed in this run. Superseded 5 Nov 2026: IMP-125 merged on `dev` (PR #25, #26), so it left this run | tajmin: "plan IM-125 fix in this run as well."; 5 Nov: "the dev branch has moved a lot ... revise the brief for regions hub" |
| 5 Nov 2026 | The cover is OverlapCard `large`, laid out as `CategoryCoverSection` without the card rows (N-06: a cover takes `large`; LeadStory is the homepage lead only). Rail StoryList `columns={2}`. Region block first story is StoryCard `top`. Type scale classes only (TYP-01) | Spec on `dev` (component-system 1.31 N-06, C-02, C-24; typography 2.25), brief revision |
| 5 Nov 2026 | Regions section rail: AdSlot `rail` only, no poll | tajmin: "yes only ad. no poll" |
| 5 Nov 2026 | Eyebrow on the page cards: news the category; analysis the category and the format (`two-part`). C-08 allows `two-part` on article pages only. Decided the same day: format · category (the article order), on the region hub only; spec-log item for C-08 (U-64 raised, then removed as decided) | tajmin: "eyebrow shows category and format both in case of analysis. for news, only category." |
| 5 Nov 2026 | `two-part` on the region hub cards: format · category, region hub only | tajmin: "Order is fine. scope: region only for now." |
| 5 Nov 2026 | Empty cases: a general reusable empty-state message, a new to-do issue U-63 (not built in this run) | tajmin: "create a message to be shown for empty cases in general. this can be reused in any empty part of the website where contents eventually will show up later. this message/component can be a new todo issue." |
| 5 Nov 2026 | Homepage regions slider name: P-6, drop P-3b from the layout spec; flag DOC-61 | tajmin: "The slider is more accurate. Will drop layout's version of name. raise a flag." |
| 5 Nov 2026 | The 4 Nov stash is not needed (the brief and this file were restored from it); dropped | tajmin: "Do we need the stash files? If we need them then you can use them" |
| 5 Nov 2026 | Oceania stays empty in the mock: the hub shows 7 region blocks; the empty-region case (7.3) stays for the homepage and the hub. Replaces "all 8 regions" of the 7 and 8 decision | tajmin: "Keep it empty" |
| 5 Nov 2026 | Groups: 4 then the rest (4 + 3 now); as many groups and bands as the regions need; one rail ad per group | tajmin: "yes to all." |
| 5 Nov 2026 | The rule between the region blocks and the rail ad is Divider.column-inset (16px from the top and the bottom, as P-3), not column-full | tajmin: "one small change. use inset vertical margin" |
| 5 Nov 2026 | RG-06: drop the `two-part` Eyebrow; the region hub cards use the `format` mode (news the category, analysis বিশ্লেষণ / Analysis only). Replaces the two-part decisions above. RG-09 stays an open flag (DOC-61) | tajmin: "RG-06 drop the two-part eyebrow. use only format when its an analysis. RG-09 open flag. will fix later." |
| 4 Nov 2026 | No More stories; `main` ends with `space-section` | tajmin: "11. ok" |

## Log

### Brief revision (5 Nov 2026)

- `page/regions` fast-forwarded to `dev` 5dc5ada (type-scale PR #24, imp-125 PR #25, imp-125-followup PR #26); the brief and this file restored from the stash; `docs/STATUS.md` Now line set again.
- What changed for this page: IMP-125 removed from the brief (done); the cover uses OverlapCard `large` and the `CategoryCoverSection` layout; the `type-*` utilities are gone, use the scale classes (TYP-01); test files for IMP-125 removed.
- Gap found: component-system C-24 names the homepage regions slider P-6, layout 7.1 to 7.4 name it P-3b. Report as a `DOC-` row at the final checkpoint.

### Checkpoint 1: route, data, header, ad-top and title band (5 Nov 2026)

- Built: `/regions` and `/en/regions` with the header (Regions is the current item), `ad-top`, the PageTitle band with the description, and the footer. The cover and region sections come in checkpoints 2 and 3.
- Code: `src/app/[lang]/regions/page.tsx` (`generateMetadata`: title, description, hreflang bn and en, no robots; `RegionsRoute`). `src/components/region-hub/RegionsPageView.tsx` (`RegionsPageView`). New folder `src/components/region-hub/`, so it is not mixed up with the homepage `components/home/regions/`.
- Code: `src/content/types.ts` (`RegionsPage`: `lang`, `cover`, `latest`, `regions: RegionBlock[]`). `src/content/index.ts` (`getRegionsPage`, `REGION_BLOCK_STORIES` = 4; imports `regionIds`): stories with a region, no opinion, newest first; cover = the newest, `latest` = the next 5; each region the 4 newest of that region, no opinion; empty regions left out (7.3); repeats allowed (tajmin, 4 Nov 2026).
- Code: `src/components/header/navItems.ts` (`getNavItems`): the Regions item has `current: path === "/regions"`; NavBar and Drawer already show `aria-current` on a parent item.
- Strings: `regionsPage` in `bn.ts` and `en.ts`: `cover` প্রধান খবর / Main story, `latest` সর্বশেষ / Latest, `description` বিশ্বের প্রতিটি অঞ্চলের খবর ও বিশ্লেষণ / News and analysis from every region of the world. The page title reuses `regionsSection.title` অঞ্চলসমূহ / Regions.
- Mock data: new `src/content/region-stories.ts` (`regionStories`, added to `stories` in `stories.ts`): Russia 4 (3 news, 1 analysis; 3 with an image), Americas +1 analysis, Middle East +1 news. Counts now: Americas 4, Europe 4, Russia 4, Middle East 4, South Asia many, China 4, Asia 8, Oceania 0. Comments in `homepage.ts` and `stories.ts` now say only Oceania is empty.
- Decided (tajmin, 5 Nov 2026: "Keep it empty"): Oceania stays empty. The brief says all 8 regions get 4 or more stories, but the mock-content skill asks for one region with no stories, and the homepage tests rely on Oceania being empty (`content.test.ts` "getHomepage full" and "sparse"). With Oceania empty the hub shows 7 blocks: the last row has one block that keeps its size (P-3, 7.3) and the 7.3 rule is exercised. To show 8: add 4 Oceania stories and move the homepage empty-region case to another place.
- Mock text: "two fixed shipments" became "two scheduled shipments": the raw-value hook read the word "fixed" as a sticky/fixed position (false positive).
- Tests: `src/app/[lang]/regions/metadata.test.ts` (new); `src/content/content.test.ts` "getRegionsPage" (cover and rail newest first, 5 rail stories, no opinion, 7 blocks in the 7C order, 4 stories each).
- Checks: `pnpm typecheck` passed, `pnpm test` 371 passed, `pnpm lint` clean. Browser: `/regions` and `/en/regions` show h1, description, the current nav item, `ad-top`, hreflang alternates; no console errors.
- New tokens: none. New components: `RegionsPageView` (page view, no sheet).
- Rules used: TYP-03, LAY-12, N-05, N-06, DR-269, DR-295, DR-345.
- Gaps and flags: none new.

### Checkpoint 2: cover section and Latest rail (5 Nov 2026)

- Built: `RegionsCoverSection` under the title band: the cover as OverlapCard `large` with the Eyebrow, and the Latest rail (SectionHeading সর্বশেষ / Latest, 5 stories, category and time, no MoreLink).
- Code: new `src/components/region-hub/RegionsCoverSection.tsx` (`RegionsCoverSection`): laid out as `CategoryCoverSection` without the card rows; `Shell as="section"`, hidden `h2` `regionsPage.cover`; wrapper `OverlapCard` with `eager`, `large`, `eyebrowMode="two-part"`; `Rail data-regions-rail` with `StoryList columns={2} meta="category-time"`; with no Latest stories the wrapper spans the shell.
- Code: `RegionsPageView`: PageTitle takes `mb-(--space-module)`; renders the cover when `page.cover` exists.
- Code: `src/components/story/Eyebrow.tsx`: the `EyebrowMode` comment says `two-part` is for article pages and the region hub cards (tajmin, 5 Nov 2026). No code change: `two-part` already shows the category only on news.
- Mock choice: `getRegionsPage` takes as the cover the newest region story **with an image** (the newest, "exports-september", has none and showed the grey placeholder); the rail is the 5 newest of the others. Cover today: "river-data-framework" (news, Geopolitics). The test checks the cover has an image and is not in the rail.
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test` (371 passed). Browser at 1280, 768, 360: rail beside the cover from 1024, under it with 2 columns at 768, 1 column at 360; no horizontal scroll.
- New tokens: none. New components: `RegionsCoverSection` (page section, no sheet; uses C-02, C-03, C-08).
- Rules used: N-06, DR-451 (cover `large`), DR-91, LAY-05, 7.3, C-08 `two-part` exception (tajmin).
- Gaps and flags: none new. The cover is a news story now, so the two-part Eyebrow does not show on it; the region blocks in checkpoint 3 show it on analysis stories.

### Checkpoint 3: ad band and the region blocks (5 Nov 2026)

- Built: after the cover, the `ad-band`, then `RegionsGroupedSection`: 7 region blocks (Americas, Europe, Russia, Middle East, South Asia, China, Asia; Oceania empty, not shown) in rows of two, one `ad-inset` before the third row, and the `ad-rail` from 1024 with Divider.column-full. Asia, the 7th block, is alone in the last row and keeps its half (7.3).
- Code: new `src/components/region-hub/RegionsGroupedSection.tsx` (`RegionsGroupedSection`, `INSET_ROW` = 2): laid out as `GroupedCategoriesSection` (reuses its exported `groupedRow`); `Shell as="div"`, `WithRail className={dividerColumn.rail}` (was `railFull`; tweak 5 Nov), wrapper `grid gap-y-(--space-module)`; `CategoryBlock` per region with `name="region-<id>"` (ids `category-region-<id>`), heading `t.regions[id]`, MoreLink `/regions/<id>`, `eyebrowMode="two-part"`; the inset shows before row 3 only when row 2 has an image story (DR-276); `Rail className="max-lg:hidden"` with `AdSlot rail` (as `AnalysisTopSection`).
- Code: `src/components/home/grouped/CategoryBlock.tsx`: new optional prop `eyebrowMode` (C-08 Eyebrow on the feature StoryCard and every list row; none when unset, so the homepage and the category page do not change).
- Code: `src/components/story/StoryList.tsx`: new optional prop `eyebrowMode`, passed to `StoryListItem` (it already had the prop; none when unset).
- Code: `RegionsPageView`: the cover takes `pb-(--space-module)` when region blocks follow; then `AdSlot band` (only with a cover) and `RegionsGroupedSection` with `pt-(--space-module)` after the band (LAY-12, LAY-13).
- Mock choice: each region block's feature story is the newest story of the region **with an image** (`imageFirst` in `src/content/index.ts`), then the next newest; 4 stories per block. Before it, Americas and Europe both had the image-less "exports-september" as their feature. Repeats across blocks stay (editorial decision).
- Two-part Eyebrow shows on the analysis stories in Americas, Russia, China and Asia (format · category).
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test` (371 passed). Browser bn at 1280 and en at 1280, 1024, 768, 600, 360: no horizontal scroll; the rail ad shows at 1024 and 1280, not at 768; order title band, cover, ad-band, regions; on phones the inset comes after the 4th block (A, B, ad, C, D as P-3); no console errors.
- New tokens: none. New components: `RegionsGroupedSection` (page section, no sheet). New props: `CategoryBlock.eyebrowMode`, `StoryList.eyebrowMode` (spec-log items for C-23 and C-03 at the final checkpoint).
- Rules used: LAY-05, LAY-07, LAY-09 to LAY-14, DR-276, DR-447, AN-11 (rail ad from 1024), 7.3.
- Gaps and flags: none new.

### Tweak: region groups of 4 (5 Nov 2026)

- tajmin: "make smaller chunks of the regions. 4 regions + 1 ad rail = 1 group then full width ad-band. then again 4 regions and 1 ad rail."
- Now: title band, cover, ad-band, group 1 (Americas, Europe, Russia, Middle East + rail ad), ad-band, group 2 (South Asia, China, Asia + rail ad; Asia alone in its row, half width). The ad-inset is gone.
- Code: `RegionsGroupedSection.tsx`: `REGIONS_PER_GROUP` = 4 and `regionGroups()` (exported; the last group holds the rest); the section renders one group, rows of two, its own `Rail` with `AdSlot rail` (`max-lg:hidden`); `INSET_ROW` and the inset removed. `RegionsPageView`: maps the groups; an ad-band before each group (before the first only when the cover shows), `pt-(--space-module)` after a band, `pb-(--space-module)` on every group but the last (LAY-12, LAY-13).
- Confirmed by tajmin (5 Nov 2026: "yes to all."): groups fill in region order, 4 then the rest (7 regions: 4 + 3, Asia alone at half width); with any number of regions there are as many groups and bands as needed (9 regions: 4 + 4 + 1, 3 bands); each group has its rail ad, so the page has 2 rail ads from 1024.
- Ad density at 360 (DR-447, under 768): ad-top 124 + 2 bands 304 each = 732px of 8347px main, about 9%, under 30%.
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test` (371 passed). Browser at 1280: 2 groups, 2 rail ads; at 360 no horizontal scroll.

### Checkpoint 4: sparse cases and tests (5 Nov 2026)

- Sparse cases (in `RegionsPageView`, tested in the unit test): no Latest stories: the cover spans the shell; no cover: the first group follows the title band with no ad band; 4 regions or fewer: one group, one band; no regions: the cover is the last row with no bottom space; no stories at all: the title band only (the empty-state message is U-63, to do).
- Tests: new `src/components/region-hub/region-hub.test.tsx` (12 tests: page order, groups 4 + 3, LAY-12 spacing, the cover and rail, the blocks with the Eyebrow and links, a rail ad per group, the sparse cases, `regionGroups`, the Regions nav item current on `/regions` only). New `tests/e2e/regions-hub.spec.ts` (49 tests in Chromium: order, title, description, language; the Eyebrow news/analysis; layout at the 15 Section 13 widths: no scroll, no radius, rail beside or under the cover, 1 or 2 blocks per row, a rail ad per group from 1024 with the 624px reserve; ad density under 30% at 360; focus ring on every link; NavBar and Drawer current item; axe light and dark at 360 and 1280; 200 for both paths).
- Test changed: `tests/e2e/regions.spec.ts` `REGION_COUNT` 6 → 7: the homepage slider shows Russia now that Russia has mock stories (the constant counts the mock regions; the comment named আফ্রিকা, a region no longer in the list). No assertion loosened.
- `header.spec.ts` and `url-format.spec.ts` not changed: the current Regions item is tested in `regions-hub.spec.ts` and the unit test; url-format has no `/regions` 404 case; the 200 check is in `regions-hub.spec.ts`.
- Checks: `pnpm test` 383 passed; Chromium `regions-hub.spec.ts` 49 passed; `grouped`, `category`, `regions`, `hero`, `header`, `url-format` specs passed after the `REGION_COUNT` fix (`regions.spec.ts` 75 passed).

### Tweak: inset rail rule (5 Nov 2026)

- tajmin: "one small change. use inset vertical margin"
- Read as the column rule between the region blocks and the rail ad: `RegionsGroupedSection` uses `dividerColumn.rail` (Divider.column-inset, 16px from the top and the bottom, as the homepage P-3), not `dividerColumn.railFull`. The unit test checks `divider-column-rail` and no `divider-column-full`.
- Checks: region hub unit tests 12 passed; browser at 1280: the rule `::after` top 16px, bottom 16px, 1px wide.

### Final checkpoint (5 Nov 2026)

- `pnpm check`: lint, typecheck, 383 unit tests, build (`/bn/regions`, `/en/regions` static) passed.
- Full Chromium e2e (`pnpm test:e2e:chromium`, 5 Nov 2026): 1038 passed, 0 failed. It ran before the reviewer fixes (a comment move and an import move, no behavior change); unit tests, lint and typecheck ran again after them.
- Spec log `docs/spec-log/regions.md`: RG-01 to RG-09. design-reviewer (5 Nov 2026): pass, no blockers; RG-01 to RG-05, RG-07, RG-08 green; RG-06 and RG-09 Changed rule flags (RG-09's place list was short, now complete).
- Reviewer notes fixed: the string-table comment for `analysisPage` sat above `regionsPage` (bn.ts, en.ts; `regionsPage` has its own comment now); `Fragment` import moved to the top of `RegionsPageView.tsx`; RG-05 states one `ad-rail` per group (layout Section 9).
- Specs written (green items): layout 2.37 (Section 7G new; 7C.2 Region hub row; Section 9 one `ad-rail` per region group; changelog), component-system 1.32 (Section 3 region hub sections; C-03 and C-23 `eyebrowMode`; C-23 on the region hub; C-18 and C-19 Regions current; Section 8 hubs built), agent-contract 2.28 (Sections 1, 3, 5).
- STATUS Now and ISSUES (IMP-18 `/regions` part fixed, IMP-14, DOC-61) updated.

### After the final checkpoint: format Eyebrow (5 Nov 2026)

- tajmin: "RG-06 drop the two-part eyebrow. use only format when its an analysis. RG-09 open flag. will fix later."
- Code: `RegionsCoverSection` and `RegionsGroupedSection` pass `eyebrowMode="format"` (was `two-part`); their comments say so. `src/components/story/Eyebrow.tsx` is back as on `dev` (its comment no longer names the region hub).
- Tests: `region-hub.test.tsx`: analysis rows link the Eyebrow to `/en/analysis` only, one link per Eyebrow, no separator. `regions-hub.spec.ts`: "the format Eyebrow: news the category, analysis only Analysis": one Eyebrow link per card, `/analysis` or a category, no separator.
- Docs: spec log RG-06 is now a Reuse, green; RG-09 an open flag. Specs: layout 7G.1 and component-system (Section 3, C-23 region hub) name the `format` Eyebrow; agent-contract Section 3 row; STATUS; ISSUES DOC-61 quotes tajmin.
- Checks (affected tests only, tajmin: "run only affected tests for this change"): region hub unit tests 12 passed; Chromium `regions-hub.spec.ts` 49 passed; lint and typecheck.

### PR 27 review fixes (5 Nov 2026)

- Review (claude bot): two stale `two-part` comments; the no-cover case drops the Latest rail; the brief is out of date; is the full e2e current.
- tajmin: "A: keep, document" (no cover: no cover section and no Latest rail, as the category page).
- Code: `CategoryBlock.tsx` and `StoryList.tsx` comments say `format` (RG-06); `getRegionsPage` comment documents the no-cover case.
- Tests: `region-hub.test.tsx` "no cover" also checks that no Latest rail shows.
- Docs: spec log RG-02 names the no-cover case; the brief has a "Changed in the build" note.
- Full e2e: the 1038-pass run came after the last `src/i18n/` change; the Eyebrow change after it touched only the region hub components and tests.

### PR 27 second review (5 Nov 2026)

- Review (claude bot): the 7 region MoreLinks go to `/regions/<slug>`, a 404 until the region page; a long comment line in `RegionsGroupedSection`; the `CategoryBlock` comment says the feature story has no eyebrow.
- tajmin: "this will be fixed when region page is built. add an todo in the issues. and address the other comment".
- Docs: ISSUES IMP-128 (to do with the region page: every region link opens its page, plus an e2e), ISSUES 1.14.
- Code: `RegionsGroupedSection` comment re-wrapped and names IMP-128; `CategoryBlock` comment says no eyebrow unless the page sets `eyebrowMode` (RG-07). Comments only.
