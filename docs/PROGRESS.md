# Fact Lens Homepage Prototype: Progress

Claude Code reads the "Now" section at the start of each session. `/ticket` and `/accept` keep this file current. The tickets are in `docs/SPRINT.md`.

The complete report of findings and gaps, with a suggested solution for each, is `docs/prototype-findings.md`. Claude updates it at the end of every ticket. The tables below are the short status lists.

## Now

- Ticket: FL-04 Mock content
- Status: To do
- Next action: tajmin types `/ticket`

## Done

| Date | Ticket | Notes |
| --- | --- | --- |
| 2026-10-07 | FL-01 Project setup | Next.js 16.3.8, Tailwind 4, Vitest, Playwright with axe, shadcn init (base-nova, no components). `agentRules: false` keeps `AGENTS.md` unchanged. Private repo `tajmin/fact-lens-web` |
| 2026-10-07 | FL-02 Design foundations | Token CSS copied from the three specs; `next/font` with four families; `[lang]` routes with `src/proxy.ts` (Bangla at `/`, English at `/en`, `fl-lang` cookie); three-state theme switch set before first paint; `bn.ts`/`en.ts` string tables; temporary page `/foundations`. DOC-01 to DOC-07 in `docs/prototype-findings.md` |
| 2026-10-07 | FL-03 Layout parts | `Shell`, `WithRail`, `Wrapper`, `Rail`, `SectionHeading`, `PeerRow`/`PeerCard`, `AdRow` with `AdPlaceholder`; ad tokens in `src/styles/ads.css` (DOC-08); temporary page `/layout-parts`; Playwright at 11 widths. DOC-08, DOC-09, U-06, IMP-08, IMP-09 in `docs/prototype-findings.md` |

## Later

Ideas that are outside the current ticket.

- FL-01: `shadcn init` used the default `base-nova` preset (Base UI primitives, `lucide-react` icons, `tw-animate-css`). Icons and motion are design-system gaps (U-02). Check this choice before the first `shadcn add`.
- FL-01: `next.config.ts` sets `agentRules: false`. Without it, `next dev` writes a Next.js block into `AGENTS.md` when it detects an AI agent. The block says to read the bundled docs in `node_modules/next/dist/docs/`; the `next-devtools` MCP server points to the same docs.
- FL-01: Only the Playwright `chromium` project runs. Add WebKit and Firefox in FL-13 if wanted.
- FL-02: `globals.css` no longer imports `tw-animate-css` and `shadcn/tailwind.css` (the rule says Tailwind and the three token files only). The base-nova shadcn components need them for their `data-*` variants and animation. Decide before the first `shadcn add`. The packages stay installed.
- FL-02: The proxy redirects `/` to `/en` only when the `fl-lang` cookie is `en`. Other unprefixed URLs stay Bangla, so shared links open as sent. Check this choice with the editorial team.
- FL-02: Before deploy (FL-14), check that the CDN does not cache the cookie-based redirect at `/`.
- FL-02: `ThemeSwitch` and `LanguageSwitch` are in `src/components/header/` with a neutral look. FL-05 places them in the top bar.
- FL-03: `AdRow` cannot hide itself when its section is hidden (`LAY-13`). The page that composes the sections must drop both together.
- FL-03: Reader size A++ is not tested on `/layout-parts`. Cover it in FL-13.

## Unresolved design-system items

| ID | File and component | Treatment used | Status |
| --- | --- | --- | --- |
| U-01 | English category labels | Working labels from the `mock-content` skill (`IA-06`) | Open |
| U-02 | Card variants, radius, icons, motion | Neutral treatment (`AGENTS.md` Section 8) | Open |
| U-03 | বিশ্লেষণ ও মতামত section background | `surface-elevated` (`DR-76`). Check the look in the prototype | Check |
| U-04 | Theme switch and language switch look (`src/components/header/`) | Neutral bordered button group and text link; Tailwind spacing scale for padding | Open |
| U-05 | Minimum touch target size (no spec value; switches are about 33px) | None yet. Proposed `--target-min` 44px | Open |
| U-06 | Section heading rule thickness (`src/components/layout/SectionHeading.tsx`) | 1px `border-brand` top border | Open |

## Spec issues (DOC-)

Report these to the blueprint project. Do not edit the specs here.

| Found | Spec and section | Problem | Status |
| --- | --- | --- | --- |
| 2026-10-07 FL-02 | `typography-system.md` 8.2 | DOC-01: English role values are set on `:root` only. Custom properties inherit, so a `lang="en"` block inside a Bangla page keeps the Bangla fonts, sizes, line heights and case (measured: English lead 38.96px Noto Serif Bengali instead of 40.96px Source Serif 4). This breaks `TYP-03`. Suggested fix: change the selector `:root` to `:root, :lang(en)` (both blocks). Not changed here | Open |
| 2026-10-07 FL-02 | `color-system.md` 5 | DOC-02: The CSS block starts with `@import "tailwindcss"`, but the file is meant to be imported next to Tailwind. Copied without that line | Open |
| 2026-10-07 FL-02 | `color-system.md` 5 and `spacing-layout-system.md` 6 | DOC-03: Colors switch on the `.dark` class; layout §6 says "set `data-theme` before the first paint", and the `visual-qa` agent sets `data-theme="dark"` by hand, which changes nothing. Neither spec has CSS for "system". The theme script sets both the class and `data-theme`, and resolves "system" with `matchMedia` | Open |
| 2026-10-07 FL-02 | `typography-system.md` 3 and 8.2 | DOC-04: The role table has 23 roles, but 8.2 has 22 utilities: no `type-rank`. Its CSS is the `.rank-list` block in 7.1. Use that in FL-10 | Open |
| 2026-10-07 FL-02 | `color-system.md` 5 | DOC-05: No base rule sets the page background and text color, so the canvas stays white in dark mode. The layout sets `bg-background text-ink` on `<body>` | Open |
| 2026-10-07 FL-02 | `spacing-layout-system.md` 12.3 | DOC-06: `.shell`, `.with-rail` and the other container classes are not in a cascade layer, so they win over every Tailwind utility on the same element. Works, but `@utility` or `@layer components` would be safer | Open |
| 2026-10-07 FL-02 | `color-system.md` COL-13 and 2.8 | DOC-07: COL-13 names ring utilities, 2.8 gives values only; no shared focus CSS, offset color set by hand per surface | Open |
| 2026-10-07 FL-03 | `spacing-layout-system.md` 9 and 12.2 | DOC-08: Reserved ad heights and creative sizes are only in the Section 9 table; 12.2 has no tokens. Workaround: project file `src/styles/ads.css` (tajmin's choice), imported as a fourth file in `globals.css` | Open |
| 2026-10-07 FL-03 | `spacing-layout-system.md` 9, 12.3 and 13 | DOC-09: The 336×280 phone creative is wider than the 320 test width, and `.ad-row` has no column template, so the page scrolls sideways. Workaround: `grid-cols-1` on `AdRow`, `max-w-full` on the placeholder | Open |
