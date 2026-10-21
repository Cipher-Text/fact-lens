# Fact Lens Web: Handover Note

18 October 2026 · Start of run 5 (M2 stage F0, stabilize)

For the next person or agent who works in this repository. Read this first, then `AGENTS.md` and `docs/SPRINT.md`.

## 1. State

| Item | State |
| --- | --- |
| Run 1 | Finished on 8 October 2026 (`docs/milestone-1-report.md`, record only) |
| Run 2 | Finished on 11 October 2026 (`docs/run-2-log.md`). Audit `PROTOTYPE_RUN_2.md` merged by PR #4 |
| Run 2 review | Finished on 16 October 2026. Every finding is decided (DR-262 to DR-344) and the rules are in the specs |
| Run 3 | Finished on 16 October 2026 (`docs/run-3-log.md`, `docs/run-3-report.md`). PR #5 merged (`6edc410`) |
| Run 3 review and design change | Finished on 16 October 2026 (DR-345 to DR-351); the rules are in the specs |
| Run 4 | Done and merged on 17 October 2026 (PR #6, `7430d53`). Log `docs/run-4-log.md`, report `docs/run-4-report.md` |
| Run 5 | Started. Branch `production-run-5` from `main` at `7430d53`. Board R5-01 and R5-02 in `docs/SPRINT.md`; log `docs/run-5-log.md` |
| Deploy | Do not deploy. The live preview (https://fact-lens-web-ashy.vercel.app/) is for compare only |
| Data | Mock only (`src/content/`) |
| Pages | One route, `src/app/[lang]/page.tsx`: Bangla at `/`, English at `/en`. `/[lang]/dev/story-units` is a development test page |
| Checks | `pnpm check` and Chromium e2e (660) passed at R4-05. WebKit: 48 failures (`docs/run-4-report.md`, `docs/webkit-failures.md`) |

## 2. Run it

```bash
pnpm install
pnpm dev                    # http://localhost:3000 (Bangla), /en (English)
pnpm check                  # lint, typecheck, unit tests, build
pnpm test:e2e:chromium      # the e2e gate
pnpm test:e2e --project=webkit   # WebKit report only: 48 failures at run 4
```

- Plain `pnpm test:e2e` runs Chromium and WebKit, so it fails while the WebKit failures stay.
- `?content=sparse` shows the sparse cases of `spacing-layout-system.md` §7.3, in development only.

## 3. Where things are

| What | Where |
| --- | --- |
| Rules for agents and people | `AGENTS.md`, `CLAUDE.md`, `.claude/` |
| Specs (read only) | `docs/design-system/` (build decisions: `agent-contract.md`) |
| Run 5 board, rules and tickets | `docs/SPRINT.md` |
| Current status | `docs/PROGRESS.md` |
| Findings, each with its decision and ticket | `docs/prototype-findings.md` |
| Run 5 ticket log | `docs/run-5-log.md` |
| Run 4 log and report (record) | `docs/run-4-log.md`, `docs/run-4-report.md` |
| Run 3 log and report (record) | `docs/run-3-log.md`, `docs/run-3-report.md` |
| Run 2 audit and log (record) | `PROTOTYPE_RUN_2.md`, `docs/run-2-log.md` |
| WebKit failures, grouped | `docs/webkit-failures.md` |

## 4. Before R5-01

1. The specs in `docs/design-system/` are the run 5 versions (color 2.15, typography 2.16, layout 2.22, component-system 1.17.1, agent-contract 2.12.1). Done: copied by the blueprint setup on 18 October 2026; the R5-01 commit adds them.
2. The kit changes DR-333, DR-335 and DR-336 are applied (16 October 2026). `.mcp.json` runs `next-devtools-mcp` 0.4.0 from the dev dependencies and Playwright MCP as `pnpm dlx @playwright/mcp@0.0.83`. Playwright MCP is not a dependency: it brings its own Playwright version, which breaks the e2e types.
3. `git fetch origin main` before any git step.

## 5. Rules that stay

- The decision register is not in this repository. Read the rule in the spec section, not the DR.
- If no rule answers a question, or the only fix is a workaround, or two rules disagree: report `UNRESOLVED_DESIGN_SYSTEM` and ask tajmin.
- Do not commit to `main`, also not for notes after a merge. The run 5 pull request merges in R5-02 on tajmin's explicit go.
