# Feature plans

Each feature gets one plan file, written before any implementation starts.

## Layout

- `docs/plans/<feature-slug>.md`: the plan. Goal, scope, what is out of scope, the ordered list of tasks with their status, and which tasks depend on which.
- `docs/plans/<feature-slug>/NN-<task-slug>.md`: one task spec per task. Each spec has the goal, workspace filter, exact files, interfaces and types, what not to touch, acceptance criteria, the verification command, and the `docs/` section to read.
- `docs/plans/<feature-slug>/results/`: Codex's final message for each run (`-o` output). Not committed.

## Status values

Each task in a plan is one of: `pending`, `in progress`, `in review`, `merged`, `blocked`.

## Plans

| Plan | Status |
| --- | --- |
| [assignment-and-source-screens](./assignment-and-source-screens.md) | Done: T1 to T3 merged |
| [card-generation](./card-generation.md) | Done: T0 to T5 merged |
| [test-reliability](./test-reliability.md) | Done: runs are serial (ADR-038) |
| [public-site-api](./public-site-api.md) | Done (the unavailable page answers 503; open question 30 resolved) |
| [auth-in-app](./auth-in-app.md) | Built (A0 to A8): accounts, passwords, MFA and sessions inside the backend; the external security review is open |
| [deployment](./deployment.md) | Awaiting decisions (platform, domains, migrations) |
| [product/read-next](./product/read-next.md) | Built: RN1 to RN5 committed; manual check against a running API open |
| [product/T10-reading-time](./product/T10-reading-time.md) | Built: steps 1 to 5 committed |
| [card-duplicate-renders](./card-duplicate-renders.md) | Done: migration and upload change merged (ADR-036) |

Add a row when a plan is written. Update its status after each merge, and update `docs/22-implementation-status.md` when what is built changes.

See `CLAUDE.md` for the workflow: who implements which task, worktree rules, verification, and the approval needed before any merge.
