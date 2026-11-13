@AGENTS.md

# Orchestration (Claude as lead, Codex as executor)

This file only holds the orchestration rules. Coding conventions, layout and rules for the code are in `AGENTS.md` (loaded above) and in `apps/web/AGENTS.md` inside `apps/web`. Do not repeat them here.

## Default for feature requests

- Any feature or multi-file change the user asks for in a normal prompt follows this workflow. The `/delegate` command is an optional shortcut for the same steps (see `.claude/commands/delegate.md`), not a requirement.
- If the request says "plan only", stop after writing the plan and wait for approval.
- Otherwise: write the plan and task specs, run normal tasks through Codex, implement critical tasks yourself, review, and stop for the user's OK before any merge.

## Roles

- Claude is the team lead. Claude plans, designs, writes task specs, reviews diffs, merges, and implements the critical tasks itself.
- Codex does normal execution: every task that is not critical goes to Codex through `codex exec`, including normal `apps/web` work. Codex reads `AGENTS.md` (and `apps/web/AGENTS.md` inside `apps/web`), so task specs do not repeat those conventions.
- Critical tasks, which Claude implements itself, are:
  - authentication, capability checks, and audit or outbox writes
  - SQL migrations in `apps/api/migrations`
  - the shared contracts in `packages/contracts` and config in `packages/config`
  - the worker-to-API boundary (`apps/worker/src/outbox/routes.ts`, `/internal` endpoints)
  - upload handling and media rights (`apps/api/src/news/validation.ts`, `apps/newsroom/src/lib/media.ts`)
  - anything the user marks as critical
- Claude may also make fixes under about 10 lines, or do any change the user asks for directly.
- Claude implements a critical task in its own worktree on `task/<task-slug>`, following the same spec and verification steps. Codex review is not required for it, but Claude still runs the verification commands before merge.
- `apps/web/CLAUDE.md` describes a flow where Claude writes the code. That flow is superseded here: for `apps/web`, normal tasks go to Codex, and Claude plans and reviews. Its design-system and `AGENTS.md` rules still apply to all `apps/web` work.

### Codex invocation (flags checked against `codex exec --help`, codex-cli 0.167.1)

```bash
codex exec -C <worktree-dir> --approve-for-me -o <result-file> - < docs/plans/<slug>/<task-file>.md
```

- `-` reads the task spec from stdin. `-C` sets the working root. `--approve-for-me` routes approvals through automatic review inside the workspace-write sandbox, so runs are not interactive. Do not add `-s`: `codex exec` rejects `--sandbox` together with `--approve-for-me`.
- `-o` writes Codex's final message to a file, which Claude reads during review.
- Do not use `--dangerously-bypass-approvals-and-sandbox`. Do not use `codex exec --worktree`: worktrees are managed by this workflow, not by Codex.
- Use `--json` only when a run needs its event stream for debugging.

## Planning

- Every feature starts with a plan in `docs/plans/<feature-slug>.md`, split into small tasks. One app or package per task where possible.
- Each task spec, in `docs/plans/<feature-slug>/`, includes:
  - goal
  - workspace (for example `@fact-lens/api`)
  - exact files to create or edit
  - interfaces and types
  - what NOT to touch
  - acceptance criteria
  - the exact verification command
  - the relevant `docs/` section (see `docs/README.md`)

## Ordering rules for this monorepo

- Changes to `packages/contracts` or `packages/config` go first, in their own task. They must pass before dependent tasks start.
- Any task that adds a migration in `apps/api/migrations` runs alone. Never run two migration tasks in parallel.
- `apps/web` is still on mock data. Do not wire it to the API unless the plan says so explicitly.
- The worker changes news item state only through the API. Reject any diff that breaks this.

## Parallel work with git worktrees

- Independent tasks run in separate worktrees at `../fact-lens-<task-slug>` (relative to the repo root), on branch `task/<task-slug>`.
- Create with `git worktree add ../fact-lens-<task-slug> -b task/<task-slug>`. Then copy the root `.env` into the worktree and run `pnpm install --config.strict-dep-builds=false` there. Plain `pnpm install` fails in a new worktree with `ERR_PNPM_IGNORED_BUILDS` (`msgpackr-extract` is not in `allowBuilds`). The flag only relaxes that check for this install; it does not change the repo config. Then build the shared packages, because workspace packages resolve to their `dist/` (gitignored, so a new worktree has none): `pnpm --filter @fact-lens/config build` and `pnpm --filter @fact-lens/contracts build`. Without this, typecheck and test fail with unresolved `@fact-lens/contracts` imports.
- Codex must NOT run `./run.sh` or start dev servers in a worktree, because the ports clash. Verification is by tests and checks only.
- Shared local infra (PostgreSQL, Redis, MinIO from `pnpm infra:up`) can be used from any worktree.
- `../fact-lens-web` is a separate repository (the design source for `apps/web`). It is NOT a worktree. Never remove it, never run `git worktree remove` on it, and never copy into it. Only remove paths that `git worktree list` shows for this repo.

## Verification

- Per task: the filtered test, typecheck and lint for that workspace. Filter names:
  - `apps/web`: `fact-lens-web`
  - `apps/api`: `@fact-lens/api`
  - `apps/worker`: `@fact-lens/worker`
  - `apps/newsroom`: `@fact-lens/newsroom`
  - `packages/config`: `@fact-lens/config`
  - `packages/contracts`: `@fact-lens/contracts`
  - `tools/dev-idp`: `@fact-lens/dev-idp`
  - Example: `pnpm --filter @fact-lens/api test`
- Before merge: `pnpm check` at the repo root.
- Database tests need `TEST_DATABASE_URL`. Worker queue tests also need `TEST_REDIS_URL`. Storage tests need `TEST_S3_ENDPOINT` and the other `TEST_S3_*` settings. These are not read from `.env`; pass them in the shell, as `README.md` describes. Include them in the verification command when a task touches the database, queues or storage. Example:
  ```bash
  TEST_DATABASE_URL=postgres://factlens:factlens@localhost:5432/postgres TEST_REDIS_URL=redis://localhost:6379 pnpm --filter @fact-lens/api test
  ```

## Review loop

- After Codex finishes, Claude reviews the diff against the task spec and `AGENTS.md`, runs the task's verification command, and checks the ordering and worker rules above.
- If something is wrong, send a specific fix prompt back to Codex (a new `codex exec` run in the same worktree). Maximum 2 retries. After that, stop and ask the user.
- Never merge into `main` without showing the user a summary and getting their OK.
- After merging, update the plan file's task status, and `docs/22-implementation-status.md` if what is built has changed. A choice the plan did not make is recorded as an ADR in `docs/17-architecture-decisions.md`, as `AGENTS.md` requires.
- Remove a finished worktree with `git worktree remove ../fact-lens-<task-slug>`, then delete its branch with `git branch -d task/<task-slug>` once merged.

## Hygiene

- Never commit `.env`. It is gitignored (`.env`, `.env.*`, with `.env.example` allowed). Check with `git status` before any commit.
- Never stage `node_modules`, `.next`, or `dist`. They are gitignored; leave them that way.
