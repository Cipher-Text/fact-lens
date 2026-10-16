# WebKit e2e failures

Measured on 11 October 2026 (R2-19) with `pnpm test:e2e --project=webkit` on branch `prototype-run-2`. Chromium has 561 passing tests and no failures. tajmin reviews this list later.

Counts: 40 failures in this run (the first full run in R2-19 had 35). The layout rows (group A) differ between runs, so they are not stable. No test was skipped or weakened for these.

Importance: **High** = a reader function breaks. **Medium** = layout differs from Chromium. **Low** = keyboard or focus detail (lowest priority for now, tajmin 11 October 2026).

Languages: `/` is Bangla, `/en` is English.

## Summary

| Group | Category | Tests | Importance |
| --- | --- | --- | --- |
| B | Poll radio cannot be set (grouped) | 8 | High |
| A | Page height or spacing differs at 1280 and wider (English only) | 14 | Medium |
| E | Focus outline values differ (small parts) | 2 | Low |
| D | Phone tabs: arrow, Home and End keys (regions) | 2 | Low (keyboard) |
| C | Tab key reaches no link (Safari default) | 14 | Low (keyboard) |

## B. Poll radio cannot be set

Error: `locator.check: Clicking the checkbox did not change its state`. The radio is the native input with a drawn square marker (IMP-50). It may be a Playwright and WebKit issue, or a real Safari fault. Check by hand in Safari before deciding.

| # | Importance | File | Test | Lang |
| --- | --- | --- | --- | --- |
| 1 | High | `grouped.spec.ts:263` | axe in light theme, before and after the vote | bn |
| 2 | High | `grouped.spec.ts:263` | axe in dark theme, before and after the vote | bn |
| 3 | High | `grouped.spec.ts:372` | poll results: own vote filled and named, fills follow the percents | bn |
| 4 | High | `grouped.spec.ts:399` | poll: one vote per browser, then result bars | bn |
| 5 | High | `grouped.spec.ts:263` | axe in light theme, before and after the vote | en |
| 6 | High | `grouped.spec.ts:263` | axe in dark theme, before and after the vote | en |
| 7 | High | `grouped.spec.ts:372` | poll results: own vote filled and named, fills follow the percents | en |
| 8 | High | `grouped.spec.ts:399` | poll: one vote per browser, then result bars | en |

## A. Page height or spacing differs at 1280 and wider (English only)

The tests compare a measured height with the Chromium value. WebKit renders the English serif text a little shorter or taller (differences of 48px on whole sections). Likely font metrics, not a layout rule. The one row that is not a small difference is no. 2 to 4: the gap measured is -8 where 40 is expected (the P-4 section space), so check it by eye in Safari. Which tests fail changes from run to run.

| # | Importance | File | Test | Lang | Expected / received |
| --- | --- | --- | --- | --- | --- |
| 1 | Medium | `ads.spec.ts:88` | ad slots keep their reserved height at 1280, without the ad (LAY-10) | en | 435 / 387 |
| 2 | Medium | `analysis-opinion.spec.ts:68` | layout at 1280 | en | 40 / -8 |
| 3 | Medium | `analysis-opinion.spec.ts:68` | layout at 1440 | en | 40 / -8 |
| 4 | Medium | `analysis-opinion.spec.ts:68` | layout at 1920 | en | 40 / -8 |
| 5 | Medium | `featured.spec.ts` | layout at 1280 | en | 4066 / 4018 |
| 6 | Medium | `featured.spec.ts` | layout at 1366 | en | 4085 / 4037 |
| 7 | Medium | `featured.spec.ts` | layout at 1440 | en | 4085 / 4037 |
| 8 | Medium | `grouped.spec.ts:86` | layout at 1280 | en | 5257 / 5305 |
| 9 | Medium | `grouped.spec.ts:86` | layout at 1366 | en | 5276 / 5324 |
| 10 | Medium | `hero.spec.ts:50` | layout at 1366 | en | 1722 / 1674 |
| 11 | Medium | `hero.spec.ts:50` | layout at 1440 | en | 1722 / 1674 |
| 12 | Medium | `most-read.spec.ts:43` | layout at 1366 | en | 7642 / 7594 |
| 13 | Medium | `most-read.spec.ts:43` | layout at 1440 | en | 7642 / 7594 |
| 14 | Medium | `most-read.spec.ts:43` | layout at 1920 | en | 7642 / 7594 |

## E. Focus outline values differ

The test expects `2px solid` with `2px` offset on MoreLink and Eyebrow; WebKit reports other values (COL-13). Check in Safari that the ring shows.

| # | Importance | File | Test | Lang |
| --- | --- | --- | --- | --- |
| 1 | Low | `small-parts.spec.ts:121` | MoreLink and Eyebrow show the base focus outline (COL-13) | bn |
| 2 | Low | `small-parts.spec.ts:121` | MoreLink and Eyebrow show the base focus outline (COL-13) | en |

## D. Phone tabs: arrow, Home and End keys (regions)

| # | Importance | File | Test | Lang |
| --- | --- | --- | --- | --- |
| 1 | Low (keyboard) | `regions.spec.ts:375` | phone tabs: arrow keys, Home and End select a region | bn |
| 2 | Low (keyboard) | `regions.spec.ts:375` | phone tabs: arrow keys, Home and End select a region | en |

## C. Tab key reaches no link (Safari default)

Safari does not move focus to links with the Tab key unless the setting "Press Tab to highlight each item" is on (Option+Tab otherwise). The tests receive 0 stops. The fix is in the test (use Option+Tab on WebKit), not in the page.

| # | Importance | File | Test | Lang |
| --- | --- | --- | --- | --- |
| 1 | Low (keyboard) | `analysis-opinion.spec.ts:229` | keyboard: every link is reachable and shows the focus ring | bn |
| 2 | Low (keyboard) | `analysis-opinion.spec.ts:229` | keyboard: every link is reachable and shows the focus ring | en |
| 3 | Low (keyboard) | `featured.spec.ts:269` | keyboard: every link is reachable and shows the focus ring | bn |
| 4 | Low (keyboard) | `featured.spec.ts:269` | keyboard: every link is reachable and shows the focus ring | en |
| 5 | Low (keyboard) | `footer.spec.ts:285` | keyboard: every link is reachable in source order with the focus ring | bn |
| 6 | Low (keyboard) | `footer.spec.ts:285` | keyboard: every link is reachable in source order with the focus ring | en |
| 7 | Low (keyboard) | `grouped.spec.ts:467` | keyboard: every control is reachable, shows the focus ring and works | bn |
| 8 | Low (keyboard) | `grouped.spec.ts:467` | keyboard: every control is reachable, shows the focus ring and works | en |
| 9 | Low (keyboard) | `hero.spec.ts:318` | keyboard: every hero link is reachable and shows the focus ring | bn |
| 10 | Low (keyboard) | `hero.spec.ts:318` | keyboard: every hero link is reachable and shows the focus ring | en |
| 11 | Low (keyboard) | `most-read.spec.ts:275` | keyboard: every link is reachable and shows the focus ring | bn |
| 12 | Low (keyboard) | `most-read.spec.ts:275` | keyboard: every link is reachable and shows the focus ring | en |
| 13 | Low (keyboard) | `regions.spec.ts:540` | keyboard: every link in every region is reachable with the focus ring | bn |
| 14 | Low (keyboard) | `regions.spec.ts:540` | keyboard: every link in every region is reachable with the focus ring | en |

## Run 4 (new failures, by ticket)

Each new WebKit failure of a run 4 ticket gets an ID here. R4-05 checks them in real Safari and gives the run 3 failures their IDs.

### R4-01 (17 October 2026)

Run: `pnpm exec playwright test --project=webkit tests/e2e/header.spec.ts tests/e2e/site.spec.ts tests/e2e/regions.spec.ts` on `prototype-run-4`. 18 failed, 149 passed. 14 of the 18 are the run 3 failures in these files (SkipLink, drawer and search keyboard, theme storage event across tabs, regions phone tabs, regions axe in dark at 360, regions keyboard). 4 are new:

| ID | Importance | File | Test | Lang | Error |
| --- | --- | --- | --- | --- | --- |
| W4-01 | Low (keyboard) | `header.spec.ts:885` | ghost buttons and the language link: … focus ring in light | bn | Tab reaches 2 of the 4 bar controls (`seen.size` 2, expected 4) |
| W4-02 | Low (keyboard) | `header.spec.ts:885` | ghost buttons and the language link: … focus ring in dark | bn | Same |
| W4-03 | Low (keyboard) | `header.spec.ts:885` | ghost buttons and the language link: … focus ring in light | en | Same |
| W4-04 | Low (keyboard) | `header.spec.ts:885` | ghost buttons and the language link: … focus ring in dark | en | Same |

Size, ink, hover, pressed and no-wash checks pass in WebKit; only the Tab part fails. Likely group C (Safari Tab order without "Press Tab to highlight each item"); not checked in a real Safari.

### R4-02 (17 October 2026)

Run: `pnpm exec playwright test --project=webkit tests/e2e/motion.spec.ts tests/e2e/header.spec.ts tests/e2e/regions.spec.ts tests/e2e/ads.spec.ts` on `prototype-run-4`. 20 failed, 186 passed on the first run. `motion.spec.ts` (new) passes in WebKit.

- 1 was a test race, fixed in the test: `ads.spec.ts` "the top ad is below the header" read the nav row before the items that do not fit were hidden (IMP-16). It now waits for the 45px row, as the header test does. It passes in WebKit and Chromium.
- 19 are known: SkipLink (2), drawer keyboard (4), search keyboard (2), theme storage event across tabs (1, bn), regions phone tabs (2), regions keyboard (2), W4-01 to W4-04 (4), and regions axe at 360 (2). Regions axe at 360 is the run 3 `scrollable-region-focusable` failure; it shows in light or dark from run to run (light in `/` and `/en` this time, dark in R4-01).

Second run after the SiteHeader fragment fix (`motion`, `header`, `ads` specs): 15 failed, 120 passed. 13 are the known ones above. 2 are new and flaky:

| ID | Importance | File | Test | Lang | Error |
| --- | --- | --- | --- | --- | --- |
| W4-05 | Low (flaky) | `header.spec.ts:302` | site header sticks; past the nav row the row hides … at 1280 | en | Failed once under parallel load; passed 12 of 12 alone and in a second parallel run |
| W4-06 | Low (flaky) | `header.spec.ts:302` | site header sticks; past the nav row the row hides … at 1440 | en | Same |

R4-05 checks the sticky hide in real Safari.

## Not checked

- Whether each failure is new since R2-13. `PROGRESS.md` only gives counts (40 at R2-12, 5 regions at R2-13), not names.
- The Safari causes above (groups B, C, E) are my reading of the errors. None is confirmed in a real Safari.
