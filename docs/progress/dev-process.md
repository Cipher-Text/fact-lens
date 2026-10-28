# dev-process progress

Branch `task/dev-process` · Brief `docs/briefs/dev-process.md` · Issue none · Started 28 October 2026

Written after the work, so the branch follows the flow it adds. The template is `docs/progress/TEMPLATE.md`.

## Now

- State: checkpoint 1 of 1 (final) done; PR #17 open, review fixes pushed
- Next step: tajmin merges PR #17
- Open questions to tajmin: none
- Uncommitted: no

## Decisions

| Date | Decision | Source |
| --- | --- | --- |
| 28 Oct 2026 | "no need to mess with spec. lets keep a progress file. it will contain everything. you can write the spec in the final checkpoint from the progress file" | tajmin, chat |
| 28 Oct 2026 | "/task with or without id. without id, i'd tell what to change and where" | tajmin, chat |
| 28 Oct 2026 | Remove `.claude/launch.json` from the repo (kept locally) | tajmin, chat |
| 28 Oct 2026 | The process: log new tokens, gaps or extensions; add them to the spec at the final checkpoint; the rest follows. `agent-contract.md` Sections 3 and 11 are updated on this branch (no override, DOC-59 dropped) | tajmin, chat |

## Log

### Checkpoint 1: Progress file, /task, hooks and docs (28 Oct 2026)

- Built: the progress file as the work memory, the `/task` skill, the session-start resume, and the docs for both.
- Code: `docs/progress/TEMPLATE.md` (new): how to keep the file, sections Now, Decisions, Log.
- Code: `.claude/skills/task/SKILL.md` (new): ID, words or empty; branch `task/<name>` with `--no-track`; short brief; progress file; homepage lock check.
- Code: `.claude/skills/page/SKILL.md`: progress file in place of the spec log at the start; STATUS `Branch:` line; `--no-track`.
- Code: `.claude/skills/checkpoint/SKILL.md`: step 1 reads the progress file against the diff; spec log made from it, only with spec items; with no spec log the reviewer checks the diff only and step 5 is skipped.
- Code: `.claude/skills/verify/SKILL.md`: brief path `docs/briefs/<name>.md`.
- Code: `.claude/hooks/session-start.mjs`: branch from `git rev-parse`; on `page/` or `task/` prints the progress "Now" and the last entry under "## Log" (not the template placeholder).
- Code: `.claude/hooks/protect-files.mjs` (tajmin's edits): `task/` may edit specs; branch from `git rev-parse`; texts say "page/ or task/".
- Docs: `AGENTS.md` 1.9 Sections 1, 5, 8, 9, 10, 11; `CLAUDE.md`; `docs/STATUS.md`.
- Spec: `agent-contract.md` 2.18: Section 3 other-page row, Section 11 items 1 to 3 (`page/` or `task/` branch, progress file, spec log at the final checkpoint).
- Spec log: `docs/spec-log/dev-process.md` DP-01 (contract Section 11) and DP-02 (Section 3 row), both changed rules approved by tajmin.
- New tokens, components, strings, mock data, tests: none.
- Tweaks from tajmin: none beyond the decisions above. Review fixes from PR #17 rounds 1 to 5.
- Gaps and flags: none. Optional: rename `onPageBranch` to `onWorkBranch` in `protect-files.mjs`.
