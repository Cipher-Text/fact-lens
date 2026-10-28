# dev-process brief

Branch `task/dev-process` · Issue none · PR #17 · 28 October 2026

## Goal

Change the work process (tajmin, 28 Oct 2026):

1. A progress file per page or task holds everything the work adds, changes or decides. It is the memory across `/clear`. The spec log is made from it at the final checkpoint.
2. A `/task` command for work that is not a new page, with or without an issue ID, next to `/page`.

## Where

- Skills: `.claude/skills/page`, `task` (new), `checkpoint`, `verify`
- Hooks: `.claude/hooks/session-start.mjs` (prints the progress file), `protect-files.mjs` (`task/` may edit specs; tajmin's edit)
- `AGENTS.md` 1.9 (Sections 1, 5, 8, 9, 10, 11), `CLAUDE.md`, `docs/STATUS.md`, `docs/progress/TEMPLATE.md`
- Spec: `agent-contract.md` Section 3 (other-page row) and Section 11

## Rule IDs

DR-370 to DR-377 (work flow), `agent-contract.md` Section 11 (how the contract changes)

## Checkpoints

1. Progress file, `/task`, hooks and docs (one checkpoint, final)

## Test files

None: no `src/` change. The hooks were run by hand on test repositories (branch, worktree, detached HEAD, no commit).
