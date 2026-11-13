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
| [card-generation](./card-generation.md) | Approved; Wave 0 in progress |

Add a row when a plan is written. Update its status after each merge, and update `docs/22-implementation-status.md` when what is built changes.

See `CLAUDE.md` for the workflow: who implements which task, worktree rules, verification, and the approval needed before any merge.
