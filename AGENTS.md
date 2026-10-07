# Fact Lens Frontend: Agent Instructions

Version 1.1 · 7 October 2026 · For the homepage prototype

These instructions are for every coding agent (Claude Code, Codex, Cursor and others) and for human developers. Read all of this file before you change code.

## 1. Project

Fact Lens is a Bangladesh-first international news publisher. It publishes in Bangla and English. This repository is the new website frontend.

| Item | Status |
| --- | --- |
| Current work | Homepage prototype (Milestone 1, phase 3). Milestone 2 is full development and hosting |
| Data | Mock data only. Do not connect a backend (`DR-01`) |
| Pages | Homepage first. Do not start article or category pages until their layout pass is complete |
| Product | Fact Lens has no fact-checking product (`DR-18`) |

## 2. Authority

| Order | Source | Holds |
| --- | --- | --- |
| 1 | `docs/design-system/color-system.md`, `typography-system.md`, `spacing-layout-system.md` | Values, rules and copy-ready CSS |
| 2 | `docs/decisions/fact-lens-decision-register.html` | Approved decisions, `DR-01` and up |
| 3 | `docs/design-system/agent-contract.md` | Index of rule IDs, links, build order, check list |
| 4 | This file | How to work in this repository |
| 5 | Existing code | Only where items 1 to 4 have no decision |

If two sources do not agree, follow the higher source. Do not make a compromise. Stop and report the difference.

Paths in the design-system documents that start with `decisions/`, `audit/` or `source/` are in `docs/`. For example, `audit/fact-lens-ad-system-proposal.html` is `docs/audit/fact-lens-ad-system-proposal.html`. The documents also name `tools/agent-contract/gen_contract.py`. That tool is in the blueprint project, not in this repository. Do not look for it.

## 3. Stack

Approved in `DR-15`. Do not add a framework, a CSS library or a state library without approval.

| Part | Choice |
| --- | --- |
| Framework | Next.js 16, App Router, React 19 |
| Language | TypeScript, `strict: true` |
| Styles | Tailwind CSS 4 with the Fact Lens tokens. shadcn/ui for primitives |
| Fonts | `next/font/google` (see `typography-system.md` Section 8) |
| Package manager | pnpm. Do not use npm or yarn |
| Unit tests | Vitest and Testing Library |
| Browser tests | Playwright with `@axe-core/playwright` |
| Component gallery | Storybook, from phase 4. Not in the first prototype |
| Hosting | Vercel (Milestone 2) |

## 4. Commands

The repository must have these `package.json` scripts. If a script is missing, add it.

| Command | Does |
| --- | --- |
| `pnpm dev` | Starts the dev server on port 3000 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest, one run |
| `pnpm test:e2e` | Playwright tests, including the axe check |
| `pnpm build` | Production build |
| `pnpm check` | `lint`, `typecheck`, `test` and `build` in sequence |

## 5. Folder layout

```text
src/
  proxy.ts                 Next.js 16 proxy: rewrites paths without /en to bn
  app/
    globals.css            Imports the three token files. Nothing else
    [lang]/                bn and en. See Section 7
      layout.tsx           Sets <html lang>, fonts and the theme script
      page.tsx             Homepage
  components/
    ui/                    shadcn/ui primitives (generated, then cleaned)
    layout/                Shell, Wrapper, Rail, AdRow, SectionHeading
    header/                TopBar, NavRow, Drawer, SearchDialog
    home/                  One folder per pattern: hero, featured, grouped, regions, analysis-opinion, most-read
    story/                 Story card variants, list items
    ads/                   AdSlot and its placeholder creative
  content/                 Mock data, typed (see the mock-content skill)
  i18n/                    String tables: bn.ts and en.ts
  lib/                     Helpers (formatting dates and numbers per language)
  styles/
    colors.css             From color-system.md Section 5
    typography.css         From typography-system.md Section 8
    layout.css             From spacing-layout-system.md Section 12
tests/
  e2e/                     Playwright tests
docs/                      Specs and decisions. Read only (Section 10)
public/mock/               Placeholder images for mock stories
```

## 6. Rules that apply to every change

The rule IDs link to the full text through `docs/design-system/agent-contract.md` Section 5.

1. Use tokens and role utilities only. Do not type a hex value, a pixel size, `text-[...]` or another arbitrary value in a component (`COL-02`, `TYP-18`, `LAY-01`).
2. Copy token CSS from the specs. Do not type token values by hand. Do not change a token value.
3. Put theme logic in the tokens. Do not write `dark:` in a component (`COL-03`).
4. Use `ink`, `ink-secondary` and `ink-muted` for text. Do not use `text-primary`, `text-secondary` or `text-muted` for text (`TYP-14`).
5. Use `brand` for identity only, and `interactive` for controls (`COL-04`, `COL-05`).
6. Set `lang` on the page and on every block in the other language. Keep language differences in the tokens, not in components (`TYP-03`, `TYP-04`).
7. Do not make text smaller, condensed or clamped so that it fits (`TYP-08`, `TYP-09`). Do not set a fixed height on text containers (`LAY-17`).
8. Use the breakpoints phone, `sm` 600, `md` 768, `lg` 1024 and `xl` 1280 only. There is no `2xl` (`LAY-06`).
9. Keep content inside its container. Do not use `vw` or breakout tricks (`LAY-02`).
10. Keep the source order equal to the reading order. Do not use CSS `order` (`LAY-14`).
11. Homepage card rows have 1 card (phone) or 2 cards (from 600px). No 3-up or 4-up rows (`LAY-07`, `DR-44`). Most read is a numbered list of 4 + 1 (`DR-51`).
12. Ad rows are full width with no padding, margin or gutter. Reserve their height. No ad is sticky (`LAY-09` to `LAY-13`).
13. Only the top bar is sticky (`LAY-15`).
14. Every focusable element shows the focus ring (`COL-13`). Every control works with a keyboard.
15. Bangla pages show Bangla interface text only. English pages show English only (`T-27`; `typography-system.md` Section 7.1).
16. Do not add "Fact Check", ফ্যাক্টচেক or a verdict feature anywhere (`DR-18`). চীন is a region under অঞ্চল, not a navigation item (`DR-19`).

Before you do one of the things in `agent-contract.md` Section 8 ("If you are about to"), stop and read the rules it names.

## 7. Languages and URLs

- Bangla is at the root URL (`/`). English is under `/en` (`DR-17`).
- Use one route tree, `src/app/[lang]/`, with the values `bn` and `en`. A proxy rewrites paths without a language prefix to `bn`.
- When the reader selects a language, keep the choice in a cookie. Do not redirect by the browser language.
- Every interface string comes from `src/i18n/bn.ts` or `src/i18n/en.ts`. Both files have the same keys. Do not write interface text in a component.
- Format dates and numbers with `Intl` and the page language. Bangla pages use Bangla digits.

## 8. Gaps in the design system

The system does not yet define card variants, radius, elevation (except `COL-15`), icons, motion or the full footer.

For a gap:

1. Use a neutral treatment that obeys every rule in Section 6.
2. Do not call it a Fact Lens standard.
3. Add it to `docs/PROGRESS.md` under "Unresolved" as `UNRESOLVED_DESIGN_SYSTEM`, with the file and the component.

## 9. How to work

The work is a small sprint of tickets in `docs/SPRINT.md`. The goal is a simple prototype, not a full website.

1. **One ticket at a time.** Do the ticket that the user starts. Do not start the next ticket until the user accepts the current one.
2. **Plan, build, test, verify.** Show a short plan, build, add tests, then run every check in Section 11.
3. **Build from the shared parts.** Use `Shell`, `Wrapper`, `Rail` and `AdRow`. Do not repeat layout utilities in page code.
4. **Do not weaken tests.** Do not skip, disable or delete a test to make the suite pass.
5. **Hand over.** List each acceptance criterion as met or not met, and give the user test steps. Then stop.
6. **Record progress.** Keep the board in `docs/SPRINT.md` and `docs/PROGRESS.md` current.
7. **Commit on acceptance.** One commit per accepted ticket: `FL-06: Hero`, with the rule IDs on the next line.

## 10. What you must not change

- Do not edit `docs/design-system/`, `docs/decisions/`, `docs/audit/` or `docs/source/`. These files come from the blueprint project. If a spec is wrong or missing a value, stop and report it as a `DOC-` issue in your summary.
- Do not edit `.env` files or read secrets.
- Do not push to the remote or deploy unless the user asks.
- Do not add a dependency without saying why in your summary.

## 11. Definition of done

A task is done when all of these are true:

1. `pnpm check` passes with no new warnings.
2. `pnpm test:e2e` passes, including the axe check, with no serious or critical violations.
3. The section matches its row in `spacing-layout-system.md` Section 7.2 at every tier, and the sparse cases in Section 7.3.
4. The validation widths and content cases in `spacing-layout-system.md` Section 13 show no clipped text and no horizontal scroll.
5. Bangla and English, light and dark, keyboard focus and 200% zoom work.
6. `docs/SPRINT.md` and `docs/PROGRESS.md` are current.

## 12. Summary format

End each task with:

- Files changed
- Checks run and their results
- Failures that remain
- `UNRESOLVED_DESIGN_SYSTEM` items
- `DOC-` issues (the spec is wrong, unclear or does not agree with itself)
