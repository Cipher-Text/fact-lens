# Fact Lens Web

The new website frontend for **Fact Lens**, a Bangladesh-first international news publisher. The site publishes in Bangla and English.

> Status: homepage prototype run 1 (Milestone 1, phase 3) finished on 8 October 2026, not deployed. Mock data only. See [`docs/HANDOVER.md`](docs/HANDOVER.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui · `next/font` · pnpm · Vitest · Playwright with axe · Vercel

## Start

```bash
pnpm install
pnpm dev          # http://localhost:3000 (Bangla), /en (English)
pnpm check        # lint, typecheck, unit tests, build
pnpm test:e2e     # browser tests with accessibility checks
```

## Design system

The design system was written before the code, as a blueprint. Each rule has a stable ID (`COL-`, `TYP-`, `LAY-`) and each decision has an ID (`DR-`). Commits and reviews cite these IDs.

| Document | Holds |
| --- | --- |
| [Color](docs/design-system/color-system.md) | Light and dark tokens, contrast results, rules `COL-01` to `COL-15` |
| [Typography](docs/design-system/typography-system.md) | Bangla and English roles, fonts, reader sizes, rules `TYP-01` to `TYP-24` |
| [Spacing and layout](docs/design-system/spacing-layout-system.md) | Breakpoints, shell, rail, homepage patterns, ads, rules `LAY-01` to `LAY-18` |
| [Agent contract](docs/design-system/agent-contract.md) | Index of all rule IDs and the build order |
| [Decision register](docs/decisions/fact-lens-decision-register.html) | Approved decisions `DR-01` and up |

The docs are written in ASD-STE100 Simplified Technical English, so that people and AI agents read them the same way.

## Built with AI agents

This repository is built with Claude Code, under rules that humans and agents share:

- [`AGENTS.md`](AGENTS.md): instructions for every coding agent and developer
- [`CLAUDE.md`](CLAUDE.md): imports `AGENTS.md` and adds Claude Code details
- [`.claude/`](.claude): permissions, hooks that block raw design values, skills (`/ticket`, `/accept`, `/verify`, `/check-rules`) and review subagents
- [`docs/SPRINT.md`](docs/SPRINT.md): the tickets, each with a goal, acceptance criteria and the original prompt
- [`docs/PROGRESS.md`](docs/PROGRESS.md): the build log
