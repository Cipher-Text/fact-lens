# Prototype Run 3: Ticket Log

Claude adds one row when a ticket ends (`/accept`, or Rejected). Do not change old rows.

| Column | What to write |
| --- | --- |
| Ticket | Ticket ID and title, for example `R3-02 Header, panels and theme` |
| Started | Date the ticket went "In progress" |
| Ended | Date of `/accept` or rejection |
| Result | Done or Rejected |
| Rounds | How many times tajmin sent problems before `/accept` (0 = accepted at first handover) |
| Spec findings | `UNRESOLVED_DESIGN_SYSTEM` and spec issues found, with IDs in `docs/prototype-findings.md`, or "none" |
| Commit | Short commit hash on `prototype-run-3` |
| Note | One line, or empty |

| Ticket | Started | Ended | Result | Rounds | Spec findings | Commit | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R3-00 Kit, scripts and test fixes | 2026-10-16 | 2026-10-16 | Done | 0 | none | 80c74a6 | IMP-58 packages (`cn`, `@base-ui/react`, `class-variance-authority`) flagged for R3-02 |
| R3-01 Names and structure | 2026-10-16 | 2026-10-16 | Done | 0 | DOC-38, IMP-71 | 3a72b10 | Fixes DOC-36, IMP-09, IMP-48, IMP-57, IMP-61, IMP-64 |
| R3-02 Header, panels and theme | 2026-10-16 | 2026-10-16 | Done | 1 | DOC-39, U-39, IMP-72 to IMP-76 | 2884b76 | Flags: `lang-bn` variant, search close button order, U-35 not done |
| R3-03 Dividers, gaps and panel band | 2026-10-16 | 2026-10-16 | Done | 0 | U-40 | f3346dd | Fixes DOC-32, DOC-33, U-03, U-16, U-34, IMP-37, IMP-54. Flag: column divider placement (U-40) |
| R3-04 Story units and images | 2026-10-16 | 2026-10-16 | Done | 0 | IMP-78, IMP-79 | fac26a3 | Fixes DOC-26, DOC-30, U-14, U-33, U-37, IMP-10, IMP-19, IMP-36, IMP-60 |
| R3-05 DailyPoll | 2026-10-16 | 2026-10-16 | Done | 0 | IMP-80, DOC-40, IMP-81 | 8ac938b | Fixes DOC-31, IMP-26, IMP-50, IMP-53, IMP-62 |
| R3-06 Regions and Most read | 2026-10-16 | 2026-10-16 | Done | 0 | DOC-41, IMP-82 | 00c541f | Fixes DOC-19, DOC-20, IMP-51, IMP-52, IMP-55, IMP-63. Flag: `#region-africa` has no target (IMP-74) |
| R3-07 Ads | 2026-10-16 | 2026-10-16 | Done | 0 | DOC-42 | pending | Fixes DOC-29, DOC-35, IMP-24, IMP-44. Flag: inset placement wording (DOC-42) |
