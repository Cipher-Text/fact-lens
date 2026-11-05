# region progress

Branch `page/region` · Brief `docs/briefs/region.md` · Issue IMP-128, IMP-18 (`/regions/<slug>` part) · Started 5 November 2026

This file is the memory of the work. tajmin clears the context often; a new session knows only what this file, the brief and the code say. The session-start hook prints the "Now" section and the last log entry on this branch.

## How to keep it

- Update it **before you stop**: after each checkpoint, after each batch of tajmin's tweaks, and before a long command or a question to tajmin. Do not wait for "next".
- Write everything the work adds, changes or decides, also what is not a spec item: files, components, props, tokens, CSS classes, strings (`bn.ts` and `en.ts`), mock data, tests, renames, removed code, helpers.
- Name the code by `file` and symbol (component, function, token, class). Do not write line numbers: they move. `/checkpoint` adds them in the spec log.
- Write tajmin's words for each decision and tweak, with the date. "Next" or "go on" is not an approval (`AGENTS.md` Section 8).
- If a later step undoes an earlier one, change the earlier entry and say so. The file says what is true now.
- At the final checkpoint, `/checkpoint` makes the spec log and the spec updates from this file.

## Now

- State: PR 28 open; the review fixes are made, not committed (5 Nov 2026)
- Next step: commit and push the PR 28 review fixes on tajmin's yes
- Open questions to tajmin: none
- Uncommitted: yes, `tests/e2e/region.spec.ts`, the brief, the spec log and this file (PR 28 review fixes)

## Decisions

| Date | Decision | Source |
| --- | --- | --- |
| 5 Nov 2026 | The region page `/regions/<slug>` with IMP-128; follow the topic and Latest page design and layout (7E, 7D) | tajmin: "region and the IMP-128. follow the tags/latest page design and layout." |
| 5 Nov 2026 | Page title: the region name as the `h1`, no label, no description, as the topic page | tajmin: "Yes, all defaults" |
| 5 Nov 2026 | Content: the region's news and analysis, newest first, no opinion, no repeats; the C-08 `format` Eyebrow on every row | tajmin: "Yes, all defaults" |
| 5 Nov 2026 | Ads: `ad-top` only; no `ad-band`, no rail ad | tajmin: "Yes, all defaults" |
| 5 Nov 2026 | Current nav item: the region's Drawer sub-item, and South Asia in the NavBar on `/regions/south-asia`; Regions is not current | tajmin: "Yes, all defaults" |
| 5 Nov 2026 | Every region in `regionIds` has a page; an empty region (Oceania) shows the title band only until U-63; below 3 stories `noindex, follow` (DR-432) | tajmin: "Yes, all defaults" |
| 5 Nov 2026 | Mock data unchanged: South Asia shows load more | tajmin: "Yes, all defaults" |
| 5 Nov 2026 | IMP-128: the region hub MoreLinks, the NavBar South Asia item, the Drawer region sub-items and the homepage P-2 featured region link open their pages, with e2e; IMP-14 and IMP-18 updated | tajmin: "Yes, all defaults" |
| 5 Nov 2026 | No link back to the region hub on the page | tajmin: "Yes, all defaults" |
| 5 Nov 2026 | Keep the two current links on `/regions/south-asia` (the South Asia row and its Regions child in the Drawer), keep 7H as its own section, keep the empty Oceania page as it is | tajmin: "no issues. keep them as it is. also keep ocenia as it is. commit and push everything" |

## Log

### Checkpoint 1: route, data, header, ad-top and the PageTitle band (5 Nov 2026)

- Built: `/regions/<slug>` and `/en/regions/<slug>` for every id in `regionIds`, static (`dynamicParams = false`); an unknown slug is a 404. The page: header, `ad-top`, PageTitle with the region name as the `h1`, `MoreStoriesSection`, footer. The list is already in (as the topic page), so checkpoint 2 only checks and tunes it.
- Code: `src/content/types.ts` (`RegionPage`: `lang`, `region`, `stories`); `src/content/index.ts` (`getRegionSlugs`, `isRegionId`, `getRegionPage`: the region's stories without opinion, newest first, from `getRegionStories`); `src/app/[lang]/regions/[slug]/page.tsx` (`generateStaticParams`, `generateMetadata`: title `t.regions[id]`, hreflang bn and en, robots from `topicRobots`, so below 3 stories `noindex, follow`); `src/components/region/RegionPageView.tsx` (`RegionPageView`, `SiteHeader path="/regions/<id>"`, PageTitle `id="region-title"`, `MoreStoriesSection labelledBy="region-title" section="region" eyebrow eyebrowMode="format"`); `src/components/more-stories/MoreStoriesSection.tsx` (`section` takes `"region"` too: `data-section="region"`).
- Reuse note: the robots rule reuses `topicRobots` and `TOPIC_INDEX_MIN_STORIES` in `src/lib/seo.ts` (same rule, DR-432); no rename.
- New tokens: none. New components: `RegionPageView` (page view, no sheet; built from the shared parts).
- Rules used: LAY-02, LAY-05, LAY-14, TYP-03, N-05, DR-411, DR-417, DR-432.
- Strings, mock data, tests: no new strings (the name is `t.regions[id]`); mock data unchanged; tests come at checkpoint 4.
- Browser check (dev server): `/en/regions/south-asia` h1 South Asia, 10 rows and the Button, category Eyebrow on news; `/regions/china` 4 rows, বিশ্লেষণ Eyebrow on the analysis row, no Button; `/regions/oceania` the title band only, `noindex, follow`, the language link keeps the region; `/en/regions/atlantis` 404. No console error. `pnpm typecheck` and `pnpm lint` clean.
- Gaps and flags: the empty region shows nothing below the band (U-63, open).

### Checkpoint 2: the list, load more and the sparse cases (5 Nov 2026)

- Built: no code change; the list from checkpoint 1 checked in the dev server.
- Widths 360, 600, 768, 1024, 1280: no horizontal scroll; the list in the wrapper column (360: 16 / 328; 768: 24 / 705; 1280: 24 / 1217, the row 881 wide). At 1280 the h1 and the first row sit at the same place and width as the Latest page (layout 7D.1), so the region page follows Latest and topic exactly.
- Load more (`/en/regions/south-asia`): 10, then 20 after one press; focus moves to the first added title; the Button stays while stories are left.
- Eyebrow: news rows the category, the analysis row বিশ্লেষণ / Analysis (`/regions/china`).
- Dark (`.dark` on `<html>`): tokens only, no fault seen. Bangla and English both checked.
- Sparse: `/regions/oceania` (0 stories) shows the title band, then `space-module` and `space-section` (48px at 600) before the footer, as an empty topic page; `/regions/china` (4) has no Button.
- Tweaks from tajmin: none yet.
- Gaps and flags: none new; the empty-state message stays U-63.

### Checkpoint 3: the current nav item and the IMP-128 links (5 Nov 2026)

- Built: on a region page the region's Drawer sub-item is current (`aria-current="page"`), and the Drawer opens the Regions accordion (the existing Drawer logic for a current child); on `/regions/south-asia` the NavBar and Drawer South Asia item is current too. Regions is current on the hub only.
- Code: `src/components/header/navItems.ts` (`getNavItems`: `current` on each region child, `path === "/regions/<id>"`, and on the `south-asia` item; the doc comment no longer calls the links 404s); `src/components/region-hub/RegionsGroupedSection.tsx` (comment: the MoreLink goes to the region page).
- Tests: `src/components/region-hub/region-hub.test.tsx` new case "the region sub-item and South Asia are current on their region page" (bn and en). `pnpm test`: 385 passed.
- IMP-128 check (dev server): every `/regions/<slug>` link on `/en/regions` (7 MoreLinks) and on `/` (the P-2 featured South Asia MoreLink, the NavBar South Asia item) returns 200; the Drawer on `/en/regions/china` at 768 shows China current with Regions open.
- Docs: `docs/ISSUES.md` IMP-14 (the region items go to their pages, current there), IMP-18 (`/regions/<slug>` part fixed; 404s stay for `/opinion` and stories with no text), IMP-128 (links fixed, e2e at checkpoint 4, then removed).
- Spec item for `/checkpoint`: layout 7G and 7C.2 say region pages are not built (7G intro); the new region page needs its section (7H, as 7E) and C-18 / C-19 the current region item.
- Tweaks from tajmin: none yet.

### Checkpoint 4: tests (5 Nov 2026)

- New: `tests/e2e/region.spec.ts` (bn and en: page order, h1, 10 rows; the format Eyebrow, no opinion, newest first; the 13 widths; load more with the keyboard and focus; sparse China 4 and Oceania 0 with noindex; the language link; the current nav items in the NavBar at 1280 and the Drawer at 360; IMP-128 every `/regions/<slug>` link returns 200; focus ring; axe light and dark at 360 and 1280; an unknown region 404). `src/app/[lang]/regions/[slug]/metadata.test.ts` (noindex below 3 stories, the title, hreflang).
- Changed: `src/content/content.test.ts` (block "region page": every region, no opinion, newest first, no repeats, South Asia over 10, Oceania empty, same ids in bn and en, unknown slug); `tests/e2e/header.spec.ts` (comment only: the region pages open). Brief change: the IMP-128 link check lives in `region.spec.ts`, so `regions-hub.spec.ts` and `featured.spec.ts` are unchanged.
- Runs: unit 3 files 109 passed; Chromium `region`, `regions-hub`, `featured`, `header`, `topic` specs: 322 passed.

### Final checkpoint (5 Nov 2026)

- `pnpm check`: lint and typecheck clean, 393 unit tests passed, build 58 static pages (16 region pages).
- Full Chromium e2e: 1088 passed, 1 failed: `latest.spec.ts` "load more adds 10, moves focus..." (focus not on the first added title) while the visual-qa agent drove the same dev server; `latest.spec.ts` rerun with `--repeat-each=3`: 153 passed. No code of the Latest list changed (only the `section` type union).
- visual-qa: region, topic and Latest pages at 320 to 1440, light and dark: no fault; the h1 and the list match the topic and Latest pages; the Drawer on `/en/regions/china` shows China current and Regions open.
- design-reviewer: pass, no blockers; RE-01 to RE-05 green. Note: on `/regions/south-asia` two links are current (the South Asia item and its Regions child), written into C-19.
- Spec log `docs/spec-log/region.md` RE-01 to RE-05; specs: layout 2.38 (7C.2, 7G, 7H new, 14.2, changelog), component-system 1.33 (Section 3, C-18, C-19, Section 8), agent-contract 2.29 (Sections 1, 3, 5).
- `docs/ISSUES.md` 1.15: IMP-128 fixed (remove the row after the merge), IMP-14, IMP-18, U-63 (names the empty region page).

### PR 28 review (5 Nov 2026)

tajmin: "Yes, fix both".

- `tests/e2e/region.spec.ts` IMP-128 test: the Drawer region links are now read from the open Drawer on `/regions/china` (the Regions group is open there), and must equal the 8 regions in the region order; before, the test added the list by hand.
- Brief "Test files": `regions-hub.spec.ts` and `featured.spec.ts` are not changed (the IMP-128 check lives in `region.spec.ts`); the change is noted in the brief.
- Spec log: RE-01 now names `page.tsx:13` (`generateStaticParams`) beside `:11`; RE-03 `MoreStoriesSection.tsx:27` (was `:28`). The other refs are correct.
- Notes kept, no change: two `aria-current` links on `/regions/south-asia` (C-19), the empty Oceania page (U-63).
- Runs: Chromium `region.spec.ts` 51 passed; lint and typecheck clean.
