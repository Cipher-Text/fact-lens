# Run 5: Report

18 October 2026 · Branch `production-run-5` (from `main` at `7430d53`) · Written in R5-02

## Result

| Check | Result |
| --- | --- |
| `pnpm check` | Pass on the branch (251 unit tests, build clean). On `main` after the merge: pending |
| `pnpm test:e2e:chromium` | 686 pass on the branch (4.2 min). On `main` after the merge: pending |
| `pnpm test:e2e` WebKit (DR-289: a report, not a gate) | 51 failures, 619 pass, 16 skipped (run 4: 48). Every failure is a known family; no new ID |
| Real Safari (macOS and iOS, A11Y-24) | Every item passes on iOS; on macOS every item passes except item 1 ( Tab does not reach the vote button, IMP-92, open, low priority). A11Y-24 closed. Every WebKit failure is a test fault; IMP-88 needs no rounding |
| `main` moved since the branch | No: `origin/main` is still `7430d53` (fetched 18 October 2026) |
| After the merge | Pending: after `/accept`, the PR and the merge wait for tajmin's go; then `pnpm check` and the full Chromium suite run on `main` |

## Tickets

| Ticket | Change |
| --- | --- |
| R5-01 | Docs and specs current (production frontend); `--border` `#CEC7BD` / `#494D55`; `--duration-slide`; P-4 gap `--space-analysis-gap`; typography §3.1 ink tokens; `scroll-margin-top` on header focusables; one-row NavBar from the server HTML; full-width NavBar band; Latest column rule at 768 to 1023; storage-event test fix |
| R5-02 | Full WebKit run, real Safari pass, final check, this report, PR and merge |

## WebKit results

Full list and the per-ID table: `docs/webkit-failures.md`, "R5-02 full run".

| ID | Family | Tests |
| --- | --- | --- |
| W3-01 | Tab key reaches no link | 14 |
| W3-02 | SkipLink is not the first Tab stop | 2 |
| W3-03 | Drawer keyboard | 4 |
| W3-04 | Search dialog keyboard | 2 |
| W3-06 | Regions phone tab keys | 2 |
| W3-07 | Regions axe at 360 (`scrollable-region-focusable`) | 4 |
| W3-08 | Focus outline values | 2 |
| W4-01 to W4-04 | Tab reaches 2 of 4 bar controls | 4 |
| W4-07, W4-08 | Second Latest column 1 to 3px low | 8 |
| W4-09 | Most read Bangla item rule space | 2 |
| W4-10 | Mouse click does not focus the vote button | 2 |
| W5-01 | Most read English item rule space at 768 | 1 |
| W5-02 | NavBar links not in the Tab order | 4 |
| | Total | 51 |

Passing now: W3-05 (storage event, after the IMP-86 test fix).

## Real Safari checklist (tajmin)

tajmin ran it on 18 October 2026; every item passes except the Tab step of item 1 (IMP-92, low priority, open). Run on macOS Safari and on iOS Safari (device or Simulator), light and dark, `/` and `/en`, against a production build (`pnpm build && pnpm start`, `http://localhost:3000`). For keyboard rows on macOS, test first with Safari's default, then with Safari Settings > Advanced > "Press Tab to highlight each item" on. A fault that shows in Safari is a code fix; one that does not is a test fix.

Items 1 to 11 are the R4-05 checklist. Items 12 to 15 are the R5-01 changes.

| # | Check | IDs | macOS | iOS |
| --- | --- | --- | --- | --- |
| 1 | Poll: vote with the keyboard (Tab to an option, Space, Tab to vote, Enter). Focus goes to the poll h2; the results show. VoiceOver reads the result once | IMP-53 | Fail: Tab does not reach the vote button (IMP-92); the rest passes | Pass |
| 2 | VoiceOver reads the poll legend as the group name | IMP-80 | Pass | Pass |
| 3 | Open `http://localhost:3000/#regions`: the section heading stops below the bar | IMP-76 | Pass | Pass |
| 4 | Sticky header at 1280 and wider: scroll past the nav row and back. The NavBar hides and the logo scales once; no flicker on the overscroll bounce. With Reduce motion on, both change at once | LAY-15 | Pass | – |
| 5 | Menu Sheet (under 1280), search Drawer (from 768), region slider, Drawer accordion: each moves in about half a second; Tab stays inside an open panel; Escape closes it and focus returns to its button | W3-03, W3-04 | Pass | Pass |
| 6 | Dotted and column rules show at 1px; item rule space looks the same as in Chrome. Most read in Bangla and English at 768; the two Latest columns at 768 to 1023 start at the same top | W4-07, W4-08, W4-09, W5-01, IMP-88 | Pass | Pass |
| 7 | SkipLink is the first Tab stop (মূল খবরে যান / Skip to main content). Tab reaches every bar control, NavBar link and story link | W3-01, W3-02, W4-01 to W4-04, W5-02 | Pass | – |
| 8 | Theme in two tabs: change it in one; the other follows | W3-05 | Pass | Pass |
| 9 | Regions at 360: the tabs scroll sideways; arrow keys move between tabs; the tab row is reachable | W3-06, W3-07 | – | Pass |
| 10 | Focus ring shows on MoreLink and Eyebrow links | W3-08 | Pass | – |
| 11 | Vote button with no choice: click it; nothing happens | W4-10 | Pass | Pass |
| 12 | At 1280 and 1440, scroll down 600px, then Shift+Tab into the header: the page does not jump; the focused control shows | IMP-84, DR-357 | Pass | – |
| 13 | Reload at 1280 and 1440: the NavBar is one row from the first paint (no row jumps away); the band spans the window, items and rule line up with the page edges | IMP-90, IMP-85 | Pass | – |
| 14 | Latest at 768 to 1023: a 1px rule between the two columns, centered in the gap; none at 767 or 1024 | DR-355 B3 | Pass | Pass |
| 15 | Rules and borders use the new border color (a little darker than before in light, lighter in dark); Analysis gap and its column rule look centered at 768, 1024, 1280 | DR-358, DR-356 | Pass | Pass |

## Open items for tajmin

- IMP-92: Tab does not reach the poll vote button in macOS Safari (low priority, open).
- Flag: DOC-51 (NavBar focus ring cut at top and bottom), open from R5-01.
- Firefox is not tested (DR-341: check by hand before M2).
