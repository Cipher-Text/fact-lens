# Plan: test reliability

Status: **awaiting approval** (plan only; no code written).

## Goal

`pnpm check` at the root passes every time, not only most of the time. Today it fails at random: database suites time out in their setup hooks or in single tests, and vitest sometimes fails to clear its cache. Each failure has passed on rerun, so the cause is load and shared state, not wrong logic.

## Causes (checked in the code)

1. **Packages run at the same time.** The root `test` script is `pnpm -r test`, which runs package tests in parallel. Two packages then write the same vitest cache directory (`node_modules/.vitest-cache`), and one fails with `ENOTEMPTY`.
2. **Database suites contend.** Each database test file creates its own database and runs all 27 migrations in a `beforeAll` hook (`apps/worker/src/test-support.ts`, and the API harness). Vitest runs files in parallel, so many migrations run at once against one PostgreSQL. Hooks take longer than their timeout (10 seconds by default; 60 seconds since the worker and API fix).
3. **Some single tests are too close to their limit.** The API has no `testTimeout`, so its tests use the 5-second default. The AI and polls tests have timed out under load.

## Decisions (recommended, to approve)

- **Run packages one at a time** in the root check: `pnpm -r --workspace-concurrency=1 test`. This removes the cache race and most of the contention between packages. Cost: the check is slower, which is acceptable.
- **Run database files one at a time** in the packages that use the database (`apps/api`, `apps/worker`): `fileParallelism: false`. This removes contention between files inside a package.
- **Give the API the same test timeout as the worker** (`testTimeout: 20000`), and keep `hookTimeout: 60000`.
- **Do not change test logic or skip tests** to get a pass. Every test keeps running.

Rejected for now: a shared pre-migrated template database. It would make the suites faster, but it adds a shared fixture that can go stale. Revisit if the check takes too long after the changes above.

## Tasks

| ID | Task | Owner | Status |
| --- | --- | --- | --- |
| T1 | Root `test` runs packages one at a time; API and worker database files run one at a time; API `testTimeout` 20000 | Claude | pending |
| T2 | Stress check: run `pnpm check` three times in a row and record each result | Claude | pending |
| T3 | Record the decision as ADR-038 and update `docs/22` (what the check does now) | Claude | pending |

T1 is a few lines in the root `package.json` and two vitest configs, so Claude makes it directly. Nothing here changes application behaviour.

## Verification

- T1: `pnpm check` passes once with the test variables set.
- T2: three consecutive full runs, all passing (exit 0). Record the run time of each. If any run fails, stop and report the output.
- T3: docs links resolve.

## Risks

- A slower check. Expect the root check to take noticeably longer; measure it in T2 and report it.
- A test that only fails when run alone or in a particular order would be hidden by serial runs. T2 is there to catch it.
