# Fact Lens Milestone 1: Homepage Prototype Report

8 October 2026 · Milestone 1, phase 3 · Status: **Finished, not deployed**

This report closes the homepage prototype sprint. The full list of findings, with a suggested solution for each, is `docs/prototype-findings.md`. The measured results are the FL-13 tables in `docs/PROGRESS.md`. The next steps are in `docs/HANDOVER.md`.

## 1. Result

- The homepage is built in Bangla (`/`) and English (`/en`), light and dark, with mock data only (`DR-01`).
- 13 of 14 tickets are Done. FL-14 Preview deploy is **Rejected**.
- All automatic checks pass. Three measured cases fail (Section 4).
- The build found 88 findings. 1 is High and 25 are Medium. Most need a decision from the blueprint project or the design owner, not more code.

### Why FL-14 was rejected

tajmin rejected the preview deploy on 8 October 2026. With 88 registered findings, of which many change how the page looks, a shared preview link would show a page that will change. The deploy is moved to the next milestone, after the fixes. No Vercel project was made and nothing was deployed.

## 2. Tickets

| Ticket | Title | Status | Main output |
| --- | --- | --- | --- |
| FL-01 | Project setup | Done | Next.js 16, Tailwind 4, Vitest, Playwright with axe, private repository |
| FL-02 | Design foundations | Done | Token CSS from the three specs, fonts, `[lang]` routes, theme switch, string tables |
| FL-03 | Layout parts | Done | `Shell`, `WithRail`, `Wrapper`, `Rail`, `SectionHeading`, `PeerRow`, `AdRow` |
| FL-04 | Mock content | Done | 52 bilingual stories, full and sparse variants, placeholder images |
| FL-05 | Header | Done | Top ad, sticky top bar, nav row, drawer, search dialog |
| FL-06 | Hero | Done | P-1: lead, two top stories, Latest rail |
| FL-07 | বিশ্লেষণ ও মতামত | Done | P-4 on `surface-elevated` |
| FL-08 | Featured categories | Done | P-2 for বাংলাদেশ and ভূরাজনীতি |
| FL-09 | Grouped categories | Done | P-3 with `ad-inset`, newsletter and daily poll (mock) |
| FL-10 | Most read | Done | P-5: numbered list 4 + 1 (`DR-51`), Bangla digits |
| FL-11 | Regions | Done | P-3b: slider from 600, tabs on phones |
| FL-12 | Footer | Done | Minimum footer with social and site links |
| FL-13 | Final check | Done | Results table, screenshots in `docs/fl-13/` |
| FL-14 | Preview deploy (optional) | Rejected | Not done (Section 1) |

## 3. Checks

| Check | Result |
| --- | --- |
| `pnpm check` (lint, typecheck, 136 unit tests, build) | Pass, no warnings |
| `pnpm test:e2e` (400 tests, axe) | Pass, no serious or critical violations |
| 11 widths × bn/en × light/dark | Pass: no horizontal scroll, no clipped text |
| Sparse sections (`?content=sparse`) | Pass |
| Text spacing (WCAG 1.4.12) | Pass |
| Keyboard focus, sticky top bar, interface language | Pass: 70 Tab stops, each with the focus ring |
| Bangla nav row at 1280 | Pass: 7 of 7 items in one row |

Only Chromium was tested (IMP-07).

## 4. Failed and partial cases

From the FL-13 results table in `docs/PROGRESS.md`.

| # | Case | Result | Cause | Owner |
| --- | --- | --- | --- | --- |
| 5 | First screen at 1366×768 | Fail | Top ad, bar and nav use 386px; no headline is in view (DOC-23) | Blueprint |
| 8 | One very long Bangla compound word | Fail | Headline roles have no `overflow-wrap` (DOC-24); the page scrolls sideways | Blueprint (token file) |
| 11 | 200% browser text size | Fail | P-5, P-4 and the top bar scroll sideways at 320 to 1024 | tajmin: fix or accept (WCAG 1.4.4 allows it) |
| 7, 9 | Card with no image beside a card with an image | Note | A blank band of about 240px above the text (U-13) | Design owner |
| T1 | Lead headline dominance at 1024 | Partial | Top-card titles are about 1.2 times smaller than the lead only | Design owner |

## 5. Findings

| Kind | Count | High | Medium | Low | Open or to confirm | Workaround in code | Fixed or closed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `DOC-` spec issues | 24 | 1 | 9 | 14 | 12 | 12 | 0 |
| `U-` design-system gaps | 30 | 0 | 9 | 21 | 30 | 0 | 0 |
| `IMP-` code choices to confirm | 30 | 0 | 6 | 24 | 28 | 0 | 2 |
| `KIT-` Claude Code kit | 4 | 0 | 1 | 3 | 2 | 1 | 1 |
| **Total** | **88** | **1** | **25** | **62** | **72** | **13** | **3** |

### High and Medium items

| ID | Title | Severity | Status |
| --- | --- | --- | --- |
| DOC-01 | English block inside a Bangla page keeps Bangla type | High | Open |
| DOC-03 | Theme selector: `.dark` class against `data-theme` | Medium | Workaround |
| DOC-05 | No base rule for page background and text color | Medium | Workaround |
| DOC-08 | Ad heights and creative sizes have no tokens | Medium | Workaround |
| DOC-09 | 336×280 phone creative is wider than a 320px screen | Medium | Workaround |
| DOC-10 | Logo not centered at 320 and 360 | Medium | Open |
| DOC-19 | Rank numeral is read by screen readers | Medium | Workaround |
| DOC-20 | No slider CSS in §12.3 | Medium | Workaround |
| DOC-23 | No headline in the 1366×768 first screen | Medium | Open |
| DOC-24 | Headline roles have no `overflow-wrap` | Medium | Open |
| U-01 | English category labels | Medium | Open |
| U-02 | Card variants, radius, icons, motion | Medium | Open |
| U-04 | Theme switch and language switch look | Medium | Open |
| U-05 | No minimum touch target size | Medium | Open |
| U-07 | Region list under অঞ্চল | Medium | Open |
| U-08 | Logo asset and its role | Medium | Open |
| U-09 | Theme control in the bar | Medium | Open |
| U-13 | Card without image beside a card with image | Medium | Open |
| U-25 | Spacing inside forms has no tokens | Medium | Open |
| IMP-01 | Remembered English choice redirects only at `/` | Medium | To confirm |
| IMP-02 | shadcn CSS imports left out of `globals.css` | Medium | Decide before `shadcn add` |
| IMP-03 | Cookie redirect and CDN caching | Medium | Check before the first deploy |
| IMP-05 | shadcn `base-nova` preset | Medium | Decide before `shadcn add` |
| IMP-13 | Drawer and search use native `<dialog>` | Medium | To confirm |
| IMP-24 | Ad-inset count fixed in the markup | Medium | To confirm |
| KIT-01 | `visual-qa` agent switches theme with `data-theme` | Medium | Open |

## 6. What the prototype showed

1. **The specs are close, but not complete for code.** 24 spec issues, 12 with a workaround in code. Most are missing tokens (ads, overlap, slider, forms) or CSS blocks that do not work as copied (DOC-01, DOC-02, DOC-05, DOC-19).
2. **The design system has no component level.** All 30 `U-` items are component looks that the system does not define (`AGENTS.md` Section 8). Each has a neutral treatment that must not be called a Fact Lens standard.
3. **The top ad costs the first screen.** At 1366×768 no headline shows above the fold (DOC-23). This needs an editorial and commercial decision.
4. **Bangla text holds up.** Long headlines (3× the mock length) fit at every width. Only one unbroken compound word breaks the page (DOC-24).
5. **The layout rules are testable.** 400 browser tests check the layout rules at up to 14 widths. They are a safety net for the fixes.

## 7. Recommendation

Do not deploy until the blueprint project answers the High and Medium `DOC-` items, and the design owner closes the Medium `U-` items. Then fix the three failed cases and run FL-13 and FL-14 again. The order is in `docs/HANDOVER.md`.
