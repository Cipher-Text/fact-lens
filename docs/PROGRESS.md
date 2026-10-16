# Fact Lens Homepage Prototype: Progress

Version 3.0 · 16 October 2026 · Run 3 (fix run)

Claude Code reads the "Now" section at the start of each session. `/ticket` and `/accept` keep this file current. The tickets are in `docs/SPRINT.md`, the ticket log is `docs/run-3-log.md`, and the findings are in `docs/prototype-findings.md`.

## Now

- Run: 3 (fix run). Branch `prototype-run-3`, made from `main` at `0225398`.
- Ticket: none. R3-01 is the next ticket.
- Before R3-00: the 16 October specs are in `docs/design-system/` (copied on 16 October 2026). The kit changes DR-333, DR-335 and DR-336 are applied.
- Next action: tajmin types `/ticket`.

## Past runs

| Run | Dates | Result |
| --- | --- | --- |
| Run 1 | to 8 Oct 2026 | FL-01 to FL-13 Done, FL-14 (deploy) Rejected. Record: `docs/milestone-1-report.md` |
| Run 2 | 7 to 11 Oct 2026 | R2-00 to R2-21 Done (`docs/run-2-log.md`). PR #1 merged (`8863410`). R2-17 final check: `pnpm check` and Chromium e2e passed; axe had one moderate issue (DOC-35) and the dark text logo contrast (U-08) |
| Run 2 audit | 12 to 13 Oct 2026 | `PROTOTYPE_RUN_2.md`, merged by PR #4 (`0225398`) |
| Run 2 review | 12 to 16 Oct 2026 | The blueprint decided every finding (DR-262 to DR-344) and updated the specs |

The full run 1 and run 2 tables of this file (FL-13 and R2-17 results, run 1 status lists) are in git history at `0225398`.

## Run 3 status

| Ticket | Status | Log row |
| --- | --- | --- |
| R3-00 | Done (16 Oct 2026) | `docs/run-3-log.md` |
| R3-01 to R3-09 | To do | – |

`/accept` updates this table and the board in `docs/SPRINT.md`.

## Known state of the code at run 3 start

- `pnpm check` passed at the end of run 2 (212 unit tests, build, no warnings).
- Chromium e2e passed at R2-19 (561 tests). One test depends on the environment (IMP-59, fixed in R3-00).
- WebKit has 40 known failures (`docs/webkit-failures.md`). R3-09 reports the WebKit results.
- No shadcn primitive is installed yet. `globals.css` does not import `shadcn/tailwind.css` (R3-00).

## Open items (Later)

These wait for a later phase. Run 3 keeps the current treatment. Full text: `docs/prototype-findings.md`, "Open items (Later)".

| ID | Item | Treatment until then |
| --- | --- | --- |
| U-01, U-07, IMP-41 | IA label table (category and region labels, nav labels) | Working labels in `src/i18n/`; 7 working regions |
| U-08 | Logo SVG (light and dark) | Text stand-in (C-17). The dark text logo fails axe contrast until the SVG exists |
| IMP-12, IMP-14, IMP-18, IMP-35 | Backend and section pages | Labels in `src/i18n/`; homepage anchors; URL patterns set, links go to 404 |
| IMP-45 | Ad booking | Every mock slot is booked |
| IMP-25, IMP-33 | Newsletter | Paused (DR-239); no newsletter code |

## Unresolved design-system items (run 3)

Add a row when a ticket reports `UNRESOLVED_DESIGN_SYSTEM`. Add the full entry to `docs/prototype-findings.md`.

| ID | Found | File and component | Treatment used | Status |
| --- | --- | --- | --- | --- |
| – | – | None yet | – | – |
