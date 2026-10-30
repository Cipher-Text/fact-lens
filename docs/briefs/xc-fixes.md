# xc-fixes brief

Branch `task/xc-fixes` · Issue: the 30 Oct 2026 cross-check (XC flags) · Plan approved by tajmin, 30 Oct 2026

## Goal

Fix the cross-check flags. Each change cites its decision: XC-02 DR-432, XC-04 DR-433, XC-06 DR-437, XC-11 DR-436, XC-16 DR-425, XC-17 DR-434, XC-18 DR-435, the PageTitle band DR-424; XC-05 adds the citations DR-418 to DR-421 and DR-393. Out of scope: the opinion two-part Eyebrow structure (only its separator glyph changes, XC-18); XC-10 is withdrawn. A choice that no DR or rule covers is a flag.

## Where

- Docs: `AGENTS.md`, `agent-contract.md`, `docs/STATUS.md`, `docs/ISSUES.md`, `.claude/skills/task/SKILL.md`, `docs/spec-log/` (article, category, home-most-read)
- Tokens: `src/styles/components.css` (`--color-page-title-band`, helper comments), C-43 `PageTitle`, C-08 `Eyebrow` separator (CPT-10)
- Pages: homepage regions (P-6, `src/components/home/regions/`), category formats row (`CategoryFormatsSection`), homepage P-3 check, topic page robots (`src/app/[lang]/topic/[slug]/page.tsx`)
- Specs at the final checkpoint: color 2.1, 2.9; component-system Section 6, CPT-07, C-08, C-12, C-14, C-23, C-43; layout 7.1, 7B.1 to 7B.3, 7C, 7E, Section 10

## Rules

DR-418 to DR-421, DR-393, DR-423 to DR-437; CPT-07, CPT-10, C-08, C-43, COL-02, COL-04, COL-05, N-05, LAY-14.

## Checkpoints

1. Docs and rules, no code: lift the homepage lock (XC-17), contract Section 5 versions (XC-07), remove U-51 (XC-08), U-48 text (XC-09), full spec logs (XC-14), backend sitemap item (XC-02)
2. Tokens and Eyebrow separator: `--color-page-title-band` (XC-16), CPT-10 separator (XC-18), helper comments (XC-06), unit tests
3. Page code: region columns `format` Eyebrow (XC-04), fixed halves in the formats row (XC-11), topic robots below 3 stories (XC-02), tests
4. Final `/checkpoint`: spec text from the green spec-log items, XC-05 citations, checks, full Chromium e2e, design review, STATUS, ISSUES
5. Commit, PR to `dev`, after the merge; delete `page/category-v2` only on tajmin's explicit yes (XC-15)

## Test files

- Unit: `src/components/story/story-units.test.tsx` and the tests of the changed components
- e2e: `tests/e2e/regions.spec.ts`, the category page and topic page specs (empty half, robots meta); full `pnpm test:e2e:chromium` (token CSS changes)
