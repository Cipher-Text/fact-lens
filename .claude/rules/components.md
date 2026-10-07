---
paths:
  - "src/components/**"
  - "src/app/**/*.tsx"
---

# Components

- Use token utilities and `type-*` role utilities only. No hex, no `text-[...]`, no pixel values, no Tailwind palette colors (`COL-01`, `COL-02`, `TYP-01`, `TYP-18`, `LAY-01`).
- No `dark:` (`COL-03`). No `2xl:` (`LAY-06`). No CSS `order` (`LAY-14`). No `vw` (`LAY-02`).
- Text color: `ink`, `ink-secondary`, `ink-muted` (`TYP-14`). Controls and links: `interactive` (`COL-05`). `brand` is for identity only (`COL-04`).
- Do not check the language in a component to change a font or size. The tokens do it through `lang` (`TYP-04`).
- No fixed height on a text container (`LAY-17`). No `line-clamp` on headlines (`TYP-09`).
- Use the layout parts in `src/components/layout/`: `Shell`, `Wrapper`, `Rail`, `AdRow`, `SectionHeading`.
- Peer rows use subgrid and `--card-parts` (`spacing-layout-system.md` Section 8). One card variant per peer row (`LAY-08`).
- Every interactive element is a real `button` or `a`, works with the keyboard and shows the focus ring (`COL-13`).
- Interface text comes from `src/i18n/`. Do not write a string in a component.
- Files in `src/components/ui/` are shadcn/ui primitives. After `shadcn add`, remove their `dark:` classes and palette colors and map them to Fact Lens tokens.
- Default to Server Components. Add `"use client"` only to the part that needs state or events (drawer, search dialog, theme switch, regions slider, poll, newsletter form).
