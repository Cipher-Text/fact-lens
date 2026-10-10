---
paths:
  - "src/content/**"
  - "src/i18n/**"
---

# Mock content and strings

- Use the `mock-content` skill for the data shape and the sample rules.
- `bn.ts` and `en.ts` have the same keys. A Bangla page shows Bangla only; an English page shows English only.
- No "Fact Check", ফ্যাক্টচেক or verdict content (`DR-18`). চীন is a region under অঞ্চল, not a category (`DR-19`).
- No newsletter content in prototype run 2 (`DR-239`).
- Mock data must include the hard cases: long Bangla headlines, stories with no image, and sparse sections (`spacing-layout-system.md` Sections 7.3 and 13).
