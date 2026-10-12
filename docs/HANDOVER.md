# Fact Lens Web: Handover Note

13 October 2026 · After prototype run 2 (homepage prototype, Milestone 1)

For the next person or agent who works in this repository. Read this first, then the audit `PROTOTYPE_RUN_2.md` (repository root) and `docs/prototype-findings.md`.

## 1. State

| Item | State |
| --- | --- |
| Milestone 1 prototype | Finished on 8 October 2026. FL-01 to FL-13 Done, FL-14 Rejected |
| Prototype run 2 | Finished on 11 October 2026. R2-00 to R2-21 Done (`docs/run-2-log.md`). PR #1 (run 2), PR #2 (Claude workflows) and PR #3 (R2-21 bookkeeping) merged into `main` |
| Deploy | Vercel Git integration since R2-18. The branch preview of `prototype-run-2` answered 200 on `/` and `/en`. The production state of `main` was not checked |
| Branch | `main`, remote `git@github.com:tajmin/fact-lens-web.git` (private). Remote `main` is at `931b0f8` (PR #3) |
| Data | Mock only (`src/content/`), `DR-01` |
| Pages | One route, `src/app/[lang]/page.tsx`: Bangla at `/`, English at `/en`. `/[lang]/dev/story-units` is a test page for development only |
| Checks | `pnpm check` passes (212 unit tests, build, no warnings). Chromium e2e: 561 tests green at R2-19; one test is flaky (IMP-59). WebKit: 40 known failures (`docs/webkit-failures.md`) |
| Open findings | 134 registered in `docs/prototype-findings.md`. By the audit: 42 still open (+2 decided, code pending), 11 need tajmin's decision. Many written statuses in the findings file are stale (audit §3, §4) |

## 2. Run it

```bash
pnpm install
pnpm dev                              # http://localhost:3000 (Bangla), /en (English)
pnpm check                            # lint, typecheck, unit tests, build
pnpm test:e2e --project=chromium      # browser tests with axe (Chromium)
pnpm test:e2e --project=webkit        # WebKit: 40 known failures
```

- `pnpm test:e2e` with no project runs Chromium and WebKit, so it fails while the WebKit failures stay (KIT-10).
- `?content=sparse` shows the sparse cases of `spacing-layout-system.md` Section 7.3, in development only (IMP-11).

## 3. Where things are

| What | Where |
| --- | --- |
| Rules for agents and people | `AGENTS.md`, `CLAUDE.md`, `.claude/` |
| Specs and build decisions (read only) | `docs/design-system/` (decisions: `agent-contract.md` Section 7) |
| All findings, each with a suggested solution | `docs/prototype-findings.md` |
| Audit of run 2: verified status of every finding, outdated entries, the `R2A-` items and where each moved (§13) | `PROTOTYPE_RUN_2.md` |
| Run 2 ticket log (dates, rounds, commits) | `docs/run-2-log.md` |
| R2-17 final check results, later ideas, short status tables | `docs/PROGRESS.md` |
| WebKit failures, grouped | `docs/webkit-failures.md` |
| Ticket board and acceptance criteria | `docs/SPRINT.md` |
| Milestone 1 report (run 1 only) | `docs/milestone-1-report.md` |

## 4. Decisions needed before more code

Each ID has the detail in `docs/prototype-findings.md`. The run 2 audit items (`R2A-`) moved there on 13 October 2026; `PROTOTYPE_RUN_2.md` §13 maps each one.

**Blueprint project (spec changes):**

1. DOC-20, DOC-25, DOC-27, DOC-30, DOC-31: the code works around a missing spec value or block (slider CSS, button and icon tokens, component tokens, poll layout). Confirm or replace each workaround.
2. DOC-26, DOC-28, DOC-29, DOC-32: the sheets disagree with a role, a token or another section.
3. DOC-36: C-24 "body first in the markup" against LAY-14 on phones. DOC-37: sheet values off the 4px scale.

**Design owner:**

1. U-08 and U-31: the logo asset (also for dark mode) and its size and weight. The text stand-in is allowed until then.
2. U-01, U-07, U-14: English category labels, the region list, the Bangla Breaking word.
3. U-16, U-24, U-32, U-34, U-35: chip-to-list space, poll result fill, the moon icon, P-4 rules, the quote mark drawing.
4. U-38: there is no skip link, and the specs define none.

**tajmin:**

1. The open flags: DOC-33, DOC-34, DOC-35 · U-34, U-36, U-37 · IMP-36, IMP-39, IMP-41, IMP-48, IMP-50, IMP-51, IMP-61, IMP-62, IMP-63 · DOC-36 · U-38 · KIT-10.
2. The shadcn setup: the color spec requires the `shadcn/tailwind.css` import and forbids `tw-animate-css`. The code has neither done, and no shadcn primitive is installed (IMP-02, IMP-31, IMP-39, IMP-58).
3. IMP-01, IMP-13, IMP-14: confirm or change.
4. U-03: the look check of the বিশ্লেষণ ও মতামত background.
5. The items the audit calls "decided by spec" are not approved by you yet. Confirm or reverse them (`PROTOTYPE_RUN_2.md` §3.5).

## 5. Clean up early in the next step

Docs and tracking files first (`PROTOTYPE_RUN_2.md` §9):

- Add "Resolved by spec" and "Obsolete" to the status values in `docs/prototype-findings.md`; close the entries the audit lists in §3.
- Rewrite the DOC and U tables in `docs/PROGRESS.md`; add DOC-30 and U-33; refresh the "Later" notes.
- Mark `docs/milestone-1-report.md` as a run 1 snapshot; update the status in `README.md`.
- Add the missing bodies for DOC-35 and IMP-52; fix the order of DOC-29 and DOC-31.
- Put the findings update into `/ticket` and `/accept` (KIT-06). Left out for now by tajmin's choice (13 October 2026).

Code findings stay recorded in `PROTOTYPE_RUN_2.md` §5, §11.3 and §12.3 until tajmin starts them.

## 6. Before the first production deploy

- Links to `/story/<slug>`, `/latest`, `/analysis`, `/opinion`, `/op-ed` and the footer pages are 404 (IMP-18, IMP-29). Decide whether a public preview may show them.
- The drawer links to Analysis and Opinion go to ids that no longer exist (IMP-69).
- The proxy matcher skips any path with a dot and paths that start with `api`. The language cookie has no `secure` flag (IMP-66).
- The e2e tests run on `pnpm dev` only. No test covers the production build (IMP-65).

## 7. Working rules that stay

- One ticket at a time; `/ticket`, hand over, `/accept` (`CLAUDE.md`).
- Update `docs/prototype-findings.md` at the end of every ticket. No skill says so yet (KIT-06).
- Do not edit the read-only specs. Report a `DOC-` issue instead.
- Article and category pages wait for their layout pass (`AGENTS.md` Section 1).
