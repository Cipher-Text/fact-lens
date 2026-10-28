# docs-cleanup brief

Branch `task/docs-cleanup` · Issue none · 29 October 2026

## Goal

Remove the md files of merged work and add a rule so they do not pile up again (tajmin, 29 Oct 2026). Their open items are already rows in `docs/ISSUES.md` (UF-02 is U-49, UF-06 is U-48, HM-04 is U-47; LT-02 is decided). Git history keeps the files.

## Where

- Delete: `docs/tasks/` (`home-most-read.md`, `url-format.md`); `docs/briefs/` `category-formats`, `dev-process`, `home-most-read`, `latest`, `url-format`; `docs/progress/` `dev-process`, `latest`; `docs/spec-log/` all 7 logs
- New: `docs/spec-log/TEMPLATE.md` (header, kinds, empty item table, flags), from the `category-formats.md` format
- `.claude/skills/checkpoint/SKILL.md`: the format example is `TEMPLATE.md`
- Specs: drop the spec-log file paths and keep the item IDs in `spacing-layout-system.md` 7A, 7B, 7D intros, `component-system.md` article sheets intro, `agent-contract.md` Section 3 rows (with a changelog line each). Old changelog lines stay as history
- `AGENTS.md` Section 9 step 6, after the merge: delete the brief, progress file and spec log of the merged work once its open items are rows in `docs/ISSUES.md`; also Section 5 folder note if needed
- Keep: `docs/webkit-failures.md`, `.claude/rules/`, `docs/progress/TEMPLATE.md`

## Rule IDs

DR-370 to DR-377 (work flow), `agent-contract.md` Section 11 (how the contract changes)

## Checkpoints

1. Delete the files, add the spec-log template, fix every reference, add the after-merge rule (one checkpoint, final)

## Test files

None: no `src/` change. Check: `git grep` finds no path to a deleted file outside changelog lines; `pnpm check` passes.
