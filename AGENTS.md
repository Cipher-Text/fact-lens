# Fact Lens Frontend: Agent Instructions

Version 1.8 · 24 October 2026 · For the production frontend (M2). No sprints or tickets

These instructions are for every coding agent (Claude Code, Codex, Cursor and others) and for human developers. Read all of this file before you change code.

## 1. Project

Fact Lens is a Bangladesh-first international news publisher. It publishes in Bangla and English. This repository is the new website frontend.

| Item | Status |
| --- | --- |
| Current work | M2 production build, one page at a time (Section 9). State: `docs/STATUS.md`. Open items and flags: `docs/ISSUES.md` |
| Live preview | https://fact-lens-web-ashy.vercel.app/ (Vercel). Do not deploy unless tajmin asks |
| Data | Mock data only. Do not connect a backend (`DR-01`) |
| Pages | Homepage, article page and category page are done; the homepage is locked (`DR-370`), except P-5 most read (IMP-99). Start a new page only with its brief (Section 9) |
| Product | Fact Lens has no fact-checking product (`DR-18`) |

## 2. Authority

| Order | Source | Holds |
| --- | --- | --- |
| 1 | `docs/design-system/color-system.md`, `typography-system.md`, `spacing-layout-system.md`, `component-system.md` | Values, rules, component sheets and copy-ready CSS |
| 2 | `docs/design-system/agent-contract.md` | Index of rule IDs, project decisions (Section 7), links, build order, check list |
| 3 | This file | How to work in this repository |
| 4 | Existing code | Only where items 1 to 3 have no decision |

If two sources do not agree, follow the higher source. Do not make a compromise. Stop and report the difference.

The project decision register is not in this repository. Each decision that a build needs is in a spec or in `agent-contract.md` Section 7. A `DR-` ID in the docs is a reference only.

The design-system documents also name files and tools of the blueprint project, for example `components/fact-lens-component-register.html` and `tools/agent-contract/gen_contract.py`. They are not in this repository. Do not look for them. The names are in `component-system.md` Section 3.

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
| Component gallery | Storybook, later. Not in the prototype runs (`DR-88`) |
| Hosting | Vercel. Preview: https://fact-lens-web-ashy.vercel.app/. Production hosting is Milestone 2 |

## 4. Commands

The repository must have these `package.json` scripts. If a script is missing, add it.

| Command | Does |
| --- | --- |
| `pnpm dev` | Starts the dev server on port 3000 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest, one run |
| `pnpm test:e2e` | Playwright tests, including the axe check (Chromium and WebKit) |
| `pnpm test:e2e:chromium` | Playwright tests in Chromium only: the gate (`DR-289`) |
| `pnpm build` | Production build |
| `pnpm check` | `lint`, `typecheck`, `test` and `build` in sequence |

## 5. Folder layout

```text
src/
  proxy.ts                 Next.js 16 proxy: rewrites paths without /en to bn
  app/
    globals.css            The imports in spacing-layout-system.md §12.5, then the base rules of §12.4 (DR-339)
    [lang]/                bn and en. See Section 7
      layout.tsx           Sets <html lang>, fonts and the theme script
      page.tsx             Homepage
      story/[slug]/        Article page
      category/[id]/       Category page (one template, 6 categories)
  components/
    ui/                    shadcn/ui primitives, restyled after add (CPT-16): Sheet (Drawer), Drawer (SearchDialog, from the top), Collapsible, Tabs, RadioGroup
    layout/                Shell, Wrapper, Rail, WithRail, PeerRow, SectionHeading, Divider, PageTitle
    category/              Category page: CategoryPageView, CategoryFeatureSection, CategoryCards, CategoryMoreStoriesSection
    header/                SiteHeader, TopBar, NavBar, Drawer (shadcn Sheet), SearchDialog (shadcn Drawer), ThemeButton (DR-280, DR-349)
    home/                  One folder per section, with the parts that only that section uses:
                           hero (HeroSection), analysis (AnalysisSection, OpinionList),
                           featured (FeaturedCategorySection), grouped (GroupedCategoriesSection,
                           CategoryBlock, DailyPoll), most-read (MostReadSection,
                           RankedList), regions (RegionsSection, RegionSlider)
    story/                 Shared parts: LeadStory, OverlapCard, StoryCard, StoryImage, StoryListItem, StoryList,
                           Eyebrow, MetaLine, MoreLink, Chip, Button, IconButton, QuoteMark
    reader/                Article page: ReaderPage, ReaderRoot, ArticleParts, ContextCard, Controls, Popover, Share, SelectionShare, Toaster
    footer/                Footer, SocialIcon
    ads/                   AdSlot and its placeholder creative
  content/                 Mock data, typed (see the mock-content skill)
  i18n/                    String tables: bn.ts and en.ts
  lib/                     Helpers (formatting dates and numbers per language)
  styles/
    colors.css             From color-system.md Section 5
    typography.css         From typography-system.md Section 8
    layout.css             From spacing-layout-system.md Section 12
    components.css         From component-system.md Section 6
    reader.css             Article page component CSS (component-system.md Section 7, Article page)
tests/
  e2e/                     Playwright tests
docs/                      Specs, STATUS.md, ISSUES.md, briefs/ and spec-log/ per page. Specs are read only (Section 10)
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
11. Homepage card rows have 1 card (phone) or 2 cards (from 600px). No 3-up or 4-up rows (`LAY-07`, `DR-44`). Most read is a numbered list (RankedList, C-07): two list columns from 600px; from 1024px the middle and end of three columns, the start column empty (`DR-51`, `DR-145`, IMP-99). The regions slider shows 4 panels from 1280px (`DR-140`).
12. Ad rows are full width with no padding, margin or gutter. Reserve their height. No ad is sticky (`LAY-09` to `LAY-13`).
13. Only the site header is sticky: the TopBar and, from 1280, the NavBar. Past the NavBar row the NavBar hides under the TopBar (`LAY-15`).
14. Every focusable element shows the focus ring (`COL-13`). Every control works with a keyboard.
15. Bangla pages show Bangla interface text only. English pages show English only (`T-27`; `typography-system.md` Section 7.1).
16. Do not add "Fact Check", ফ্যাক্টচেক or a verdict feature anywhere (`DR-18`). চীন is a region under অঞ্চলসমূহ, not a navigation item (`DR-19`).
17. Build each component from its sheet in `component-system.md` Section 7. Use the approved names for components, parts and sections (`N-05`).
18. Do not round corners and do not put a border around a card. There is no exception (`CPT-05`, `CPT-06`).
19. When a sheet gives a value that has no token, add a component token in `src/styles/components.css` and use it (`CPT-07`).
20. Do not add a subscribe button to the header or the drawer (`DR-188`).
21. Do not show a Breaking or Live label (`COL-11`, `DR-279`).
22. Only the `.dark` class on `<html>` sets the theme. Do not use `data-theme` (`DR-281`). Keep the reader's choice in local storage, key `fl-theme` (`spacing-layout-system.md` Section 6, `DR-340`).
23. Do not install or import `tw-animate-css` (`DR-236`, `DR-285`).

Before you do one of the things in `agent-contract.md` Section 8 ("If you are about to"), stop and read the rules it names.

## 7. Languages and URLs

- Bangla is at the root URL (`/`). English is under `/en` (`DR-17`).
- Use one route tree, `src/app/[lang]/`, with the values `bn` and `en`. A proxy rewrites paths without a language prefix to `bn`.
- When the reader selects a language, keep the choice in a cookie (`fl-lang`). The remembered English choice redirects to `/en` only at `/`, with `Cache-Control: private, no-store`. Shared links open in their own language. Do not read the browser language (`DR-270`, `DR-328`).
- Every interface string comes from `src/i18n/bn.ts` or `src/i18n/en.ts`. Both files have the same keys. Do not write interface text in a component.
- Format dates and numbers with `Intl` and the page language. Bangla pages use Bangla digits.
- Paths (article, category, region, topic, hubs) follow `spacing-layout-system.md` Section 7C. An article is `/story/<slug>-<id>` for every format.

## 8. Gaps in the design system

There is no elevation: no shadows (`COL-15`, `DR-202`). The system defines the homepage and the article page (`component-system.md` C-27 to C-42, `spacing-layout-system.md` Section 7A). Other pages are defined per page, from the brief and the spec log. The footer is provisional (`DR-193`). `component-system.md` Section 8 lists the open items and what to do now.

For a gap:

1. Use a neutral treatment that obeys every rule in Section 6.
2. Do not call it a Fact Lens standard.
3. Add it to the page spec log and to `docs/ISSUES.md` as a `U-` row, with the file and the component.

### Flag before you decide

Solve every task from the design-system rules (`COL`, `TYP`, `LAY`, `CPT`, `N`). Stop, raise a flag to tajmin and do not decide yourself when:

1. No rule answers the question.
2. Your fix is a workaround that does not belong to the design system.
3. Your fix needs a new rule that contradicts an existing rule.

A flag gives: what is wrong, what you did, the rule IDs, your proposal and an example. Put it in your summary and as an "Open (flag)" row in `docs/ISSUES.md`. A choice is approved only when tajmin says so explicitly. "Next" or "go on" starts work; it does not approve a choice (`agent-contract.md` Section 9).

## 9. How to work

There are no sprints or tickets. One page is one branch, one brief and one spec log (`DR-370` to `DR-377`).

1. **Start.** tajmin types `/page <name>`. Make `page/<name>` from `dev` and set the page as in progress in `docs/STATUS.md` "Now". Ask tajmin the questions, then draft `docs/briefs/<name>.md` (one page at most) with 3 to 6 one-line checkpoints and the test files. Build only after tajmin says yes.
2. **Build in the browser, one checkpoint at a time.** At each checkpoint of the brief (not the final one):
   1. Finish the step and stop.
   2. Post a short note: what you built, and each new token or component you added.
   3. tajmin gives tweaks in chat. Each tweak snaps to the nearest token, or you add a named new token (`CPT-07`).
   4. Start the next checkpoint only when tajmin says "next". Do not run the full checks, update the spec log or commit at these checkpoints.

   Build from the shared parts (`Shell`, `Wrapper`, `Rail`, `AdSlot`, `SectionHeading`, the story units). Do not repeat layout utilities in page code.
3. **Final checkpoint.** Run `/checkpoint` at the last checkpoint, or when tajmin asks, not after each checkpoint: the checks (Section 11), the spec log `docs/spec-log/<name>.md`, the `design-reviewer` subagent, the spec update in `docs/design-system/` from the green items, `docs/STATUS.md`, `docs/ISSUES.md`, and a report. Green spec-log items are approved by tajmin's merge; red items are flags.
4. **Commit only on tajmin's yes.** One commit per yes on the page branch: `<page>: <what>` on the subject line, the rule IDs on the next line. Do not add a `Co-Authored-By` trailer or any other agent attribution; commits and pull requests carry only tajmin's name.
5. **Pull request.** Open a PR from `page/<name>` to `dev`. The design-system updates for the page go in the same PR. When the review shows issues, fix them, but do not commit before tajmin approves. The merge is tajmin's approval. Nothing changes after the merge.
6. **After the merge.** Run the full `pnpm test:e2e:chromium` on `dev` (the PR changed the specs).
7. **Do not weaken tests.** Do not skip, disable or delete a test to make the suite pass.

## 10. What you must not change

- Edit `docs/design-system/` only on a `page/<name>` branch, at the final checkpoint, from the green spec-log items (Section 9). A hook blocks spec edits on every other branch, so the specs do not change after a merge. If a spec is wrong or missing a value, report it as a `DOC-` issue.
- Do not edit `.env` files or read secrets.
- Do not push to the remote or deploy unless the user asks.
- Do not add a dependency without saying why in your summary.

## 11. Definition of done

A task is done when all of these are true:

1. `pnpm check` passes with no new warnings.
2. Chromium e2e passes on the brief's "Test files" and on every test file the work adds or changes (`pnpm exec playwright test --project=chromium <files>`). Run the full `pnpm test:e2e:chromium` when the work changes the token CSS (`src/styles/`), the layout parts (`src/components/layout/`) or the string tables (`src/i18n/`), and on `dev` after each merge. The run passes, including the axe check, with no serious or critical violations. WebKit runs as a separate report until its failures are fixed; do not let a WebKit failure block the work, and do not skip the test (`DR-289`).
3. Homepage: each section matches its row in `spacing-layout-system.md` Section 7.2 at every tier, and the sparse cases in Section 7.3. Article page: Section 7A. Other pages: the brief.
4. Each component passes the checks in its sheet (`component-system.md` Section 7).
5. The validation widths and content cases in `spacing-layout-system.md` Section 13 show no clipped text and no horizontal scroll.
6. Bangla and English, light and dark, keyboard focus and 200% zoom work. Supported browsers are in `agent-contract.md` Section 10 (`DR-341`).
7. The spec log, `docs/STATUS.md` and `docs/ISSUES.md` are current.

## 12. Summary format

End each task with:

- Files changed
- Checks run and their results
- Failures that remain
- `UNRESOLVED_DESIGN_SYSTEM` items
- `DOC-` issues (the spec is wrong, unclear or does not agree with itself)
- Flags (Section 8): choices that need tajmin's approval
