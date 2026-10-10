---
paths:
  - "src/components/**"
  - "src/app/**/*.tsx"
---

# Components

- Use token utilities, `type-*` role utilities and the Tailwind 4px scale classes only. No hex, no `text-[...]`, no arbitrary values, no Tailwind palette colors (`COL-01`, `COL-02`, `TYP-01`, `TYP-18`, `LAY-01`, `LAY-21`, `CPT-07`).
- No `dark:` (`COL-03`). No `2xl:` (`LAY-06`). No CSS `order` (`LAY-14`). No `vw` (`LAY-02`).
- Text color: `ink`, `ink-secondary`, `ink-muted` (`TYP-14`). Controls and links: `interactive` (`COL-05`). `brand` is for identity only (`COL-04`).
- Do not check the language in a component to change a font or size. The tokens do it through `lang` (`TYP-04`).
- No fixed height on a text container (`LAY-17`). No `line-clamp` and no `…` on news titles (`TYP-09`, `CPT-08`).
- Build each component from its sheet in `docs/design-system/component-system.md` Section 7. Use the approved names for components, parts and sections (`CPT-01` to `CPT-03`, `N-01` to `N-05`).
- A component reacts to its container width, not the viewport, unless its sheet names a page breakpoint (`CPT-04`).
- No `rounded-*` and no `border-radius` other than 0 (`CPT-05`). The ThemeToggle switch is the one exception. No border around a card (`CPT-06`).
- A value that one component uses is a scale class in that component. A value that two or more components share, or that is not a scale step, is a component token in `src/styles/components.css` (`CPT-07`, `LAY-21`).
- Draw the metadata separator in CSS. Do not type `·`, `|` or `•` (`CPT-10`).
- Section headings are plain text, not links (`CPT-13`). One `MoreLink` per section, at the end edge (`CPT-14`, `CPT-15`).
- Ad slots use `AdSlot` with a variant (`top`, `band`, `inset`, `rail`) and the `--ad-*` px tokens (`LAY-19`). Do not build the newsletter sign-up in prototype run 2 (`DR-239`).
- Use the layout parts in `src/components/layout/`: `Shell`, `Wrapper`, `Rail`, `SectionHeading`.
- After `shadcn add`, restyle the file to the Fact Lens sheet before use (`CPT-16`). Use only the shadcn components that `CPT-16` lists.
- Peer rows use subgrid and `--card-parts` (`spacing-layout-system.md` Section 8). One card variant per peer row (`LAY-08`).
- Every interactive element is a real `button` or `a`, works with the keyboard and shows the focus ring (`COL-13`).
- Interface text comes from `src/i18n/`. Do not write a string in a component.
- Default to Server Components. Add `"use client"` only to the part that needs state or events (drawer and its accordions, search dialog, theme controls, regions slider, poll).
