---
paths:
  - "tests/**"
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
---

# Tests

- Do not skip, disable, delete or loosen a test to make the suite pass. Fix the cause.
- Each page section has a Playwright test that loads the page in both languages (for example `/` and `/en`), checks the section renders, and runs axe with no serious or critical violations.
- Test the validation widths in `spacing-layout-system.md` Section 13 with `page.setViewportSize`. Check that `document.documentElement.scrollWidth` is not larger than the viewport width.
- Test keyboard use for the drawer, search dialog, regions slider and tabs (`spacing-layout-system.md` Sections 6 and 7.4).
- Use `prefers-reduced-motion` emulation to test that animation stops.
- Test 200% browser text size (`spacing-layout-system.md` Section 13). Report what you find. Do not choose a stacking trigger yourself (`agent-contract.md` Section 9).
