# Prototype Run 4: Report

17 October 2026 · Branch `prototype-run-4` (from `main` at `0bebd07`) · Written in R4-05

## Result

| Check | Result |
| --- | --- |
| `pnpm check` | Pass (lint, typecheck, 243 unit tests, build; no warnings) |
| `pnpm test:e2e:chromium` | Pass, 660 tests, including axe (run 3: 591) |
| `pnpm test:e2e` WebKit (DR-289: a report, not a gate) | 48 failures, 596 pass, 16 skipped (run 3: 42). Before the R4-05 test fixes: 52 |
| `main` moved since the branch | No (`git fetch origin main`: `origin/main` is at `0bebd07`, an ancestor of the branch) |
| Real Safari (macOS and iOS) | Pending: tajmin runs the checklist below |
| After the merge | Pending: the PR and the merge wait for tajmin's go |

## Tickets

R4-00 to R4-04 are Done; see `docs/run-4-log.md` for dates, rounds, findings and commits.

| Ticket | Change |
| --- | --- |
| R4-01 | Ghost IconButtons, ThemeButton at every width, ThemeToggle and its tokens removed, `type-nav`, 44px NavBar row, TopBar is the header landmark |
| R4-02 | One motion (450ms `ease-slide`); sticky TopBar and NavBar, the NavBar hides past its row, logo transform; Drawer accordion with Collapsible |
| R4-03 | Divider.item space to the ink, 1px dots with a 2px gap, column-inset in P-4 and P-3, OpinionList rule on the text column, Latest MoreLink, Latest CSS columns |
| R4-04 | Hero শীর্ষ খবর, P-3b অঞ্চলসমূহ, Footer `type-logo-sm` and Dhaka year, poll focus to the h2, search and P-2 order tests |
| R4-05 | Full suites, WebKit IDs, three test fixes, this report |

## Test fixes in R4-05

No expected value changed and no test was skipped. Details: `docs/webkit-failures.md`, "R4-05 full run".

- W3-09 (run 2 and 3 group A, "page height differs at 1280 and wider, English only") and W4-12: the difference was always one nav row (48px in run 2, 44px now). The server HTML of the nav row wraps until hydration (IMP-16); WebKit hydrates later, so the tests read boxes on both sides of the shift. New helper `tests/e2e/settle.ts` `waitForNavRow`, the wait `ads.spec.ts` and `header.spec.ts` already used. The shift is a real layout shift for readers: IMP-90.
- W4-11 / W3-11: the footer hover test pressed a link, which navigated away. The test now stops the navigation.

## WebKit results

| ID | Family | Tests |
| --- | --- | --- |
| W3-01 | Tab key reaches no link | 14 |
| W3-02 | SkipLink is not the first Tab stop | 2 |
| W3-03 | Drawer keyboard | 4 |
| W3-04 | Search dialog keyboard | 2 |
| W3-05 | Theme storage event across tabs | 2 |
| W3-06 | Regions phone tab keys | 2 |
| W3-07 | Regions axe at 360 (`scrollable-region-focusable`) | 3 |
| W3-08 | Focus outline values | 2 |
| W4-01 to W4-04 | Tab reaches 2 of 4 bar controls | 4 |
| W4-07, W4-08 | Second Latest column 1 to 3px low | 8 |
| W4-09 | Most read Bangla item rule space 12 to 14px | 3 |
| W4-10 | Mouse click does not focus the vote button | 2 |
| | Total | 48 |

Passing now: W3-09, W3-10 (poll radio, run 2 group B), W3-11, W4-05, W4-06, W4-11, W4-12.

## Real Safari checklist (tajmin)

Run on macOS Safari and on iOS Safari (device or Simulator), light and dark, `/` and `/en`. For keyboard rows on macOS, first test with Safari's default, then with Safari Settings > Advanced > "Press Tab to highlight each item" on. Write each result (shows / does not show) in the Safari column of `docs/webkit-failures.md`. A fault that shows in Safari is a code fix; one that does not is a test fix.

1. Poll (IMP-53, B3): vote with the keyboard (Tab to an option, Space, Tab to vote, Enter). Focus goes to the poll h2; the results show. With VoiceOver: the result is read once.
2. VoiceOver reads the poll legend as the group name (IMP-80).
3. `#hash` scroll in a production build: `pnpm build && pnpm start`, open `http://localhost:3000/#regions`. The section heading stops below the bar (IMP-76).
4. Sticky header at 1280 and wider: scroll down past the nav row, then back to the top. The NavBar hides and the logo scales once; no flicker on the overscroll bounce at the top. With System Settings > Accessibility > Display > Reduce motion on, both change at once.
5. Menu Sheet (under 1280), search Drawer (from 768), region slider, Drawer accordion: each moves at about half a second; Tab stays inside an open panel; Escape closes it and focus returns to its button (W3-03, W3-04).
6. Dotted rules and column rules show at 1px; the item rule space looks the same as in Chrome. Look at Most read in Bangla (W4-09) and the two Latest columns at 768 to 1023: do the columns start at the same top (W4-07, W4-08)?
7. SkipLink: the first Tab on the page shows মূল খবরে যান / Skip to main content (W3-02). Tab reaches every bar control and link (W3-01, W4-01 to W4-04).
8. Theme in two tabs: open `/` in two tabs, change the theme in one; the other follows (W3-05).
9. Regions at 360 (iOS): the tabs scroll sideways; arrow keys move between tabs with a keyboard (W3-06). The tab row is reachable (W3-07).
10. Focus ring shows on MoreLink and Eyebrow links (W3-08).
11. Vote button with no choice: click it; nothing happens (W4-10).

## 200% text and §13 widths

`text-size.spec.ts` passes in Chromium at 320, 768, 1024 and 1280 in both languages (no sideways scroll; story rows stack under 17.5rem).

## Open items for tajmin

- Flag: IMP-84 (focus in the stuck header scrolls to the top in Chromium).
- `UNRESOLVED_DESIGN_SYSTEM`: IMP-85 (pinned NavBar band), U-41 (ink tokens, approved, blueprint to add values).
- New: IMP-90 (nav row shift at hydration, M2).
- Spec issues: DOC-44 to DOC-50. Firefox is not tested (DR-341: check by hand before M2).
