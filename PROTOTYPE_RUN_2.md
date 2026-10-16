# Prototype Run 2: Audit Summary

Audit: 12 and 13 October 2026 (three passes) · Branch `r2-21-run-2-finished` (`f4b4b7e`) · Merged by PR #4 (`0225398`)

This is the short record of the run 2 audit. The full report (master register, outdated entries, new findings, code references, second and third audit) is in git history: `PROTOTYPE_RUN_2.md` at `0225398`. Do not use it for run 3 work: the run 2 review (12 to 16 October 2026) decided every item (DR-262 to DR-344), and `docs/prototype-findings.md` gives each item its decision and run 3 ticket.

## 1. Verdict

1. The code was in better shape than the documents. `pnpm check` passed (lint, typecheck, 212 unit tests, build). Chromium e2e: 560 of 561 passed; the one failure was a flaky test (now IMP-59).
2. The trackers were stale: many findings were open on paper but fixed by run 2 or by newer spec versions.
3. The main cause was the specs. They moved from v2.0 to v2.7 to v2.11 between run 1 and run 2, and 22 of the 35 `DOC-` issues were answered by the new specs.
4. Open items for tajmin at the time: the native `<dialog>`, radio and switch against the shadcn primitives; the forbidden `tw-animate-css` package; the missing `shadcn/tailwind.css` import; component names against the approved list. All are now decided and in run 3 tickets.
5. Process drift: Claude co-author trailers on commits, rule IDs on the subject line, no kit step to update the findings file. Fixed by `AGENTS.md` §9.7 and DR-333.

| Kind | Total | Resolved by spec | Fixed in run 2 | Decided, closed or obsolete | Needed tajmin | Still open |
| --- | --- | --- | --- | --- | --- | --- |
| `DOC-` | 35 | 22 | 1 | 0 | 0 | 12 |
| `U-` | 37 | 5 | 21 | 0 | 2 | 9 |
| `IMP-` | 57 | 10 | 11 | 4 | 9 | 21 (+2) |
| `KIT-` | 5 | 0 | 5 | 0 | 0 | 0 |
| Total | 134 | 37 | 38 | 4 | 11 | 42 (+2) |

## 2. Timeline

| Run | Dates | Tickets | Result |
| --- | --- | --- | --- |
| Run 1 | 7 to 8 Oct 2026 | FL-01 to FL-13 Done, FL-14 Rejected | 88 findings |
| Spec sync | 9 to 10 Oct | `a200b56` | Specs to color 2.7, typography 2.8, layout 2.11, components 1.2, contract 2.4 |
| Run 2 | 11 Oct 2026 | R2-00 to R2-21 Done | 134 findings; PR #1, #2 and #3 merged |
| Audit | 12 to 13 Oct | – | 44 new items (`R2A-`), moved to the findings file (§3) |

Tests: 136 unit / 400 e2e (FL-13) to 212 unit / 561 Chromium e2e (R2-19). WebKit: 40 failures (`docs/webkit-failures.md`).

## 3. R2A items in the findings file

The audit items (`R2A-`) moved to `docs/prototype-findings.md` on 13 October 2026. Use this table to find an `R2A-` number that a commit or an old note names.

| R2A | Now in | Topic |
| --- | --- | --- |
| 01 | IMP-58 | Forbidden and unused packages |
| 02 | IMP-31 | shadcn CSS import |
| 03, 33 | IMP-59 | Tests that depend on the environment |
| 04 | IMP-60 | LCP warning |
| 05, 28 | IMP-61 | Names |
| 06 | DOC-36 | C-24 against LAY-14 |
| 07, 09 | IMP-62 | Arbitrary variants |
| 08 | IMP-16 | Nav row overflow |
| 10 | IMP-63 | Bangla headings |
| 11, 13, 14, 15, 20, 31, 44 | IMP-64 | Dead code, stale comments, unused tokens |
| 12, 22, 34 | – | Withdrawn or closed |
| 16, 38 | KIT-07 | Commit message rules |
| 17 | KIT-06 | Findings step in the skills |
| 18, 30 | KIT-08 | Workflows and MCP servers |
| 19, 42 | IMP-65 | Production build not tested |
| 21 | – | Git housekeeping (`docs/SPRINT.md`, "Notes for later") |
| 23, 35 | IMP-66 | Proxy matcher and cookie |
| 24, 27 | IMP-67 | Storage fallbacks and tests |
| 25 | IMP-56 | NavBar bar height |
| 26 | IMP-55 | RegionSlider server mode |
| 29 | KIT-09 | Hooks and local permissions |
| 32 | DOC-37 | Values off the 4px scale |
| 36 | IMP-68 | Leftover `tabindex` |
| 37 | IMP-10 | `readingMinutes` |
| 39 | KIT-10 | e2e command in the definition of done |
| 40 | IMP-69 | Dead drawer links |
| 41 | U-38 | Skip link |
| 43 | IMP-70 | Footer year |
