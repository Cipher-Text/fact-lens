# Fact Lens Homepage Prototype: Progress

Claude Code reads the "Now" section at the start of each session. `/ticket` and `/accept` keep this file current. The tickets are in `docs/SPRINT.md`.

## Now

- Ticket: FL-02 Design foundations
- Status: To do
- Next action: tajmin types `/ticket`

## Done

| Date | Ticket | Notes |
| --- | --- | --- |
| 2026-10-07 | FL-01 Project setup | Next.js 16.3.8, Tailwind 4, Vitest, Playwright with axe, shadcn init (base-nova, no components). `agentRules: false` keeps `AGENTS.md` unchanged. Private repo `tajmin/fact-lens-web` |

## Later

Ideas that are outside the current ticket.

- FL-01: `shadcn init` used the default `base-nova` preset (Base UI primitives, `lucide-react` icons, `tw-animate-css`). Icons and motion are design-system gaps (U-02). Check this choice before the first `shadcn add`.
- FL-01: `next.config.ts` sets `agentRules: false`. Without it, `next dev` writes a Next.js block into `AGENTS.md` when it detects an AI agent. The block says to read the bundled docs in `node_modules/next/dist/docs/`; the `next-devtools` MCP server points to the same docs.
- FL-01: Only the Playwright `chromium` project runs. Add WebKit and Firefox in FL-13 if wanted.

## Unresolved design-system items

| ID | File and component | Treatment used | Status |
| --- | --- | --- | --- |
| U-01 | English category labels | Working labels from the `mock-content` skill (`IA-06`) | Open |
| U-02 | Card variants, radius, icons, motion | Neutral treatment (`AGENTS.md` Section 8) | Open |
| U-03 | বিশ্লেষণ ও মতামত section background | `surface-elevated` (`DR-76`). Check the look in the prototype | Check |

## Spec issues (DOC-)

Report these to the blueprint project. Do not edit the specs here.

| Found | Spec and section | Problem | Status |
| --- | --- | --- | --- |
