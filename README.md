# Fact Lens Web

The new website frontend for **Fact Lens**, a Bangladesh-first international news publisher. The site publishes in Bangla and English.

> Status: production frontend (M2). The homepage and the article page are done; the article page merged into `dev` on 23 October 2026 (PR #8, hotfixes PR #9 and #10). Work goes on `dev`, one `page/<name>` branch per new page. Mock data only. Current state: [`docs/STATUS.md`](docs/STATUS.md).
>
> Live preview: [fact-lens-web-ashy.vercel.app](https://fact-lens-web-ashy.vercel.app/) (Vercel). Test and review only; not the final hosting.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui · `next/font` · pnpm · Vitest · Playwright with axe · Vercel

## Start

```bash
pnpm install
pnpm dev          # http://localhost:3000 (Bangla), /en (English)
pnpm check        # lint, typecheck, unit tests, build
pnpm test:e2e     # browser tests with accessibility checks (Chromium and WebKit)
pnpm test:e2e:chromium   # the gate: Chromium only (DR-289)
```

Supported browsers: the last 2 versions of Chrome (Android and desktop), Edge, Firefox and Safari (macOS and iOS). Chromium is the test gate; WebKit is a separate report until its failures are fixed ([`docs/webkit-failures.md`](docs/webkit-failures.md)); Firefox gets a manual check before Milestone 2 (`DR-341`).

## Design system

The design system was written before the code, as a blueprint. Each rule has a stable ID (`COL-`, `TYP-`, `LAY-`, `CPT-`, `N-`) and each decision has an ID (`DR-`). Commits and reviews cite these IDs.

| Document | Holds |
| --- | --- |
| [Color](docs/design-system/color-system.md) | Light and dark tokens, contrast results, rules `COL-01` to `COL-17` |
| [Typography](docs/design-system/typography-system.md) | Bangla and English roles, fonts, reader sizes, rules `TYP-01` to `TYP-25` |
| [Spacing and layout](docs/design-system/spacing-layout-system.md) | Breakpoints, shell, rail, homepage patterns, ads, rules `LAY-01` to `LAY-22` |
| [Components](docs/design-system/component-system.md) | Homepage and article page component sheets, names, rules `CPT-01` to `CPT-16` and `N-01` to `N-05` |
| [Agent contract](docs/design-system/agent-contract.md) | Index of all rule IDs, the project decisions that a build needs, and the build order |

The docs are written in ASD-STE100 Simplified Technical English, so that people and AI agents read them the same way.

## Built with AI agents

This repository is built with Claude Code, under rules that humans and agents share:

- [`AGENTS.md`](AGENTS.md): instructions for every coding agent and developer
- [`CLAUDE.md`](CLAUDE.md): imports `AGENTS.md` and adds Claude Code details
- [`.claude/`](.claude): permissions, hooks that block raw design values, skills (`/page`, `/checkpoint`, `/verify`, `/check-rules`) and review subagents
- [`docs/STATUS.md`](docs/STATUS.md): the current state
- [`docs/ISSUES.md`](docs/ISSUES.md): every open item, flag and decided issue
- `docs/briefs/`, `docs/progress/` and [`docs/spec-log/`](docs/spec-log): the brief, progress file and spec log of the page or task in progress; deleted after the merge (`AGENTS.md` Section 9)
