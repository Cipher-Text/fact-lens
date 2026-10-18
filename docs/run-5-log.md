# Run 5: Ticket Log

Claude adds one row per ticket when it ends (`/accept`, or Rejected), in the ticket commit. Do not change old rows; add a note row.

| Column | What to write |
| --- | --- |
| Ticket | Ticket ID and title, for example `R5-01 Docs and run 4 review fixes` |
| Started | Date the ticket went "In progress" |
| Ended | Date of `/accept` or rejection |
| Result | Done or Rejected |
| Rounds | How many times tajmin sent problems before `/accept` (0 = accepted at first handover) |
| Spec findings | `UNRESOLVED_DESIGN_SYSTEM` and spec issues found, with IDs in `docs/prototype-findings.md`, or "none" |
| Commit | Short commit hash on `production-run-5` |
| Note | One line, or empty |

| Ticket | Started | Ended | Result | Rounds | Spec findings | Commit | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R5-01 Docs and run 4 review fixes | 2026-10-18 | 2026-10-18 | Done | 0 | IMP-91, DOC-51 (flag, open), DOC-52 | 7b1efb8 | Four checkpoints: docs and specs; border, --duration-slide, P-4 gap, ink tokens; header focus margin, one-row NavBar; Latest column rule, storage-event test. Chromium 686 pass; WebKit W5-01, W5-02 |
| R5-02 Real Safari pass, final check, pull request and merge | 2026-10-18 | 2026-10-18 | Done | 0 | IMP-92 (open, low priority) | pending | Full WebKit 51 (all test faults); real Safari macOS and iOS pass except IMP-92; IMP-53 and IMP-88 Closed, no code change; Chromium 686 pass. PR and merge on tajmin's go |

## Test runs

One row per test run, with its ticket and checkpoint.

| Ticket | Checkpoint | Date | Command | Spec count | Passed | Failed | Time |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R5-01 | 1 | 2026-10-18 | `pnpm check` | 22 unit files | 243 | 0 | 11 s |
| R5-01 | 2 | 2026-10-18 | `pnpm check` | 22 unit files | 251 | 0 | 10 s |
| R5-01 | 2 | 2026-10-18 | `pnpm test:e2e:chromium` (full) | 18 spec files | 664 | 0 | 4.0 min |
| R5-01 | 2 | 2026-10-18 | `pnpm exec playwright test --project=webkit` page, analysis-opinion, motion, small-parts (report) | 4 | 117 | 7 (W3-01 ×2, W3-08 ×2, W4-09 ×2, W5-01) | 1.1 min |
| R5-01 | 3 | 2026-10-18 | `pnpm exec playwright test --project=chromium` header, site, page | 3 | 151 | 0 | 1.1 min |
| R5-01 | 3 | 2026-10-18 | `pnpm exec playwright test --project=webkit` header, site, page (report) | 3 | 133 | 18 (W3-02 ×2, W3-03/W3-04 ×6, W3-05 ×2, W4-01 to W4-04 ×4, W5-02 ×4) | 1.4 min |
| R5-01 | 3 | 2026-10-18 | `pnpm check` | 22 unit files | 251 | 0 | 10 s |
| R5-01 | 4 | 2026-10-18 | `pnpm test:e2e:chromium` (full) | 18 spec files | 686 | 0 | 4.2 min |
| R5-01 | 4 | 2026-10-18 | `pnpm exec playwright test --project=chromium header.spec.ts -g "storage event" --repeat-each=10` | 1 | 20 | 0 | 14 s |
| R5-01 | 4 | 2026-10-18 | `pnpm exec playwright test --project=webkit` hero, small-parts, header (report) | 3 | 158 | 29 (all known families, no new ID) | 1.8 min |
| R5-01 | 4 | 2026-10-18 | `pnpm check` | 22 unit files | 251 | 0 | 10 s |
| R5-02 | 1 | 2026-10-18 | `pnpm exec playwright test --project=webkit` (full, report) | 18 spec files | 619 | 51 (all known families, no new ID; 16 skipped) | 5.0 min |
| R5-02 | 1 | 2026-10-18 | Real Safari checklist, macOS and iOS (tajmin) | 15 items | all but 1 | 1 (item 1 macOS: Tab to the vote button, IMP-92) | – |
| R5-02 | 2 | 2026-10-18 | `pnpm check` | 22 unit files | 251 | 0 | 10 s |
| R5-02 | 2 | 2026-10-18 | `pnpm test:e2e:chromium` (full) | 18 spec files | 686 | 0 | 4.2 min |
