---
paths:
  - "src/styles/**"
  - "src/app/globals.css"
---

# Token files

- These files hold the Fact Lens tokens. Copy them from the specs. Do not type or change a value by hand (`COL-02`, `TYP-18`, `LAY-01`).
- `colors.css` comes from `docs/design-system/color-system.md` Section 5.
- `typography.css` comes from `docs/design-system/typography-system.md` Section 8.
- `layout.css` comes from `docs/design-system/spacing-layout-system.md` Section 12.
- `globals.css` imports Tailwind and the three files. Put nothing else in it.
- Remove the default shadcn/ui color variables that the Fact Lens files replace. Keep the shadcn/ui names that `color-system.md` Section 5 maps.
- If a spec CSS block does not compile, stop and report a `DOC-` issue. Do not change the value to make it compile.
