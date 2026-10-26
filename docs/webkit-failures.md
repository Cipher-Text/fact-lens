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

### R4-03 (17 October 2026)

Run: `pnpm exec playwright test --project=webkit` on the ticket's test files (`hero`, `analysis-opinion`, `featured`, `grouped`, `most-read`, `story-units`, `small-parts`, `page`) on `prototype-run-4`. 26 failed, 333 passed. 15 are known: group C keyboard (10: `analysis-opinion`, `featured`, `grouped`, `hero`, `most-read`, bn and en), group E focus outline (2), group A English layout at 1280 and wider (3: `featured` 1280, `grouped` 1366 and 1920; these rows change from run to run). 11 are new:

| ID | Importance | File | Test | Lang | Error |
| --- | --- | --- | --- | --- | --- |
| W4-07 | Medium | `hero.spec.ts:50` | layout at 768, 834 and 1023 | bn, en | The second Latest column starts 1 to 3px below the first (`1442` / `1439`). The Latest list is now CSS columns with a column break (DR-350). In WebKit the offset shows only when the column-start item has 0 padding and the other items have a fractional padding (16.43px); with a 16px padding on every item it is 0. Chromium is exact (6 tests) |
| W4-08 | Medium | `story-units.spec.ts:182` | StoryList: one column, two column-first from 768 to 1023 | bn, en | Same as W4-07 (2 tests) |
| W4-09 | Low | `small-parts.spec.ts:102` | Divider.item space: 16px to the ink … at 360, 768 and 1280 | bn | Most read only: 12 to 14px above the rule (Chromium 13 to 15). WebKit draws the Bangla rank digits and titles a little higher. Every other list is in range (3 tests) |

A first WebKit run found two more causes, both fixed: the trimmed meta margin collapsed out of its item across the column break (fixed with `display: flow-root` on Divider.item), and the pixel scan read a rule that WebKit snaps to the row above a fractional top (the scan now finds the rule within 1 row). R4-05 checks the Latest columns and the item rule space in real Safari.

### R4-04 (17 October 2026)

Run: `pnpm exec playwright test --project=webkit` on the ticket's test files (`hero`, `regions`, `grouped`, `header`, `footer`, `featured`, `story-units`, `site`, `page`) on `prototype-run-4`. 38 failed, 431 passed. 35 are known: group C keyboard (featured, footer, grouped, hero, regions: 10), SkipLink (2), drawer keyboard (4), search keyboard (2), W4-01 to W4-04 (4), W4-07 and W4-08 (8), regions phone tabs (2), regions axe at 360 (2) and group A `grouped.spec.ts` "layout at 1920" on `/en` (1, page height). The ticket's new and changed checks (hero heading, regions heading, footer logo and year, P-2 order, search order, story time script size) pass in WebKit.

| ID | Importance | File | Test | Lang | Error |
| --- | --- | --- | --- | --- | --- |
| W4-10 | Low | `grouped.spec.ts:370` | poll: pressing vote with no choice does nothing | bn, en | The keyboard part passes (Enter and Space on the focused button: no change, focus stays). The mouse click part fails: after `click()` the button is not focused. Safari does not focus a button on a mouse click (platform default), so this is likely a test fact, not a page fault. Not checked in a real Safari |
| W4-11 | Low (flaky) | `footer.spec.ts:230` | hover and press states of links and icons, no underline (C-21, DR-220) | en | Failed once under parallel load; passed alone |

### R4-05 full run (17 October 2026)

Run: `pnpm exec playwright test --project=webkit` (full suite) on `prototype-run-4`.

- First run: 52 failed, 592 passed, 16 skipped.
- Test fixes in R4-05 (W3-09, W4-11, W4-12 below), then a second full run: **48 failed, 596 passed, 16 skipped**. Chromium: 660 passed before and after the fixes.
- Run 3 had 42. The 6 more are run 4 tests (W4-01 to W4-04, W4-07 to W4-10) less the families fixed here. No failure is in a new family.

#### IDs for the run 3 failures (DR-346 B6)

The run 3 list (run 3 report, git history at `c2621c5`) and the run 2 groups above get one ID per family. "Safari" is the real Safari check (macOS and iOS); tajmin runs it (checklist in the run 4 report, git history at `c2621c5`). A failure that shows in Safari is a code fix; one that does not is a test fix.

| ID | Family (run 2 group) | Tests now | Result in R4-05 | Safari |
| --- | --- | --- | --- | --- |
| W3-01 | Tab key reaches no link (C): `analysis-opinion`, `featured`, `footer`, `grouped`, `hero`, `most-read`, `regions` keyboard tests | 14 | Open. Safari default: Tab skips links unless "Press Tab to highlight each item" is on | Pending |
| W3-02 | SkipLink is not the first Tab stop (`header.spec.ts:425`) | 2 | Open. Same cause as W3-01 likely (the SkipLink is a link) | Pending |
| W3-03 | Drawer works with the keyboard at 360 and 1280 (`header.spec.ts:471`) | 4 | Open | Pending |
| W3-04 | Search dialog works with the keyboard from 768 (`header.spec.ts:702`) | 2 | Open | Pending |
| W3-05 | Theme change in one tab applies in the other tab (`header.spec.ts:913`, storage event, DR-340) | 2 (bn and en; run 3 had bn only) | Open. Fails 6 of 6 alone: the second tab's `html` gets no `dark` class | Pending |
| W3-06 | Phone tabs: arrow keys, Home and End (D, `regions.spec.ts:450`) | 2 | Open | Pending |
| W3-07 | Regions axe at 360, `scrollable-region-focusable` (`regions.spec.ts:579`) | 3 (bn light, bn dark, en dark; the theme changes from run to run) | Open | Pending |
| W3-08 | Focus outline values on MoreLink and Eyebrow (E, `small-parts.spec.ts:229`) | 2 | Open. Check that the ring shows | Pending |
| W3-09 | Page height or spacing differs at 1280 and wider, English only (A) | 0 | **Test fix.** Not font metrics: the difference is one nav row (48px in run 2, 44px now). The server HTML of the nav row wraps until hydration hides the items that do not fit (IMP-16); WebKit hydrates later, so the tests read the boxes on each side of the shift. New helper `tests/e2e/settle.ts` `waitForNavRow` (the wait `ads.spec.ts` and `header.spec.ts` already had) in the layout tests of `hero`, `featured`, `most-read`, `analysis-opinion`, `grouped` and the `ads` reserve test. No expected value changed | Not needed (the shift at hydration is IMP-16, same in every browser) |
| W3-10 | Poll radio cannot be set (B) | 0 | Passes since run 3 (not in the run 3 list) | Vote check in the checklist |
| W3-11 | Footer hover and press (run 3 "hover and press timeout") | 0 | **Test fix**, see W4-11 | Not needed |

#### Run 4 IDs: results

| ID | Tests now | Result in R4-05 | Safari |
| --- | --- | --- | --- |
| W4-01 to W4-04 | 4 | Open. Tab reaches 2 of the 4 bar controls (likely the link, as W3-01; not checked which) | Pending |
| W4-05, W4-06 | 0 | Passed in both full runs (flaky under load) | Sticky check in the checklist |
| W4-07, W4-08 | 8 | Open. Second Latest column 1 to 3px lower (CSS columns, fractional item padding) | Pending (look at the Latest columns at 768 to 1023) |
| W4-09 | 3 | Open. Most read Bangla: 12 to 14px above the rule (range 15 to 17) | Pending (item rule space by eye) |
| W4-10 | 2 | Open. Safari does not focus a button on a mouse click | Pending |
| W4-11 | 0 | **Test fix.** Not flaky: it failed 6 of 6 alone. `mouse.down` and `mouse.up` on the footer nav link make a click; the link opens `/en/about` (404) and the next target leaves the DOM. The test now stops the click from leaving the page; the hover and pressed checks are the same | Not needed |

#### New in R4-05

| ID | Importance | File | Test | Lang | Result |
| --- | --- | --- | --- | --- | --- |
| W4-12 | Medium | `grouped.spec.ts:405` | poll results: own vote filled and named, fills follow the percents | en | **Test fix.** The rail ad Y read before the vote was 44px lower than after (5834 / 5790): the same nav row race as W3-09, not the vote. A probe read 5790 before, 0.3s and 1.8s after the vote in WebKit. The test now waits for the nav row (`waitForNavRow`) |

## Run 5

### R5-01 checkpoint 2 (18 October 2026)

Run: `pnpm exec playwright test --project=webkit` on the files that checkpoint 2 changed or checks (`page`, `analysis-opinion`, `motion`, `small-parts`) on `production-run-5`. 7 failed, 117 passed. 6 are known families: W3-01 (`analysis-opinion.spec.ts:240` keyboard, bn and en), W3-08 (`small-parts.spec.ts:229`, bn and en), W4-09 (`small-parts.spec.ts:102`, bn at 360 and 1280). The new border, P-4 gap and motion tests pass in WebKit.

| ID | Importance | File | Test | Lang | Error |
| --- | --- | --- | --- | --- | --- |
| W5-01 | Low | `small-parts.spec.ts:102` | Divider.item space: 16px to the ink … at 768 | en | Most read only: item 33 is 12px above the rule (range 13 to 19). Same family as W4-09 (WebKit draws the rank digits and titles higher), now in English at 768; Bangla at 768 passes. The ink values did not change in checkpoint 2 (only the token names, DR-355) |

### R5-01 checkpoint 3 (18 October 2026)

Run: `pnpm exec playwright test --project=webkit` on the checkpoint's test files (`header`, `site`, `page`) on `production-run-5`. 18 failed, 133 passed. 14 are known families: W3-02 (SkipLink, bn and en), W3-03 and W3-04 (drawer at 360 and 1280, search dialog; bn and en), W3-05 (storage event, bn and en), W4-01 to W4-04 (ghost buttons and the language link, light and dark, bn and en). The new focus-scroll, band, logo and language-link tests pass in WebKit.

| ID | Importance | File | Test | Lang | Error |
| --- | --- | --- | --- | --- | --- |
| W5-02 | Low (keyboard) | `header.spec.ts:1271` | NavBar is one row from the server HTML: no shift at hydration at 1280 and 1440 | bn, en | The height, `main` top and CLS parts pass; the Tab-order part reaches no NavBar link (expected the 8 or 9 shown links, got none). Same family as W3-01 (Safari Tab skips links by default) |

### R5-01 checkpoint 4 (18 October 2026)

Run: `pnpm exec playwright test --project=webkit` on the checkpoint's test files (`hero`, `small-parts`, `header`) on `production-run-5`. 29 failed, 158 passed. Every failure is a known family: W3-01 (hero keyboard, bn and en), W3-02 (2), W3-03 and W3-04 (6), W3-08 (2), W4-01 to W4-04 (4), W4-07 (hero layout at 768, 834 and 1023, bn and en: 6), W4-09 (bn at 360 and 1280), W5-01 (en at 768), W5-02 (4). No new ID. The new Latest column rule test passes in WebKit. W3-05 (storage event) passes in WebKit after the IMP-86 test fix (it failed in checkpoint 3).

## Not checked

- Whether each failure is new since R2-13. The old progress file (git history at `c2621c5`) only gives counts (40 at R2-12, 5 regions at R2-13), not names.
- The Safari causes above (groups B, C, E) are my reading of the errors. None is confirmed in a real Safari.

### R5-02 full run (18 October 2026)

Run: `pnpm exec playwright test --project=webkit` (full suite) on `production-run-5` at `c58d670`. **51 failed, 619 passed, 16 skipped** (5.0 min). Run 4 (R4-05): 48. Every failure is a known family; no new ID.

| ID | Tests now | Run 4 | Change |
| --- | --- | --- | --- |
| W3-01 | 14 | 14 | Same |
| W3-02 | 2 | 2 | Same |
| W3-03 | 4 | 4 | Same |
| W3-04 | 2 | 2 | Same |
| W3-05 | 0 | 2 | Passes after the IMP-86 test fix (R5-01 checkpoint 4) |
| W3-06 | 2 | 2 | Same |
| W3-07 | 4 | 3 | bn and en, light and dark at 360 this time (the theme changes from run to run) |
| W3-08 | 2 | 2 | Same |
| W4-01 to W4-04 | 4 | 4 | Same |
| W4-07 | 6 | 6 | Same (hero layout at 768, 834 and 1023, bn and en) |
| W4-08 | 2 | 2 | Same |
| W4-09 | 2 | 3 | bn at 360 and 1280 |
| W4-10 | 2 | 2 | Same |
| W5-01 | 1 | – | R5-01 (en at 768, Most read) |
| W5-02 | 4 | – | R5-01 (NavBar Tab order, W3-01 family) |
| Total | 51 | 48 | +5 new R5-01 tests (W5-01, W5-02), +1 W3-07, −2 W3-05, −1 W4-09 |

#### Real Safari (A11Y-24)

tajmin ran the checklist in the run 5 report (git history at `c2621c5`) on macOS Safari and iOS Safari on 18 October 2026, against the production build. Every item passed except the Tab step of item 1 (IMP-92). So every WebKit failure below is a test fault of Playwright WebKit, not a fault readers see (no code fix).

| ID | Checklist item | macOS Safari | iOS Safari | Result |
| --- | --- | --- | --- | --- |
| W3-01, W5-02 | 7 | Pass | – | Test fault |
| W3-02 | 7 | Pass | – | Test fault |
| W3-03 | 5 | Pass | Pass | Test fault |
| W3-04 | 5 | Pass | Pass | Test fault |
| W3-05 | 8 | Pass | Pass | Passes in WebKit too |
| W3-06 | 9 | – | Pass | Test fault |
| W3-07 | 9 | – | Pass | Test fault |
| W3-08 | 10 | Pass | – | Test fault |
| W4-01 to W4-04 | 7 | Pass | – | Test fault |
| W4-07, W4-08 (IMP-88) | 6 | Pass | Pass | Test fault; no rounding (IMP-88 Closed) |
| W4-09, W5-01 | 6 | Pass | Pass | Test fault |
| W4-10 | 11 | Pass | Pass | Test fault |
| (no WebKit ID) | 1: Tab from an option to the vote button | Fail | Pass | IMP-92, Open, low priority (tajmin) |

A11Y-24 is closed; the one open item is IMP-92. The run 6 test strategy (TS-01 to TS-09, DR-360) decides how the WebKit test faults are fixed.
