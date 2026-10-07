# Fact Lens Web: Handover Note

8 October 2026 · End of Milestone 2 (homepage prototype)

For the next person or agent who works in this repository. Read this first, then `docs/milestone-2-report.md`.

## 1. State

| Item | State |
| --- | --- |
| Milestone 2 prototype | Finished. FL-01 to FL-13 Done, FL-14 Rejected |
| Deploy | None. No Vercel project exists |
| Branch | `main`, remote `git@github.com:tajmin/fact-lens-web.git` (private) |
| Data | Mock only (`src/content/`), `DR-01` |
| Pages | One route, `src/app/[lang]/page.tsx`: Bangla at `/`, English at `/en` |
| Checks | `pnpm check` and `pnpm test:e2e` pass (136 unit tests, 400 browser tests, Chromium only) |
| Open findings | 72 open or to confirm, 13 with a workaround in code (`docs/prototype-findings.md`) |

## 2. Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000 (Bangla), /en (English)
pnpm check        # lint, typecheck, unit tests, build
pnpm test:e2e     # browser tests with axe
```

- `?content=sparse` shows the sparse cases of `spacing-layout-system.md` Section 7.3 (IMP-11).
- The FL-13 measurement run: `pnpm exec playwright test --config tests/final-check/playwright.config.ts`. It is not part of `pnpm test:e2e`.

## 3. Where things are

| What | Where |
| --- | --- |
| Rules for agents and people | `AGENTS.md`, `CLAUDE.md`, `.claude/` |
| Specs and decisions (read only) | `docs/design-system/`, `docs/decisions/` |
| All findings, each with a suggested solution | `docs/prototype-findings.md` |
| FL-13 results tables, later ideas, `U-` table | `docs/PROGRESS.md` |
| Ticket board and acceptance criteria | `docs/SPRINT.md` |
| Milestone report | `docs/milestone-2-report.md` |
| FL-13 screenshots (about 13 MB) | `docs/fl-13/` |

## 4. Decisions needed before more code

These block the next fixes. Each ID has the detail and a suggested solution in `docs/prototype-findings.md`.

**Blueprint project (spec changes):**

1. DOC-01 (High): `:root` to `:root, :lang(en)` in `typography-system.md` §8.2, so English blocks on Bangla pages get English type.
2. DOC-24: `overflow-wrap` on the headline roles (fixes FL-13 case 8).
3. DOC-23: the top ad height against the first screen at 1366×768 (FL-13 case 5).
4. DOC-08, DOC-09, DOC-18: ad tokens and phone creative sizes.
5. DOC-20, DOC-21: slider CSS and the "4 in view" rule.
6. The other `DOC-` items with a workaround in code: confirm or replace the workaround.

**Design owner:**

1. U-02: card variants, radius, icons and motion. Most other `U-` items follow from this.
2. U-08: the logo asset, also for dark mode (FL-13 row 14).
3. U-13: a card with no image beside a card with an image (FL-13 cases 7 and 9).
4. U-05 and U-25: minimum touch target and form spacing tokens.
5. U-01, U-07, U-26: English category labels, the region list, the Bangla name of Most read.

**tajmin:**

1. FL-13 case 11 (200% text size): fix, or accept under WCAG 1.4.4.
2. FL-13 row T1: top-card title size against the lead.
3. IMP-02 and IMP-05: the shadcn preset and its CSS imports, before the first `shadcn add`.
4. IMP-01, IMP-13, IMP-24, IMP-27: confirm or change. The other `IMP-` items are Low.

## 5. Clean up early in the next milestone

- IMP-30: remove `docs/fl-13/` and `tests/final-check/` from the repository (keep them outside git if needed).
- IMP-11: remove `?content=sparse`, or keep it behind a dev check.
- IMP-07: add WebKit to Playwright (Bangla shaping on Safari).
- KIT-01, KIT-02: update the `visual-qa` agent (theme switch, more pages).

## 6. Before the first deploy

FL-14 was rejected, not dropped. When the fixes are in, run FL-13 again and then FL-14 (`docs/SPRINT.md`). Also:

- IMP-03: test `/` with and without the `fl-lang` cookie on the CDN; send `Cache-Control: private, no-store` on the redirect if needed.
- Links to `/story/<slug>`, `/latest`, `/analysis`, `/opinion` and the footer pages are 404 (IMP-18, IMP-22, IMP-29). Decide whether a preview may show them.

## 7. Working rules that stay

- One ticket at a time; `/ticket`, hand over, `/accept` (`CLAUDE.md`).
- Update `docs/prototype-findings.md` at the end of every ticket.
- Do not edit the read-only specs. Report a `DOC-` issue instead.
- Article and category pages wait for their layout pass (`AGENTS.md` Section 1).
