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
