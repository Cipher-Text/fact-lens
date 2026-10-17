# Fact Lens Homepage Prototype: Progress

Version 4.0 · 16 October 2026 · Run 4 (short fix run)

Claude Code reads the "Now" section at the start of each session. `/ticket` and `/accept` keep this file current. The tickets are in `docs/SPRINT.md`, the ticket log is `docs/run-4-log.md`, and the findings are in `docs/prototype-findings.md`.

## Now

- Run: 4 (short fix run). Branch `prototype-run-4`, made from `main` at `0bebd07`.
- Ticket: none. R4-05 Done on 17 October 2026; every run 4 ticket is Done. Still open from R4-05: the real Safari checklist (`docs/run-4-report.md`) and the PR from `prototype-run-4` into `main` and its merge, each on tajmin's explicit go.
- Specs in `docs/design-system/`: color 2.14, typography 2.15, layout 2.21, component-system 1.16, agent-contract 2.11.
- Tests from R4-03: `pnpm check` plus Chromium e2e on the ticket's "Test files" only; the full suite runs in R4-05 or when a ticket changes a shared file (`docs/SPRINT.md` "Test scope").
- Next action: tajmin runs the Safari checklist and gives the go for the PR. After the merge, run `pnpm check` and `pnpm test:e2e:chromium` on `main`.

## Past runs

| Run | Dates | Result |
| --- | --- | --- |
| Run 1 | to 8 Oct 2026 | FL-01 to FL-13 Done, FL-14 (deploy) Rejected. Record: `docs/milestone-1-report.md` |
| Run 2 | 7 to 11 Oct 2026 | R2-00 to R2-21 Done (`docs/run-2-log.md`). PR #1 merged (`8863410`) |
| Run 2 audit | 12 to 13 Oct 2026 | `PROTOTYPE_RUN_2.md`, merged by PR #4 (`0225398`) |
| Run 3 | 16 Oct 2026 | R3-00 to R3-09 Done (`docs/run-3-log.md`, `docs/run-3-report.md`). PR #5 merged (`6edc410`); docs commit `0bebd07` |
| Run 3 review and design change | 16 Oct 2026 | The blueprint decided the run 3 findings and a masthead, list and divider change (DR-345 to DR-351) and updated the specs |

The full run 1 and run 2 tables of this file are in git history at `0225398`; the run 3 table is at `0bebd07`.

## Run 4 status

| Ticket | Status | Log row |
| --- | --- | --- |
| R4-00 | Done (16 Oct 2026, blueprint setup) | `docs/run-4-log.md` |
| R4-01 | Done (17 Oct 2026) | `docs/run-4-log.md` |
| R4-02 | Done (17 Oct 2026) | `docs/run-4-log.md` |
| R4-03 | Done (17 Oct 2026) | `docs/run-4-log.md` |
| R4-04 | Done (17 Oct 2026) | `docs/run-4-log.md` |
| R4-05 | Done (17 Oct 2026) | `docs/run-4-log.md` |

`/accept` updates this table and the board in `docs/SPRINT.md`.

## Known state of the code at run 4 start

- `main` at `0bebd07`. `pnpm check` and Chromium e2e (591 tests) passed on `prototype-run-3` before the merge (`docs/run-3-report.md`).
- WebKit has 42 failures (`docs/run-3-report.md`, `docs/webkit-failures.md`). R4-05 checks them in real Safari.
- The code still has the run 3 masthead: ThemeToggle switch, `lang-bn` variant, 48px NavBar row (header test expects 49). R4-01 and R4-02 change it.

## Open items (Later)

These wait for a later phase. Run 4 keeps the current treatment. Full text: `docs/prototype-findings.md`, "Open items (Later)".

| ID | Item | Treatment until then |
| --- | --- | --- |
| U-01, U-07, IMP-41 | IA label table (category and region labels, nav labels) | Working labels in `src/i18n/`; 7 working regions |
| U-08 | Logo SVG (light and dark) | Text stand-in (C-17). The dark text logo fails axe contrast until the SVG exists |
| IMP-12, IMP-14, IMP-18, IMP-35 | Backend and section pages | Labels in `src/i18n/`; homepage anchors; URL patterns set, links go to 404 |
| IMP-45 | Ad booking | Every mock slot is booked |
| IMP-25, IMP-33 | Newsletter | Paused (DR-239); no newsletter code |

## Unresolved design-system items (run 4)

Add a row when a ticket reports `UNRESOLVED_DESIGN_SYSTEM`. Add the full entry to `docs/prototype-findings.md`.

| ID | Found | File and component | Treatment used | Status |
| --- | --- | --- | --- | --- |
| IMP-85 | R4-02 | `NavBar.tsx`, `components.css` `nav-row-slide` (C-18) | Full-width page-color band, items and rule in the shell; sticky under the bar with a clip-path slide | Open: C-18 Surface names shell width only |
| U-41 | R4-03 | `components.css` `--ink-*` tokens, `divider-item`, `list-ink-*` (C-22) | Divider.item space measured to the ink with per-language tokens (share of the role size, measured from the fonts); approved by tajmin 17 Oct 2026 (F-1) | Open: blueprint to add the values |
| IMP-84 | R4-02 | `ScrollOffset.tsx`, site header (C-17, LAY-15) | None: focus in the stuck bar scrolls the page to the top in Chromium (also on run 3 code) | Open: flag, tajmin decides |
| U-40 | R3-03 | `Divider.tsx` (C-22) | No column divider built or placed | Decided: C-22 places column-inset (P-4 from 768, P-3 from 1024). Code in R4-03 |
| U-39 | R3-02 | `ThemeToggle.tsx`, `ThemeButton.tsx` (C-12) | Icon `text-interactive` in both themes | Closed: ThemeToggle and the theme icon token are removed; ThemeButton icon is ink (C-12, C-17). Fixed in R4-01 |
