# Fact Lens Web

The new website frontend for **Fact Lens**, a Bangladesh-first international news publisher. The site publishes in Bangla and English.

> Status: homepage prototype run 3 (Milestone 1): the fix run. It rebuilds the run 2 fixes that tajmin decided on 13 to 15 October 2026 (`DR-262` to `DR-344`) from the updated specs. Run 2 finished on 11 October 2026 and run 1 on 8 October 2026. Mock data only.
>
> Live preview: [fact-lens-web-ashy.vercel.app](https://fact-lens-web-ashy.vercel.app/) (Vercel). It is a prototype, not the production site.

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
| [Spacing and layout](docs/design-system/spacing-layout-system.md) | Breakpoints, shell, rail, homepage patterns, ads, rules `LAY-01` to `LAY-21` |
| [Components](docs/design-system/component-system.md) | Homepage component sheets, names, rules `CPT-01` to `CPT-16` and `N-01` to `N-05` |
| [Agent contract](docs/design-system/agent-contract.md) | Index of all rule IDs, the project decisions that a build needs, and the build order |

The docs are written in ASD-STE100 Simplified Technical English, so that people and AI agents read them the same way.

## Built with AI agents

This repository is built with Claude Code, under rules that humans and agents share:

- [`AGENTS.md`](AGENTS.md): instructions for every coding agent and developer
- [`CLAUDE.md`](CLAUDE.md): imports `AGENTS.md` and adds Claude Code details
- [`.claude/`](.claude): permissions, hooks that block raw design values, skills (`/ticket`, `/accept`, `/verify`, `/check-rules`) and review subagents
- [`docs/SPRINT.md`](docs/SPRINT.md): the tickets, each with a goal, acceptance criteria and the original prompt
- [`docs/PROGRESS.md`](docs/PROGRESS.md): the build log
- [`docs/prototype-findings.md`](docs/prototype-findings.md): findings and gaps from runs 1 and 2, with the decided fix for each
