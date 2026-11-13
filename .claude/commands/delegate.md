---
description: Run the lead/executor workflow for a feature: plan, Codex implements in worktrees, Claude reviews
argument-hint: <feature description> [plan only]
---

Feature request: $ARGUMENTS

You are the team lead. Follow `CLAUDE.md` (which imports `AGENTS.md`) exactly. Claude plans, writes task specs, reviews and merges, and implements the critical tasks listed in `CLAUDE.md` itself. Codex (`codex exec`) does all normal execution. Follow the plan's task order and specs; do not improvise scope.

## 0. Read the request

- If the request contains the words "plan only" (any case), stop after step 2 and wait for the user's approval. Do not create worktrees or run Codex.
- Otherwise run steps 1 to 6, and stop at step 6 for approval before any merge.

## 1. Understand the area

- Read the docs the feature touches (see `docs/README.md`, the relevant numbered doc, and `docs/22-implementation-status.md`).
- Check `git status` in the repo root. Stop and ask if there are uncommitted changes that overlap the feature.

## 2. Write the plan

- Write `docs/plans/<feature-slug>.md`: goal, scope, what is out of scope, the ordered list of tasks, and which tasks depend on which.
- Apply the ordering rules in `CLAUDE.md`: `packages/contracts` and `packages/config` first; migrations alone; `apps/web` stays on mock data unless the plan says otherwise; the worker changes news item state only through the API.
- Write one task spec per task in `docs/plans/<feature-slug>/NN-<task-slug>.md`. Each spec has: goal, workspace filter, exact files to create or edit, interfaces and types, what NOT to touch, acceptance criteria, the exact verification command (including `TEST_DATABASE_URL` and `TEST_REDIS_URL` where the task touches the database or queues), and the `docs/` section to read.
- Show the user the task list. If "plan only" was requested, stop here and wait for approval.

## 3. Run independent tasks in worktrees

- Group the tasks into waves. Tasks in one wave do not depend on each other. Run migration tasks one at a time.
- For each task in a wave, from the repo root:
  - `git worktree add ../fact-lens-<task-slug> -b task/<task-slug>`
  - `cp .env ../fact-lens-<task-slug>/.env`
  - `(cd ../fact-lens-<task-slug> && pnpm install)`
- Never touch `../fact-lens-web`. It is a separate repository, not a worktree.
- Run Codex in each worktree, from the repo root:
  ```bash
  codex exec -C ../fact-lens-<task-slug> --approve-for-me -o docs/plans/<feature-slug>/results/<NN>-<task-slug>.txt - < docs/plans/<feature-slug>/<NN>-<task-slug>.md
  ```
  Put the prompt in a short wrapper that tells Codex: "Implement the task spec below. Do not run `./run.sh` or dev servers. Verify only with the command in the spec." Then the spec. Keep the results file in the plan folder, and do not commit it.
- Wait for each run to finish before starting the next wave.

## 4. Review each task

For each finished worktree:
- `git -C ../fact-lens-<task-slug> diff --stat` and read the diff against the task spec and `AGENTS.md`. Check the ordering rules, that the worker changes news item state only through the API, and that no `.env` file is in the diff.
- Run the task's verification command in the worktree.
- If something is wrong, send a specific fix prompt back to Codex in the same worktree. At most 2 retries. After that, stop and ask the user.

## 5. Full check before merge

- For each task branch, run `pnpm check` at the repo root in that worktree. Stop and report any failure with the output.

## 6. Stop for approval

Show the user:
- each task, its branch, and the verification result
- the diff summary per task
- any ADR or docs change needed

Then wait. Never merge into `main` without the user's explicit OK.

## 7. After the user's OK

- Merge each approved branch into `main` in the repo root, one at a time, in plan order.
- Update the task status in `docs/plans/<feature-slug>.md`. Update `docs/22-implementation-status.md` if what is built changed. Record any unplanned choice as an ADR in `docs/17-architecture-decisions.md`.
- Remove each finished worktree with `git worktree remove ../fact-lens-<task-slug>`, then `git branch -d task/<task-slug>`.
- Run `pnpm check` at the repo root on `main` and report the result.
