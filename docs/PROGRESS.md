# Fact Lens Homepage Prototype: Progress

Claude Code reads the "Now" section at the start of each session. `/ticket` and `/accept` keep this file current. The tickets are in `docs/SPRINT.md`.

The complete report of findings and gaps, with a suggested solution for each, is `docs/prototype-findings.md`. Claude updates it at the end of every ticket. The tables below are the short status lists.

## Now

- Milestone 1 homepage prototype: finished on 8 October 2026
- Prototype run 2: started 11 October 2026 on branch `prototype-run-2` (never commit or push to `main` until R2-21)
- Ticket: none. R2-07 is Done
- Next action: R2-08 Hero (P-1), after tajmin types `/ticket`

## FL-13 results

Measured on 7 October 2026 in Chromium. Screenshots in `docs/fl-13/` (removed in R2-01; see git history). Measurement run: `pnpm exec playwright test --config tests/final-check/playwright.config.ts` (records only, not part of `pnpm test:e2e`). Result values: Pass, Fail, Note, N/A (no article page yet).

### Spacing and layout (`spacing-layout-system.md` Section 13) and `/verify`

| # | Case | Result | What was measured | Possible fix (pick by number) | Screenshots |
| --- | --- | --- | --- | --- | --- |
| 1 | `pnpm check` | Pass | Lint, typecheck, 136 unit tests, build; no warnings | — | — |
| 2 | `pnpm test:e2e` | Pass | 400 tests after the temporary pages left (489 before), axe has no serious or critical violations | — | — |
| 3 | 11 widths × bn/en × light/dark, at reader size 1 and A++ | Pass | 44 page loads: no horizontal scroll, no clipped text, no text outside the viewport | — | `full-*-*.jpg` |
| 4 | A++ on the homepage | Note | A++ changes no homepage size: only article roles scale (TYP-15) | — | — |
| 5 | First screen 1366×768 (650px viewport) | Fail | Top ad 274 + bar 64 + nav 48 = 386; hero starts at 426 (40px section space). Hero in view: 224px (spec estimate 264), the top of the lead image only. No headline in the first screen, bn or en | (a) Report as DOC-23: the 264 estimate leaves out the section space, and the 274px top ad leaves no headline in view; ask the blueprint for a decision. (b) No code change until then | `first-screen-*-1366x650.jpg` |
| 6 | Bangla nav row at 1280 | Pass | 7 of 7 items, one row, 48px high, also at 1366 and 1920 | — | `nav-row-bn-1280.png` |
| 7 | Two top-story cards at 1024 and 1280 | Note | Rows line up (subgrid). bn 1024: left title 8 lines at 30px in a 312px card. The right card has no image, so a blank band of about 240px is above its text (U-13) | (a) Show a card without an image as text only, with no blank band (needs a U-13 decision). (b) Leave as is | `top-cards-*.png`, `hero-*-1024.png` |
| 8 | Long Bangla headlines | Pass / Fail | Mock: longest 198 characters, 5 to 6 lines, fits. Stress test with all headlines 3× longer in normal words: fits at 320, 600, 1024, 1280. One 40-letter compound word: horizontal scroll at every width (no `overflow-wrap`) | Add `overflow-wrap: break-word` to the headline roles. It is a token-file change (TYP-20), so it needs a DOC- issue first | `long-headlines-bn-*.jpg` |
| 9 | Stories with no image | Note | 26 of 44 story items have no image; no clipping. Blank band in the top cards (#7). In Regions, a column with no image starts its headline level with the images in the other columns (visual-qa) | As #7 (a) | `full-bn-light-1366.jpg` |
| 10 | Sparse sections (`?content=sparse`) | Pass | bn/en at 360, 768, 1280: no faults, no two ad rows next to each other; P-3 keeps the empty half row (7.3) | — | `sparse-*.jpg` |
| 11 | 200% text size (browser font-size setting) | Fail | Horizontal scroll at 320/360 (top-bar language link, P-4 items, P-5), 600 en (P-5), 768 (top-bar Subscribe), 1024 (P-5). Fine at 1280. Page zoom 200% equals half the width, so row 3 covers it: Pass | (a) Let the P-5 grid and the P-4 image row stack when the text is large (`minmax(min-content, …)` or a container query). (b) Let the top bar wrap. (c) Accept: WCAG 1.4.4 allows scroll at 200% text | — |
| 12 | Text spacing (WCAG 1.4.12) | Pass | Line height 1.5, letters 0.12em, words 0.16em, paragraphs 2em: no scroll or clipping at 320 to 1280 | — | — |
| 13 | Keyboard focus, sticky, interface language (visual-qa) | Pass | 70 Tab stops at 1280: every stop has the ring; only the top bar sticks; no wrong-language text | — | — |
| 14 | Dark theme (visual-qa) | Note | Logo about 2:1 on the dark bar (U-08, logo exempt). Gray mock images look bright in dark | (a) Logo color for dark mode, with U-08. (b) Darker placeholder in dark mode | `full-*-dark-*.jpg` |
| 15 | Regions slider at 1280 (visual-qa) | Note | Native scrollbar shows under the row; the next column shows at the edge | Decide IMP-27 (hide the scrollbar or keep it) | — |
| 16 | Remove the temporary pages from FL-02 and FL-03 | Pass | Removed `/foundations`, `/layout-parts`, their specs, `ThemeSwitch.tsx` and the `foundations`/`layoutParts` string keys. Their site checks moved to `tests/e2e/site.spec.ts` (language, cookie, theme, fonts) and `tests/e2e/page.spec.ts` (every ad row at 11 widths, brand rule). Build has one route, `/[lang]` | — | — |

### Typography prototype checks (`typography-system.md` Section 9)

Sizes measured in px (bn / en).

| # | Item | Result | What was measured | Possible fix |
| --- | --- | --- | --- | --- |
| T1 | Hero: lead dominant at 1024; Bangla rail titles fit at 304 | Partial | Lead title 36.7 / 38.7 against top-card titles 30.3 / 31.8 (about 1.2 times). The 648px lead image carries the hierarchy; the titles compete. Rail 304px: no title overflows | (a) Top cards use `type-story-title` (24.9) instead of `type-story-title-lg`. (b) Leave as is |
| T2 | Article title | N/A | No article page | — |
| T3 | Article headings at A++ | N/A | No article page | — |
| T4 | Bangla article body | N/A | No article page | — |
| T5 | Bangla small text (eyebrow, metadata, caption) | Pass (tajmin confirms by eye) | Eyebrow, metadata and `type-ui-sm` are 15px Noto Sans Bengali; English 14px | — |
| T6 | Source Serif 4 size | tajmin judges | English 1280: lead 42, top cards 34, titles 26, small titles 20, summary 16. No body text on the homepage | — |
| T7 | Rail titles in the 304px rail | Pass | bn `type-story-title-sm` 19.4–20, `type-summary` 17; 2 to 3 lines; no overflow | — |
| T8 | Reader sizes A+ / A++ | N/A on the homepage | Only article roles scale; the homepage layout does not change at A++ (row 3) | — |
| T9 | Colors | Note | No color values changed. See row 14 | — |

## Done

| Date | Ticket | Notes |
| --- | --- | --- |
| 2026-10-07 | FL-01 Project setup | Next.js 16.3.8, Tailwind 4, Vitest, Playwright with axe, shadcn init (base-nova, no components). `agentRules: false` keeps `AGENTS.md` unchanged. Private repo `tajmin/fact-lens-web` |
| 2026-10-07 | FL-02 Design foundations | Token CSS copied from the three specs; `next/font` with four families; `[lang]` routes with `src/proxy.ts` (Bangla at `/`, English at `/en`, `fl-lang` cookie); three-state theme switch set before first paint; `bn.ts`/`en.ts` string tables; temporary page `/foundations`. DOC-01 to DOC-07 in `docs/prototype-findings.md` |
| 2026-10-07 | FL-03 Layout parts | `Shell`, `WithRail`, `Wrapper`, `Rail`, `SectionHeading`, `PeerRow`/`PeerCard`, `AdRow` with `AdPlaceholder`; ad tokens in `src/styles/ads.css` (DOC-08); temporary page `/layout-parts`; Playwright at 11 widths. DOC-08, DOC-09, U-06, IMP-08, IMP-09 in `docs/prototype-findings.md` |
| 2026-10-07 | FL-04 Mock content | 52 bilingual stories in `src/content/`, read through `getHomepage(lang, { variant })` with full and sparse versions; category and region labels in the string tables; placeholder SVGs in `public/mock/`; ESLint rule keeps components on `@/content` (DR-01). U-07, IMP-10 to IMP-12 in `docs/prototype-findings.md` |
| 2026-10-07 | FL-05 Header | Top ad above a sticky top bar (`1fr auto 1fr`); nav row from 1280 that hides items that do not fit; drawer and search dialog as native modal dialogs with keyboard focus handling; one-button theme toggle. DOC-10 to DOC-12, U-08 to U-10, IMP-13 to IMP-17 in `docs/prototype-findings.md` |
| 2026-10-07 | FL-06 Hero | `Hero` with `LeadStory` (64px panel overlap from 768, inset end for the cut corner), two `StoryCard` top stories on a subgrid peer row, `LatestList` rail (2 columns at 600–1023); ad-band after the hero; `?content=sparse`; `formatTime` and `fill` helpers; Playwright at 12 widths. DOC-13 to DOC-15, U-11 to U-14, IMP-18 to IMP-20 in `docs/prototype-findings.md` |
| 2026-10-07 | FL-07 বিশ্লেষণ ও মতামত | `AnalysisOpinion` in the shell on `surface-elevated` (margin outside the background), `AnalysisList` (image beside text) and `OpinionList` (মতামত chip as the column heading, quote icon, author and time), 2 equal columns from 768, one column spans when the other is empty; shared `MoreLink`; elevated link classes for the focus ring offset; Playwright at 13 widths. DOC-16, U-15 to U-17, IMP-21, IMP-22 in `docs/prototype-findings.md` |
| 2026-10-07 | FL-08 Featured categories | `FeaturedCategory` for বাংলাদেশ and ভূরাজনীতি: `FeaturedLead` (text under the image to 1279, beside it from 1280, DR-55) and `FeaturedRail` (one image story and two stories; 2 columns at 600–1023); wrapper spans the shell with no rail stories; ad-band after each; `category-<id>` anchors; Playwright at 14 widths. DOC-17, U-18 to U-20, IMP-23 in `docs/prototype-findings.md` |
| 2026-10-07 | FL-09 Grouped categories | `GroupedCategories` (P-3): rows of two `CategoryBlock`s (one on phones) with an `ad-inset` between rows at wrapper width (3 or fewer); rail with `NewsletterSignup` (error, sending, done; mock) and `DailyPoll` (one vote per browser in local storage, result bars, largest-remainder percents); `#category-<id>` and `#newsletter` anchors; Playwright at 14 widths. DOC-18, U-21 to U-25, IMP-24 to IMP-26 in `docs/prototype-findings.md` |
| 2026-10-07 | FL-10 Most read | `MostRead` (P-5): `<ol class="rank-list">` with the 7.1 `type-rank` CSS copied to `typography.css` (DOC-04), 1 / 2 from 600 / 4 from 1024 with item 5 alone on row 2 (DR-51), Bangla digits by the `bengali` counter, numeral hidden from screen readers with empty alt text (DOC-19); title-only items; ad-band after; Playwright at 14 widths. DOC-19, U-26, U-27 in `docs/prototype-findings.md` |
| 2026-10-07 | FL-11 Regions | `Regions` (P-3b): one markup for slider and tabs. From 600 a scroll-snap row (2 in view, 4 from 1024) with previous/next buttons in the heading row, 250ms scripted scroll, none with reduced motion, `aria-disabled` at each end; below 600 chip tabs with arrow keys, Home and End. No buttons with 4 regions or fewer. `#regions` and `#region-<id>` anchors (a link selects the tab on phones). Shared `StoryStack`; `SectionHeading` `actions` slot; Playwright at 14 widths. DOC-20, DOC-21, U-28, U-29, IMP-27, IMP-28 in `docs/prototype-findings.md` |
| 2026-10-07 | FL-12 Footer | `SiteFooter` (7.1 row 15, 7.4, DR-59): full-width row with a 1px rule and the content in the shell; logo and four social icon links (inline Simple Icons CC0 marks, text names for screen readers), then About, Contact, Corrections, Privacy and Terms in the page language; `footer` keys in the string tables; Playwright at 14 widths. DOC-22, U-30, IMP-29 in `docs/prototype-findings.md` |
| 2026-10-08 | FL-13 Final check | Temporary pages `/foundations` and `/layout-parts` removed; their site checks moved to `tests/e2e/site.spec.ts` and `tests/e2e/page.spec.ts`. Section 13 and typography §9 results table below, screenshots in `docs/fl-13/`, measurement run in `tests/final-check/` (both to leave the repository next milestone, IMP-30). No fixes picked yet. DOC-23, DOC-24, IMP-30 in `docs/prototype-findings.md` |
| 2026-10-08 | FL-14 Preview deploy | Rejected by tajmin: with 88 findings registered, a preview link is not useful now. No deploy. Milestone closed; report in `docs/milestone-1-report.md`, handover in `docs/HANDOVER.md`. IMP-03 moves to the next milestone |
| 2026-10-11 | R2-00 Start the run 2 branch | Branch `prototype-run-2` made from `main` (a200b56) and pushed. Accept skill pushes the current branch, stops on `main`, adds the run 2 log row (3b) and the hash commit (4b) |
| 2026-10-11 | R2-01 Clean up from run 1 | `docs/fl-13/` and `tests/final-check/` removed; `?content=sparse` only in development; WebKit project in Playwright (header tests pass). IMP-07, IMP-11, IMP-30 done |
| 2026-10-11 | R2-02 Foundations CSS | `colors.css`, `typography.css`, `layout.css` are the spec blocks; `ads.css` deleted; §12.4 base rules in `globals.css`, `AGENTS.md` §5 updated (KIT-05). Components still on removed tokens are listed under Later. IMP-31, IMP-32 decided |
| 2026-10-11 | R2-03 Mock content | `getAd(slot, lang)` with one mock booking per ad slot and six gray SVG creatives; tests for poll, ads, story ids (also sparse) and no newsletter content. Newsletter code stays until R2-11 (IMP-33). IMP-34 |
| 2026-10-11 | R2-04 Small parts | `components.css` imported; `Divider`, `SectionHeading`, `MoreLink`, `Eyebrow`, `MetaLine`, `Chip`, `Button`, `IconButton` built from their sheets and callers moved; headline links use the base focus outline. 106 e2e tests stay red from before (R2-05, R2-06, R2-11, R2-12). DOC-25, DOC-26, IMP-35 to IMP-38 |
| 2026-10-11 | R2-05 Page chrome | `TopBar`, `NavBar`, `Drawer`, `SearchDialog`, `ThemeButton`, `ThemeToggle`, `SearchForm` built from C-12 and C-17 to C-20; two-state theme (DR-201); no subscribe button (DR-188); footer and Drawer share 5 social links. Header e2e green; 78 e2e tests stay red from before (R2-06, R2-11, R2-12). Flags open: IMP-39, IMP-40, IMP-41. DOC-27, DOC-28, U-31, U-32, IMP-39 to IMP-43 |
| 2026-10-11 | R2-06 Ad slots and page frame | `AdSlot` (top, band, inset, rail) replaces `AdRow` and `AdPlaceholder`: one `<picture>` per slot, reserved height from the `--ad-*` tokens, region named by the label; the rail variant goes into the P-3 rail in R2-11. Reserved-height tests with and without the creative. 28 chromium e2e tests stay red (`most-read`, R2-12). DOC-29, IMP-44 to IMP-46 |
| 2026-10-11 | R2-07 Story units | `LeadStory`, `OverlapCard`, `StoryCard` (4 layouts, 2 splits), `StoryList`, `StoryListItem`, `StoryImage` in `components/story/`, from C-01, C-02, C-03, C-24, C-25; news links hover ink-muted; Hero and LatestList moved onto them; dev-only test page `/dev/story-units`. Flags open: U-33, IMP-48. DOC-30, IMP-47 |

## Later

Ideas that are outside the current ticket.

- FL-01: `shadcn init` used the default `base-nova` preset (Base UI primitives, `lucide-react` icons, `tw-animate-css`). Icons and motion are design-system gaps (U-02). Check this choice before the first `shadcn add`.
- FL-01: `next.config.ts` sets `agentRules: false`. Without it, `next dev` writes a Next.js block into `AGENTS.md` when it detects an AI agent. The block says to read the bundled docs in `node_modules/next/dist/docs/`; the `next-devtools` MCP server points to the same docs.
- FL-01: Only the Playwright `chromium` project runs. Add WebKit and Firefox in FL-13 if wanted. FL-13: still Chromium only; not added.
- FL-02: `globals.css` no longer imports `tw-animate-css` and `shadcn/tailwind.css` (the rule says Tailwind and the three token files only). The base-nova shadcn components need them for their `data-*` variants and animation. Decide before the first `shadcn add`. The packages stay installed.
- FL-02: The proxy redirects `/` to `/en` only when the `fl-lang` cookie is `en`. Other unprefixed URLs stay Bangla, so shared links open as sent. Check this choice with the editorial team.
- FL-02: Before the first deploy, check that the CDN does not cache the cookie-based redirect at `/` (FL-14 rejected; next milestone).
- FL-02: `ThemeSwitch` and `LanguageSwitch` are in `src/components/header/` with a neutral look. FL-05 places them in the top bar.
- FL-03: `AdRow` cannot hide itself when its section is hidden (`LAY-13`). The page that composes the sections must drop both together.
- FL-03: Reader size A++ is not tested on `/layout-parts`. Cover it in FL-13.
- FL-04: The placeholder SVGs in `public/mock/` use one fixed neutral gray in both themes. Fine for mock images; real photos replace them.
- FL-04: Some mock headlines name real countries with invented figures (design-reviewer note on skill rule 2). Make them more generic if the editorial team prefers.
- FL-04: The `mock-content` skill's `Story` shape has no reading time. `readingMinutes` was added in code (IMP-10). Update the skill if wanted.
- FL-05: Give the homepage sections the anchor ids that the nav, drawer and Subscribe links use: `category-<id>` (FL-08, FL-09), `regions` and `region-<id>` (FL-11), `newsletter` (FL-09). IMP-14.
- FL-05: The scroll lock (`overflow-hidden` on `html` while a dialog is open) can shift the page by the scrollbar width on systems with classic scrollbars. Add `scrollbar-gutter: stable` if it shows.
- FL-05: Check the Bangla nav row at 1280 again when the real IA labels arrive (IMP-16).
- FL-06: Story links go to `/story/<slug>` and the Latest "আরও দেখুন" link to `/latest`. Both are 404 until those pages exist (IMP-18).
- FL-06: `?content=sparse` on the homepage shows the sparse cases. Remove it or keep it behind a dev check in FL-13 (IMP-11).
- FL-06: The hero `next/image` calls have no `sizes`. The mock SVGs are not optimized, so it has no effect now. Add `sizes` when real photos arrive.
- FL-07: The analysis thumbnails have no `sizes` either (same as FL-06). Add it with real photos.
- FL-07: `/analysis` and `/opinion` (the P-4 "more" links) are 404 until those pages exist (IMP-22).
- FL-08: P-2 has no "আরও দেখুন" link to its category page, because 7.2 lists none (IMP-23).
- FL-09: `/privacy` (newsletter consent line) is 404 until the page exists. FL-12 links to it too (IMP-25).
- FL-09: The phone 600px-between-ads rule is checked by a test, not at run time (IMP-24). Recheck with real, shorter categories.
- FL-09: P-3 has `space-section` below it for P-5 (FL-10). Until FL-10 it is the end of the page.
- FL-10: Safari VoiceOver drops list semantics from `list-style: none` lists (the `.rank-list` CSS). Check P-5 with VoiceOver in FL-13; add `role="list"` if needed.
- FL-11: The region columns have no "আরও দেখুন" link to a region page (7.4 lists none). Add it with the region pages (DR-19).
- FL-11: Decide whether the slider scrollbar stays visible (IMP-27, DOC-21).
- FL-12: The footer site pages (`/about`, `/contact`, `/corrections`, `/privacy`, `/terms`) are 404, and the social links go to each network's front page until the Fact Lens accounts are known (IMP-29).
- FL-13 (done in R2-01, both removed): The screenshots in `docs/fl-13/` (33 files, about 13 MB) and the measurement run in `tests/final-check/` are in the repository for now (tajmin, 2026-10-08). Remove both from the repository in the next milestone (IMP-30).
- FL-06: Playwright MCP screenshots add `caret-color` to the search field, which React reports as a hydration mismatch. It is not an app fault; ignore it in visual QA.

- R2-02 decisions (tajmin, 11 October 2026): §12.4 base rules added to `globals.css` (KIT-05, done). Import `components.css` in R2-04 (IMP-32). Import `shadcn/tailwind.css` with the first shadcn primitive, likely R2-05 (IMP-31)
- R2-02: components that still use removed tokens: `--ad-band-*`/`--ad-inset-*` sizes in `AdRow.tsx` (R2-06); `--space-eyebrow-title` and `--space-story-summary-meta` in the story, hero, analysis, featured and grouped files (R2-07 to R2-11); `.top-bar` in `SiteHeader.tsx` (R2-05).
- R2-04: 106 chromium e2e tests were red before this ticket and stay red: ad rows (R2-06), `header` (R2-05), `grouped` (R2-11), `most-read` (R2-12). R2-04 adds no failure (IMP-38). Each of those tickets must turn its tests green. At the end, tighten the five keyboard tests that accept the old ring to the base outline only.
- R2-04: parts not yet moved to the new ones: header buttons and links (`header/classes.ts`: `iconButton`, `filledButton`, `navLink`, `focusRing`) go to `IconButton`/`Button` in R2-05; the poll and the newsletter form (`grouped/classes.ts`) in R2-11; footer links in R2-14; the P-4 and P-3 `listItem` class becomes `dividerItem` in R2-09 and R2-11.
- R2-04: the bn Breaking word "সদ্যপ্রাপ্ত" against ব্রেকিং in the sheet (IMP-36). Eyebrow links go to `/category/<id>`, a 404 page (IMP-35).

- R2-05: `header/classes.ts` keeps `focusRing`, `iconButton` and `filledButton` for the footer (R2-14) and the poll/newsletter (R2-11). Remove them with the last caller. The footer uses `footer/socialLinks.ts` (five links, IMP-43).
- R2-05: Flags for tajmin: IMP-39 (native `<dialog>` instead of the shadcn Sheet, Dialog, Switch, Collapsible) and IMP-41 (nav labels against the C-18 words). The `visual-qa` agent sets the theme with `data-theme`; the theme is a two-state switch now (IMP-40, KIT-01).
- R2-05: `grouped.spec.ts` lost its Subscribe-link step (DR-188). `#newsletter` stays in the rail until R2-11 removes the newsletter.
- R2-06: `AdSlot` replaces `AdRow`/`AdPlaceholder`; the `rail` variant goes into the P-3 rail in R2-11 (hidden under 1280). 28 chromium e2e tests are red from before: `most-read` (R2-12). IMP-44 to IMP-46, DOC-29.

## Unresolved design-system items

| ID | File and component | Treatment used | Status |
| --- | --- | --- | --- |
| U-01 | English category labels (`src/i18n/en.ts` `categories`) | Working labels from the `mock-content` skill (`IA-06`) | Open |
| U-02 | Card variants, radius, icons, motion | Neutral treatment (`AGENTS.md` Section 8) | Open |
| U-03 | বিশ্লেষণ ও মতামত section background | `surface-elevated` (`DR-76`), built in FL-07. tajmin checks the look | Check |
| U-04 | Theme switch and language switch look (`src/components/header/`) | ThemeToggle, ThemeButton and the language link from C-12 and C-17 | Fixed in R2-05 |
| U-05 | Minimum touch target size (no spec value; switches are about 33px) | None yet. Proposed `--target-min` 44px | Open |
| U-06 | Section heading rule thickness (`src/components/layout/SectionHeading.tsx`) | C-13 and C-22 give it: `Divider` with a 1px border rule and the brand bar | Fixed in R2-04 |
| U-07 | Region list and labels (`src/content/homepage.ts`, `src/i18n/*.ts` `regions`) | Seven working regions; আফ্রিকা has no stories | Open |
| U-08 | Logo (`src/components/header/SiteHeader.tsx`) | Site name as text, `type-section-title`, `text-brand`; 2.37:1 in dark (logo exempt) | Open |
| U-09 | Theme control in the bar (`src/components/header/ThemeToggle.tsx`) | Two states, ThemeButton on phones and ThemeToggle switch from 768 | Fixed in R2-05 |
| U-10 | Drawer and search dialog look (`Drawer.tsx`, `SearchDialog.tsx`) | Built from C-19 and C-20 | Fixed in R2-05 |
| U-11 | Headline link color (`src/components/story/links.ts`) | `text-ink`, `interactive-hover` and `interactive-pressed` on hover and press, no underline (DOC-14) | Open |
| U-12 | Lead text panel inset and padding (`src/components/home/hero/LeadStory.tsx`) | Inset 64px from the end (`md:me-16`), padding `space-story-media-text` | Open |
| U-13 | Card without image beside a card with image (`src/components/story/StoryCard.tsx`) | Subgrid keeps the rows aligned (LAY-08): a blank band above the text and a stretched title row | Open |
| U-14 | Bangla Breaking label and label padding (`src/i18n/bn.ts`, `StoryEyebrow.tsx`) | "সদ্যপ্রাপ্ত" on `bg-live`, `px-1` | Open |
| U-15 | Analysis item layout (`src/components/home/analysis-opinion/AnalysisList.tsx`) | 16:9 image at one third of the column, text beside it, at every width | Open |
| U-16 | Opinion chip padding and quote icon (`OpinionList.tsx`) | Chip `px-1`, `space-list-item` below; `lucide-react` `Quote` 24px `text-ink-muted` | Open |
| U-17 | Padding inside the P-4 background (`AnalysisOpinion.tsx`) | `space-module` on every side | Open |
| U-18 | P-2 lead split from 1280 (`src/components/home/featured/FeaturedLead.tsx`) | Two equal columns, text top-aligned beside the image | Open |
| U-19 | P-2 rail at 600–1023 (`FeaturedRail.tsx`) | Two columns: image story left over both rows, two stories right | Open |
| U-20 | Story labels in a category section (`FeaturedLead.tsx`, `FeaturedRail.tsx`) | No category label (the heading names it); breaking label kept; rail in `type-story-title-sm` | Open |
| U-21 | Inside of a P-3 category block (`src/components/home/grouped/CategoryBlock.tsx`) | Heading, one image story in `type-story-title`, then compact stories in `type-story-title-sm` with list rules | Open |
| U-22 | P-3 rail module look (`grouped/classes.ts`) | No background; 1px `border` top rule with `space-section-rule-title`, aligned with the category rules | Open |
| U-23 | Form text roles (`NewsletterSignup.tsx`, `DailyPoll.tsx`) | Visible label and consent line `type-ui-sm` `ink-secondary`; error `text-error`; done `text-success` on `success-subtle` | Open |
| U-24 | Poll question and result bars (`DailyPoll.tsx`) | Question `type-summary`; 8px bar, `border-soft` track, `interactive` fill; own vote named in text | Open |
| U-25 | Spacing inside forms (`grouped/*`, `header/classes.ts`) | Tailwind spacing scale (`gap-2`, `min-h-11` …), as in FL-05; no form tokens in 5.2 | Open |
| U-26 | Bangla name of P-5 (`src/i18n/bn.ts` `mostRead.title`) | Working label "সর্বাধিক পঠিত" | Open |
| U-27 | Most read item (`src/components/home/most-read/MostRead.tsx`) | Title only in `type-story-title-sm`; `space-module` between rows; no list rules | Open |
| U-28 | Region chip and column heading (`src/components/home/regions/RegionSlider.tsx`) | Chip: `border-interactive` border, `text-interactive`, filled `interactive` when selected, `px-3`; column heading `type-ui-sm` with the U-22 top rule, visually hidden below 600 | Open |
| U-29 | Slider buttons (`RegionSlider.tsx`, `SectionHeading.tsx` `actions`) | 44px chevron icon buttons at the end of the heading row; `aria-disabled` in `ink-disabled` at each end; 250ms ease-out | Open |
| U-31 | Logo size and weight (`SiteHeader.tsx`, `Drawer.tsx`, `SiteFooter.tsx`) | C-17 gives serif 700, 20/22/24px; there is no type role (TYP-01). Kept `type-section-title` | Open |
| U-32 | ThemeButton moon (`ThemeButton.tsx`) | C-12 says "redrawn larger"; no drawing. Lucide moon, 1px up | Open |
| U-30 | Minimum footer (`src/components/footer/SiteFooter.tsx`, `SocialIcon.tsx`) | Page background, full-width 1px `border` rule, `space-module` padding; links `type-ui-sm` `text-interactive` 44px; inline Simple Icons (CC0) brand marks in 44px icon buttons for Facebook, YouTube, X, Instagram; working Bangla labels | Open |

## Spec issues (DOC-)

Report these to the blueprint project. Do not edit the specs here.

| Found | Spec and section | Problem | Status |
| --- | --- | --- | --- |
| 2026-10-07 FL-02 | `typography-system.md` 8.2 | DOC-01: English role values are set on `:root` only. Custom properties inherit, so a `lang="en"` block inside a Bangla page keeps the Bangla fonts, sizes, line heights and case (measured: English lead 38.96px Noto Serif Bengali instead of 40.96px Source Serif 4). This breaks `TYP-03`. Suggested fix: change the selector `:root` to `:root, :lang(en)` (both blocks). Not changed here | Open |
| 2026-10-07 FL-02 | `color-system.md` 5 | DOC-02: The CSS block starts with `@import "tailwindcss"`, but the file is meant to be imported next to Tailwind. Copied without that line | Open |
| 2026-10-07 FL-02 | `color-system.md` 5 and `spacing-layout-system.md` 6 | DOC-03: Colors switch on the `.dark` class; layout §6 says "set `data-theme` before the first paint", and the `visual-qa` agent sets `data-theme="dark"` by hand, which changes nothing. Neither spec has CSS for "system". The theme script sets both the class and `data-theme`, and resolves "system" with `matchMedia` | Open |
| 2026-10-07 FL-02 | `typography-system.md` 3 and 8.2 | DOC-04: The role table has 23 roles, but 8.2 has 22 utilities: no `type-rank`. Its CSS is the `.rank-list` block in 7.1. FL-10 copied it to `typography.css` | Workaround in code |
| 2026-10-07 FL-02 | `color-system.md` 5 | DOC-05: No base rule sets the page background and text color, so the canvas stays white in dark mode. The layout sets `bg-background text-ink` on `<body>` | Open |
| 2026-10-07 FL-02 | `spacing-layout-system.md` 12.3 | DOC-06: `.shell`, `.with-rail` and the other container classes are not in a cascade layer, so they win over every Tailwind utility on the same element. Works, but `@utility` or `@layer components` would be safer | Open |
| 2026-10-07 FL-02 | `color-system.md` COL-13 and 2.8 | DOC-07: COL-13 names ring utilities, 2.8 gives values only; no shared focus CSS, offset color set by hand per surface | Open |
| 2026-10-07 FL-03 | `spacing-layout-system.md` 9 and 12.2 | DOC-08: Reserved ad heights and creative sizes are only in the Section 9 table; 12.2 has no tokens. Workaround: project file `src/styles/ads.css` (tajmin's choice), imported as a fourth file in `globals.css` | Open |
| 2026-10-07 FL-03 | `spacing-layout-system.md` 9, 12.3 and 13 | DOC-09: The 336×280 phone creative is wider than the 320 test width, and `.ad-row` has no column template, so the page scrolls sideways. Workaround: `grid-cols-1` on `AdRow`, `max-w-full` on the placeholder | Open |
| 2026-10-07 FL-05 | `spacing-layout-system.md` 6 | DOC-10: "Logo in the center at every width" does not hold at 320 and 360: the right side (full language name per DR-78, theme button) is wider than the menu button. Logo is off by 30px at 320 and 10px at 360, centered from about 400 | Open |
| 2026-10-07 FL-05 | `color-system.md` 5, COL-15 | DOC-11: `--shadow` has no `--color-shadow` or shadow-size token, so COL-15 needs a raw Tailwind shadow. Drawer and search dialog have no shadow | Open |
| 2026-10-07 FL-05 | `spacing-layout-system.md` 10 | DOC-12: With native modal dialogs (top layer), `--z-scrim` and `--z-drawer` are not used | Open |
| 2026-10-07 FL-06 | `spacing-layout-system.md` 7.4 | DOC-13: "The cut corner on top-story images comes from the text block" — 7.4 gives no overlap for top stories, only for the lead. The cut corner is built on the lead only (panel inset from the end) | Open |
| 2026-10-07 FL-06 | `color-system.md` COL-05 and 2 | DOC-14: COL-05 says links use `interactive`; headlines use `ink`. A headline link fits both. Built as `ink` with interactive hover and press (U-11) | Open |
| 2026-10-07 FL-06 | `spacing-layout-system.md` 7.4 and 12.2 | DOC-15: The 64px lead overlap has no token. Built with the Tailwind scale (`md:-mt-16`) | Open |
| 2026-10-07 FL-07 | `spacing-layout-system.md` LAY-12 and 7.4 | DOC-16: LAY-12 puts section-to-ad space on the section, but does not say whether it is inside or outside P-4's own background. Built as margin outside the background | Open |
| 2026-10-07 FL-09 | `spacing-layout-system.md` 9 and 13 | DOC-18: The 300×250 `ad-inset` creative is wider than the 288px shell at 320. Workaround: the DOC-09 `max-w-full` on the placeholder | Open |
| 2026-10-07 FL-10 | `typography-system.md` 7.1 | DOC-19: The numeral must be `aria-hidden`, but the 7.1 CSS draws it as `::before` generated content, which cannot take the attribute and is read by screen readers. Workaround: a project rule repeats `content` with empty alt text (`counter(rank) / ""`) | Open |
| 2026-10-07 FL-11 | `spacing-layout-system.md` 7.2, 7.4 and 12.3 | DOC-20: No slider CSS: the column width (2 / 4 in view) is not a token, and a scroll container clips focus rings at its edges. Workaround: arbitrary `auto-cols-[calc(...)]` from `--grid-column-gap` only; 4px `-m-1 p-1 scroll-p-1` ring room | Workaround in code |
| 2026-10-07 FL-11 | `spacing-layout-system.md` 3.3, 7.2, 7.3, LAY-07 | DOC-21: "4 regions in view" from 1024 against "no 4-up rows"; and "4 regions or fewer: no buttons" while only 2 are in view at 600–1023. Built as written | Open |
| 2026-10-07 FL-12 | `spacing-layout-system.md` 7.1, 7.4; DR-59 | DOC-22: 7.1 row 15 calls the footer row an "ad container" (Section 2: one ad slot); DR-59 lists Contact, Corrections and Privacy, 7.4 adds About and Terms. Built per 7.4 | Open |
| 2026-10-07 FL-13 | `spacing-layout-system.md` 13 | DOC-23: The 1366×768 first-screen estimate (264px for the hero) leaves out `space-section`; 224px shows and no headline is in view | Open |
| 2026-10-11 R2-04 | `component-system.md` 6 | DOC-25: the CSS block leaves out the six button and icon tokens that the table lists. `components.css` has them typed from the table | Workaround in code |
| 2026-10-11 R2-04 | `component-system.md` C-11, `typography-system.md` 7.1 | DOC-26: Chip label says "type-eyebrow 15px 600"; the English role is 14px 700 uppercase | Open |
| 2026-10-11 R2-05 | `component-system.md` C-12, C-17, §6; `color-system.md` 2.9 | DOC-27: switch radii, top bar padding and the theme control color switch have no token. `components.css` has four | Workaround in code |
| 2026-10-11 R2-05 | `component-system.md` C-18, C-19 | DOC-28: 48px row with or without its 1px rule; where the Drawer row rule sits above children | Open |
| 2026-10-11 R2-06 | `component-system.md` C-16; `spacing-layout-system.md` 12.2 | DOC-29: rail box "304" against `--ad-rail-w` 300px | Open |
| 2026-10-07 FL-13 | `typography-system.md` 8.2 | DOC-24: No `overflow-wrap` on the headline roles; one long compound word scrolls the page | Open |
| 2026-10-07 FL-08 | `typography-system.md` 7.1 | DOC-17: No role for the lead of a category section (page lead `type-story-lead` or second level `type-story-title-lg`). Built with `type-story-title-lg` | Open |
