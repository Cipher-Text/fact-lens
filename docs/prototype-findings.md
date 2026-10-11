# Fact Lens Prototype Findings

The complete report of the issues and gaps found while the homepage prototype is built. Claude updated it at the end of each ticket (FL-01 to FL-13). Milestone 1 is closed; the summary is `docs/milestone-1-report.md`. Each finding has a suggested solution.

- Last updated: 11 October 2026, R2-07 (story units: LeadStory, OverlapCard, StoryCard, StoryList, StoryListItem). Earlier: 11 October 2026, R2-06 (ad slots and page frame: AdSlot). Earlier: 11 October 2026, R2-05 (page chrome: TopBar, NavBar, Drawer, SearchDialog, theme controls). Earlier: 11 October 2026, R2-04 (small parts: Divider, SectionHeading, MoreLink, Eyebrow, MetaLine, Chip, Button, IconButton). Earlier: 11 October 2026, R2-03 (mock content: mock ads, tests). Earlier: 11 October 2026, R2-02 (foundations CSS copied from the current specs). Earlier: 8 October 2026, Milestone 1 closed (FL-14 rejected). The FL-13 results table is in `docs/PROGRESS.md`
- Short status lists stay in `docs/PROGRESS.md`. This file holds the full detail.

## How to read this file

| Prefix | Kind | Who acts |
| --- | --- | --- |
| `DOC-` | A spec is wrong, unclear or does not agree with itself | Blueprint project (the specs are read-only here) |
| `U-` | The design system has no decision (`UNRESOLVED_DESIGN_SYSTEM`) | Design owner |
| `IMP-` | A choice made in code where the specs leave room. It needs confirmation | tajmin |
| `KIT-` | A problem in the Claude Code kit (agents, hooks, skills, settings) | tajmin |

| Severity | Meaning |
| --- | --- |
| High | Breaks a rule or shows wrong output to readers |
| Medium | Works now, but causes a fault or rework later |
| Low | Wording, clarity or tidiness |

Status values: Open, Workaround in code, Fixed, Closed (no action).

## Summary

| ID | Found | Title | Severity | Status |
| --- | --- | --- | --- | --- |
| DOC-01 | FL-02 | English block inside a Bangla page keeps Bangla type | High | Open |
| DOC-02 | FL-02 | Color CSS block imports Tailwind a second time | Low | Workaround in code |
| DOC-03 | FL-02 | Theme selector: `.dark` class against `data-theme` | Medium | Workaround in code (the two-state theme needs no "system" CSS now) |
| DOC-04 | FL-02 | `type-rank` role has no utility in §8.2 | Low | Workaround in code |
| DOC-05 | FL-02 | No base rule for page background and text color | Medium | Workaround in code |
| DOC-06 | FL-02 | Container classes are not in a cascade layer | Low | Workaround in code |
| DOC-07 | FL-02 | COL-13 gives utilities, §2.8 gives values only | Low | Open |
| DOC-08 | FL-03 | Ad heights and creative sizes have no tokens | Medium | Fixed: spec 12.2 has the `--ad-*` tokens (R2-02, R2-06) |
| DOC-09 | FL-03 | 336×280 phone creative is wider than a 320px screen | Medium | Fixed: spec serves it from 336px only (DR-206); R2-06 builds it |
| DOC-10 | FL-05 | Logo "in the center at every width" does not hold at 320 and 360 | Medium | Fixed in R2-05 |
| DOC-11 | FL-05 | `shadow` color has no Tailwind mapping, so COL-15 cannot be applied | Low | Open |
| DOC-12 | FL-05 | `--z-scrim` and `--z-drawer` are not needed with a native modal dialog | Low | Open |
| DOC-13 | FL-06 | "Cut corner on top-story images" has no matching rule | Low | Open |
| DOC-14 | FL-06 | Headline links: `ink` or `interactive` | Low | Open |
| DOC-15 | FL-06 | The 64px lead overlap has no token | Low | Workaround in code |
| DOC-16 | FL-07 | LAY-12 section-to-ad space on a section with its own background | Low | Workaround in code |
| DOC-17 | FL-08 | Typography 7.1 has no role for the lead of a category section | Low | Open |
| DOC-18 | FL-09 | 300×250 inset creative is wider than the 288px shell at 320 | Low | Fixed: spec makes the inset full screen width under 332px (DR-207); R2-06 builds it |
| DOC-19 | FL-10 | Rank numeral must be `aria-hidden`, but the §7.1 CSS draws it as generated content | Medium | Workaround in code |
| DOC-20 | FL-11 | No slider CSS in §12.3: column width, snap and focus-ring room | Medium | Workaround in code |
| DOC-21 | FL-11 | "4 regions in view" next to "no 4-up rows" (LAY-07), and no buttons at 600–1023 with 3 or 4 regions | Low | Open |
| DOC-22 | FL-12 | Footer: 7.1 calls it an "ad container"; DR-59 and 7.4 list different links | Low | Open |
| DOC-23 | FL-13 | 1366×768 first screen: the 264px hero estimate leaves out the section space; no headline in view | Medium | Open |
| DOC-24 | FL-13 | Headline roles have no `overflow-wrap`; one long compound word scrolls the page | Medium | Open |
| DOC-25 | R2-04 | The §6 CSS block of `component-system.md` leaves out the button and icon tokens that its table lists | Low | Workaround in code |
| DOC-26 | R2-04 | The Chip label sheet gives "15px 600", the `type-eyebrow` role is 14px 700 uppercase in English | Low | Open |
| DOC-27 | R2-05 | C-12 and C-17 give the switch corners and the top bar padding in px, §6 has no tokens, and §2.9 says no component has color tokens | Low | Workaround in code |
| DOC-28 | R2-05 | C-18: does the 48px row include the 1px bottom rule? And where does the Drawer row rule sit when a row has children? | Low | Open |
| DOC-29 | R2-06 | C-16 says the rail box is "rail width 304" and also `w-(--ad-rail-w)`, which is 300px | Low | Open |
| DOC-30 | R2-07 | C-01 and C-24 give values that §6 has no token for: the LeadStory panel start padding (0 narrow) and the P-2 feature split image column (share, min, max) | Low | Workaround in code |
| U-01 | FL-01 | English category labels | Medium | Open |
| U-02 | FL-01 | Card variants, radius, icons, motion | Medium | Open |
| U-03 | FL-01 | বিশ্লেষণ ও মতামত section background | Low | Built in FL-07; tajmin checks the look |
| U-04 | FL-02 | Theme switch and language switch look | Medium | Fixed in R2-05 (C-12, C-17) |
| U-05 | FL-02 | No minimum touch target size | Medium | Open |
| U-06 | FL-03 | Section heading rule thickness | Low | Fixed in R2-04 (C-13 and C-22 give it) |
| U-07 | FL-04 | Region list under অঞ্চল | Medium | Open |
| U-08 | FL-05 | Logo asset and its role | Medium | Open |
| U-09 | FL-05 | Theme control in the bar: one cycling icon button | Medium | Fixed in R2-05 (ThemeButton, ThemeToggle) |
| U-10 | FL-05 | Drawer and search dialog look | Low | Fixed in R2-05 (C-19, C-20) |
| U-11 | FL-06 | Headline link color | Low | Open |
| U-12 | FL-06 | Lead text panel inset and padding | Low | Open |
| U-13 | FL-06 | Card without image beside a card with image | Medium | Open |
| U-14 | FL-06 | Bangla Breaking label and label padding | Low | Open |
| U-15 | FL-07 | Analysis item layout (image-led list) | Low | Open |
| U-16 | FL-07 | Opinion chip padding and quote icon | Low | Open |
| U-17 | FL-07 | Padding inside the বিশ্লেষণ ও মতামত background | Low | Open |
| U-18 | FL-08 | P-2 lead: image and text split from 1280px | Low | Open |
| U-19 | FL-08 | P-2 rail at 600–1023px | Low | Open |
| U-20 | FL-08 | Story labels inside a category section | Low | Open |
| U-21 | FL-09 | Inside of a P-3 category block | Low | Open |
| U-22 | FL-09 | P-3 rail module look (newsletter, poll) | Low | Open |
| U-23 | FL-09 | Form text roles: field label, consent line, error and done messages | Low | Open |
| U-24 | FL-09 | Poll question role and result bar look | Low | Open |
| U-25 | FL-09 | Spacing inside forms has no tokens | Medium | Open |
| U-26 | FL-10 | Bangla name of the Most read section | Low | Open |
| U-27 | FL-10 | Most read item content and row gap | Low | Open |
| U-28 | FL-11 | Region chip and region column heading look | Low | Open |
| U-29 | FL-11 | Slider button place, icon and disabled look | Low | Open |
| U-30 | FL-12 | Minimum footer look and social icons | Low | Open |
| U-31 | R2-05 | Logo size and weight (serif 700, 20/22/24px) have no type role | Medium | Open |
| U-32 | R2-05 | ThemeButton moon "redrawn larger" has no asset | Low | Open |
| U-33 | R2-07 | No sheet draws a story with no image, but the mock set has them (hero top card, lead in the sparse case, many list stories). C-01, C-02 and C-24 say the image is required | Medium | Open: flag for tajmin |
| IMP-01 | FL-02 | Remembered English choice redirects only at `/` | Medium | Needs confirmation |
| IMP-02 | FL-02 | shadcn CSS imports left out of `globals.css` | Medium | Needs decision before `shadcn add` |
| IMP-03 | FL-02 | Cookie redirect and CDN caching | Medium | Check before the first deploy (FL-14 rejected) |
| IMP-04 | FL-02 | Theme choice kept in local storage, not a cookie | Low | Closed (no action) |
| IMP-05 | FL-01 | shadcn `base-nova` preset | Medium | Needs decision before `shadcn add` |
| IMP-06 | FL-01 | `agentRules: false` in `next.config.ts` | Low | Closed (no action) |
| IMP-07 | FL-01 | Playwright runs Chromium only | Low | Open (not added in FL-13) |
| IMP-08 | FL-03 | Which creative the ad placeholder shows | Low | Needs confirmation |
| IMP-09 | FL-03 | Extra layout part `WithRail` | Low | Needs confirmation |
| IMP-10 | FL-04 | `readingMinutes` added to the `Story` type | Low | Needs confirmation |
| IMP-11 | FL-04 | `getHomepage` applies the content rules and has a sparse variant | Low | Needs confirmation (`?content=sparse` added in FL-06) |
| IMP-12 | FL-04 | Category and region labels are interface strings | Low | Needs confirmation |
| IMP-13 | FL-05 | Drawer and search use native `<dialog>`, not shadcn | Medium | Needs confirmation |
| IMP-14 | FL-05 | Nav, region and Subscribe links go to homepage anchors | Low | Needs confirmation |
| IMP-15 | FL-05 | Search field is `type="text"`, not `type="search"` | Low | Needs confirmation |
| IMP-16 | FL-05 | Nav row hides the items that do not fit after hydration | Low | Needs confirmation (now 9 items; 8 fit in English at 1280) |
| IMP-17 | FL-05 | On phones the drawer focuses the search field first | Low | Fixed in R2-05 (focus goes to the panel, DR-249) |
| IMP-18 | FL-06 | Story and Latest links lead to 404 pages | Low | Needs confirmation (FL-07 adds `/analysis` and `/opinion`) |
| IMP-19 | FL-06 | Hero metadata shows the clock time only, 24-hour | Low | Needs confirmation |
| IMP-20 | FL-06 | Hidden page heading and hero heading | Low | Needs confirmation |
| IMP-21 | FL-07 | P-4 heading outline: hidden analysis heading, chip as the opinion heading | Low | Needs confirmation |
| IMP-22 | FL-07 | Shared `MoreLink` and elevated link classes | Low | Needs confirmation |
| IMP-23 | FL-08 | P-2 has no "আরও দেখুন" link | Low | Needs confirmation |
| IMP-24 | FL-09 | Ad-inset count is fixed in the markup; the phone 600px rule is checked by a test | Medium | Needs confirmation |
| IMP-25 | FL-09 | Mock newsletter: own email check, 0.8s sending state, no email sent | Low | Needs confirmation |
| IMP-26 | FL-09 | Poll vote kept in local storage; percents by largest remainder | Low | Needs confirmation |
| IMP-27 | FL-11 | Regions slider: tab mode follows the CSS, scripted 250ms scroll, hash selects a tab | Low | Needs confirmation |
| IMP-28 | FL-11 | Shared `StoryStack` for P-3 and P-3b; `actions` slot on `SectionHeading` | Low | Needs confirmation |
| IMP-29 | FL-12 | Footer links: 404 site pages, social links to network front pages | Low | Needs confirmation |
| IMP-30 | FL-13 | Screenshots and measurement run in the repository; remove in the next milestone | Low | Open |
| IMP-31 | R2-02 | `globals.css` does not import `shadcn/tailwind.css`, but `color-system.md` §5 says it does | Low | Decided: add it with the first shadcn primitive |
| IMP-32 | R2-02 | `components.css` is not imported in `globals.css` | Low | Done in R2-04 |
| IMP-33 | R2-03 | Newsletter strings and components stay until R2-11, because R2-03 only touches `src/content/` | Low | Open: remove in R2-11 |
| IMP-34 | R2-03 | Mock ad creatives are plain gray SVG files with no text, one per size | Low | Open |
| IMP-35 | R2-04 | The Eyebrow is now a link to `/category/<id>`, which is a 404 page | Low | Open |
| IMP-36 | R2-04 | The Bangla Breaking label is "সদ্যপ্রাপ্ত"; the Chip sheet says the working label is ব্রেকিং | Low | Open: needs tajmin's yes |
| IMP-37 | R2-04 | Item divider is a class, not a component; the section divider is a component | Low | Open |
| IMP-38 | R2-04 | 106 e2e tests were red on the branch before R2-04; five keyboard tests accept the old ring or the base outline for now | Medium | Open |
| IMP-39 | R2-05 | Drawer and SearchDialog stay on the native `<dialog>`; the sheets name the shadcn Sheet, Dialog, Switch and Collapsible (CPT-16) | Medium | Open: needs tajmin's decision (flag) |
| IMP-40 | R2-05 | The theme has two states and does not follow the system; an old stored "system" reads as light; e2e tests set the theme in storage | Medium | Open |
| IMP-41 | R2-05 | The nav uses the working category labels; C-18 lists shorter ones | Medium | Open: needs tajmin's decision (flag) |
| IMP-42 | R2-05 | Trending terms are mock buttons that run the mock search; Op-ed and the Analysis anchors | Low | Open |
| IMP-43 | R2-05 | LinkedIn mark from Simple Icons 13.21.0, the last release that has it; the Drawer lists 5 links, the Footer still 4 | Low | Open |
| IMP-44 | R2-06 | At 768–1023 the band shows the 728×90 creative inside the 250 reserve, so 160px of the band is empty | Low | Open |
| IMP-45 | R2-06 | `AdSlot` reads its mock booking itself and always renders; the Phase 1 rule "no booking, no `ad-top` row" (DR-250) has no code path yet | Low | Open |
| IMP-46 | R2-06 | The `rail` variant is built and tested alone; it goes into the P-3 rail in R2-11. 28 chromium e2e tests stay red from before (`most-read`, R2-12) | Low | Open |
| IMP-47 | R2-07 | The story units are wired into the hero (needed to keep it building); two hero tests and the hero e2e layout checks were changed to the sheets. A development-only test page `/dev/story-units` carries the unit tests | Medium | Open |
| IMP-48 | R2-07 | `StoryCard` `layout` has four values (`stack`, `row`, `row-from-md`, `row-until-lg`) and `OverlapCard` has a `surface` prop, so a section can set the page-breakpoint switch and the P-4 background; the sheets say "the section sets it" but give no prop | Low | Open: flag for tajmin |
| KIT-01 | FL-02 | `visual-qa` agent switches theme with `data-theme` | Medium | Open |
| KIT-02 | FL-02 | `visual-qa` agent checks the homepage only | Low | Open |
| KIT-03 | FL-02 | Raw-value hook flags object keys named `dark:` | Low | Workaround in code |
| KIT-04 | FL-02 | Playwright MCP output folder not ignored | Low | Fixed |
| KIT-05 | R2-02 | `AGENTS.md` §5 says `globals.css` holds only the imports; `spacing-layout-system.md` §12.4 puts base rules there | Medium | Fixed |

---

## Spec issues (DOC-)

### DOC-01 English block inside a Bangla page keeps Bangla type

- **Found:** FL-02 · **Severity:** High · **Status:** Open
- **Source:** `typography-system.md` Section 8.2. Breaks `TYP-03` and `TYP-04`.
- **Problem:** The English font stacks and role values are set on `:root` only. The Bangla values are set on `:lang(bn)`. Custom properties inherit, so an element with `lang="en"` inside a Bangla page gets the Bangla values from its parent. Nothing resets them to English.
- **Evidence:** On `/foundations`, the English `type-story-lead` sample measures 38.96px in Noto Serif Bengali with line height 1.2. Expected: 40.96px in Source Serif 4 with line height 1.08 and tracking -0.02em. The English eyebrow is not uppercase. On `/en/foundations` both columns are correct, because `:lang(bn)` does match a Bangla block inside an English page.
- **Impact:** Every English name, quote or block on a Bangla page uses the wrong font and metrics.
- **Suggested solution:** In both places in §8.2, change the selector `:root` to `:root, :lang(en)`. Then each language block sets its own values. Until the spec changes, either wait, or apply the one-line change in `src/styles/typography.css` with tajmin's approval and record it here.

### DOC-02 Color CSS block imports Tailwind a second time

- **Found:** FL-02 · **Severity:** Low · **Status:** Workaround in code
- **Source:** `color-system.md` Section 5.
- **Problem:** The block starts with `@import "tailwindcss";`, but the project keeps it in `src/styles/colors.css`, which `globals.css` imports next to Tailwind. Copied as written, Tailwind loads twice.
- **Workaround:** `colors.css` leaves out that one line. A comment at the top of the file says so.
- **Suggested solution:** Remove the import from the spec block, and say that `globals.css` imports Tailwind once.

### DOC-03 Theme selector: `.dark` class against `data-theme`

- **Found:** FL-02 · **Severity:** Medium · **Status:** Workaround in code
- **Source:** `color-system.md` Section 5 and `spacing-layout-system.md` Section 6.
- **Problem:** The colors change on the `.dark` class. Layout §6 says "set `data-theme` before the first paint". Neither spec gives CSS for the "system" state.
- **Workaround:** `src/lib/theme.ts` sets the `.dark` class, `data-theme` and `color-scheme`. It resolves "system" with `matchMedia` and follows changes in the system setting.
- **Suggested solution:** Pick one hook in both specs. Either keep `.dark` and change §6 to "set the `dark` class", or key the dark tokens on `[data-theme="dark"]`. State that the system state is resolved by script.

### DOC-04 `type-rank` role has no utility in §8.2

- **Found:** FL-02 · **Severity:** Low · **Status:** Open
- **Source:** `typography-system.md` Sections 3, 7.1 and 8.2.
- **Problem:** The role table lists 23 roles. Section 8.2 has 22 utilities and no `type-rank`. The rank CSS is the `.rank-list` block in Section 7.1.
- **Suggested solution:** Say in §8.2 that `type-rank` is the `.rank-list` block in §7.1, or move that block into §8.2. FL-10 uses the §7.1 block.
- **Workaround (FL-10):** The §7.1 block is copied unchanged to the end of `src/styles/typography.css`. It is outside a cascade layer, like the container classes (DOC-06).

### DOC-05 No base rule for page background and text color

- **Found:** FL-02 · **Severity:** Medium · **Status:** Workaround in code
- **Source:** `color-system.md` Section 5.
- **Problem:** No rule sets the page background or the default text color. In dark mode the page stays white.
- **Workaround:** `src/app/[lang]/layout.tsx` puts `bg-background text-ink` on `<body>`.
- **Suggested solution:** Add `body { background: var(--background); color: var(--ink); }` to the spec block. Say whether the default text is `ink` or `ink-secondary`.

### DOC-06 Container classes are not in a cascade layer

- **Found:** FL-02 · **Severity:** Low · **Status:** Open
- **Source:** `spacing-layout-system.md` Section 12.3.
- **Problem:** `.shell`, `.ad-row`, `.editorial-grid`, `.with-rail` and `.peer-card` are plain CSS outside a layer. In Tailwind 4, unlayered CSS beats every utility, so a utility on the same element (for example `gap-*` on `.with-rail`) is ignored.
- **Code now (FL-03):** The layout parts add only utilities for properties that these classes do not set (for example `grid-cols-1` on `.ad-row`, `gap-y-0` on `.peer-card`, padding on `.shell`). No utility is silently lost.
- **Suggested solution:** Write them as `@utility shell { ... }`, or wrap them in `@layer components`.

### DOC-07 COL-13 gives utilities, §2.8 gives values only

- **Found:** FL-02 · **Severity:** Low · **Status:** Open
- **Source:** `color-system.md` COL-13 and Section 2.8.
- **Problem:** COL-13 names `focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-background`. §2.8 gives only values, and there is no shared CSS. Each control must repeat about five classes. On a surface other than `background`, the offset color must change by hand ("the surface below").
- **Code now:** Each control uses the COL-13 utilities. The FL-02 Playwright test checks the ring.
- **Suggested solution:** Add one shared focus rule to the spec (a `focus-ring` utility, or a base `:focus-visible` rule) with an offset-color variable that a surface can set.

### DOC-08 Ad heights and creative sizes have no tokens

- **Found:** FL-03 · **Severity:** Medium · **Status:** Workaround in code
- **Source:** `spacing-layout-system.md` Section 9 (table) and Section 12.2.
- **Problem:** The reserved heights per tier (`ad-band-top` 100 / 90 / 250, `ad-band` 280 / 250 / 250, `ad-inset` 250, 90 from 1280) are only in the Section 9 table. Section 12.2 has `--ad-label` but no height or width tokens, and `LAY-01` forbids typing them in a component.
- **Code now:** tajmin chose a project file, `src/styles/ads.css`, with `--ad-<slot>-height` and `--ad-<slot>-width` per tier, copied from the table. `globals.css` imports it as a fourth file, although `AGENTS.md` Section 5 says "the three token files". The values are px, because creatives have fixed IAB pixel sizes.
- **Suggested solution:** Add these tokens to Section 12.2 (or a 12.4 "Ads" block). Then replace `ads.css` with the spec copy.

### DOC-09 336×280 phone creative is wider than a 320px screen

- **Found:** FL-03 · **Severity:** Medium · **Status:** Workaround in code
- **Source:** `spacing-layout-system.md` Section 9 (`ad-band`, phone: 336×280) and Section 13 (test width 320). Also `.ad-row` in Section 12.3.
- **Problem:** At 320px a 336px creative does not fit. `.ad-row` is a grid with no column template, so its auto track grows to the creative and the page scrolls sideways (measured: scroll width 336 at 320).
- **Code now:** `AdRow` adds `grid-cols-1` (`minmax(0, 1fr)`), and the placeholder has `max-w-full`. A real 336px creative would still be cut at 320.
- **Suggested solution:** Say in Section 9 that 336×280 is served only from 336px of viewport (300×250 below), and add `grid-template-columns: minmax(0, 1fr)` to `.ad-row` in Section 12.3.

### DOC-10 Logo "in the center at every width" does not hold at 320 and 360

- **Found:** FL-05 · **Severity:** Medium · **Status:** Open
- **Source:** `spacing-layout-system.md` Section 6 ("The logo is in the center at every width", `1fr auto 1fr`); DR-78 (language switch shows the full other-language name); U-05 (44px targets)
- **Problem:** On phones the left side holds only the menu button (44px). The right side holds the language link ("English" or "বাংলা", about 70px) and the theme button (44px). The `1fr auto 1fr` grid keeps all three parts visible, but when the sides are not equal and the space is small, the logo moves toward the menu.
- **Evidence:** Logo center at x=122 at 320 (middle 152) and x=162 at 360 (middle 172). It is exactly centered from about 400px, and in all tests from 600px. No overlap and no horizontal scroll.
- **Suggested solution:** One of: (a) the spec allows the logo off center below 600px; (b) a short visible language label ("EN" / "বাং", as the mobile sketch shows) with the full name as the accessible name, which changes DR-78; (c) a smaller logo asset on phones. (b) needs a decision-register change.

### DOC-11 `shadow` color has no Tailwind mapping, so COL-15 cannot be applied

- **Found:** FL-05 · **Severity:** Low · **Status:** Open
- **Source:** `color-system.md` Section 2.7 and Section 5, COL-15
- **Problem:** Section 5 defines `--shadow` but no `--color-shadow` in `@theme`, and no shadow size. A shadow on `surface-elevated` (COL-15) can only be written with Tailwind's default shadows, which are raw values.
- **Workaround:** The drawer and the search dialog have no shadow. The scrim (`overlay`) separates them from the page.
- **Suggested solution:** Add an elevation token to the spec, for example `--shadow-elevated: 0 8px 24px var(--shadow)` mapped as `--shadow-elevated` in `@theme`, so `shadow-elevated` exists.

### DOC-12 `--z-scrim` and `--z-drawer` are not needed with a native modal dialog

- **Found:** FL-05 · **Severity:** Low · **Status:** Open
- **Source:** `spacing-layout-system.md` Section 10
- **Problem:** The drawer and the search dialog use `<dialog>` with `showModal()` (IMP-13). The browser puts them in the top layer, above every `z-index`, with its own `::backdrop` for the scrim. The two layer tokens are not used.
- **Suggested solution:** Say in Section 10 that modal surfaces use the top layer, and keep `--z-scrim` and `--z-drawer` only for a non-modal fallback, or remove them.

### DOC-13 "Cut corner on top-story images" has no matching rule

- **Found:** FL-06 · **Severity:** Low · **Status:** Open
- **Source:** `spacing-layout-system.md` Section 7.4, P-1 lead panel
- **Problem:** The paragraph ends: "The cut corner on top-story images comes from the text block, not from a clip on the image." The same paragraph gives an overlap only for the lead. No rule says how a top-story text block covers its image.
- **Workaround:** The lead panel is inset 64px from the end, so the image shows beside it at the bottom: that is the cut corner. Top-story cards have the image, then the text, with no overlap.
- **Suggested solution:** Say whether "top-story" means the lead story. If top-story cards need a cut corner too, give the overlap and the inset.

### DOC-14 Headline links: `ink` or `interactive`

- **Found:** FL-06 · **Severity:** Low · **Status:** Open
- **Source:** `color-system.md` COL-05, COL-06 and Section 2 (`ink` for headlines)
- **Problem:** COL-05 says links use `interactive`. Headlines are `ink`. A linked headline fits both rules.
- **Workaround:** Headline links are `text-ink`, with `interactive-hover` and `interactive-pressed` on hover and press (COL-06), no underline. See U-11.
- **Suggested solution:** Add one line to COL-05: "Story headlines that link stay `ink` and use the interactive hover and press colors."

### DOC-15 The 64px lead overlap has no token

- **Found:** FL-06 · **Severity:** Low · **Status:** Workaround in code
- **Source:** `spacing-layout-system.md` Section 7.4 and Section 12.2
- **Problem:** 7.4 sets a 64px overlap, but 12.2 has no token for it (LAY-01).
- **Workaround:** `md:-mt-16` from the Tailwind spacing scale (64px) in `LeadStory.tsx`.
- **Suggested solution:** Add `--space-lead-overlap: 4rem` to 12.2.

### DOC-16 LAY-12 section-to-ad space on a section with its own background

- **Found:** FL-07 · **Severity:** Low · **Status:** Workaround in code
- **Source:** `spacing-layout-system.md` LAY-12, Section 5.1 and Section 7.4 (P-4)
- **Problem:** LAY-12 puts the space between a section and its ad row on the section. For P-4 the section has its own `surface-elevated` background inside the shell. If the space is padding, it is inside the color and the ad row touches the colored block; the spec does not say which.
- **Workaround:** `space-module` as margin outside the background, above (after the hero ad row) and below (before its own ad row), set by the page in `src/app/[lang]/page.tsx`. The padding inside the background is a separate gap (U-17).
- **Suggested solution:** State in 7.4 that P-4 keeps `space-module` outside its background, and give the inner padding (U-17).

### DOC-17 Typography 7.1 has no role for the lead of a category section

- **Found:** FL-08 · **Severity:** Low · **Status:** Open
- **Source:** `typography-system.md` Section 7.1
- **Problem:** 7.1 maps "Lead story headline" to `type-story-lead` and "Second-level story in a lead group" to `type-story-title-lg`. The P-2 lead (বাংলাদেশ, ভূরাজনীতি) is the lead of its section, but not the page lead. Either reading fits.
- **Workaround:** `type-story-title-lg`, so the hero lead stays the largest headline on the page. From 1280px the text column beside the image is about 440–460px wide; `type-story-lead` would be very large there.
- **Suggested solution:** Add a row "Featured category lead" to 7.1.

---

### DOC-18 300×250 inset creative is wider than the 288px shell at 320

- **Found:** FL-09 · **Severity:** Low · **Status:** Workaround in code
- **Source:** `spacing-layout-system.md` Section 9 (`ad-inset` on phones: 300×250) and 13 (320 test width). Same kind as DOC-09.
- **Problem:** At 320 the shell is 288px (320 − 2 × 16), so the 300px creative does not fit the inset at wrapper width.
- **Workaround:** The DOC-09 `max-w-full` on the placeholder: the stand-in shrinks to 288px, with no horizontal scroll. A real fixed-size creative would overflow or be cut.
- **Suggested solution:** Name a creative for widths below 332px (for example 300×250 only from 360, else 320×100 or none), or allow the inset to go outside the shell on phones.

### DOC-19 Rank numeral must be `aria-hidden`, but the §7.1 CSS draws it as generated content

- **Found:** FL-10 · **Severity:** Medium · **Status:** Workaround in code
- **Source:** `typography-system.md` Section 7.1 ("The numeral is `aria-hidden`" and the `.rank-list` CSS).
- **Problem:** The CSS draws the numeral with `li::before { content: counter(rank) }`. A pseudo-element cannot take `aria-hidden`, and browsers put generated content in the accessible name. Screen readers would hear the rank twice: once from the list position, once from the numeral.
- **Workaround:** A marked project addition after the copied block in `src/styles/typography.css` repeats the two `content` declarations with empty alternative text: `content: counter(rank, decimal) / ""` and `counter(rank, bengali) / ""`. Browsers without this syntax drop the declaration and use the §7.1 rule. Playwright checks the computed value and the accessibility tree.
- **Suggested solution:** Put the alternative text form in the §7.1 CSS, or change the wording to "hidden from screen readers with empty alternative text".

---

### DOC-20 No slider CSS in §12.3

- **Found:** FL-11 · **Severity:** Medium · **Status:** Workaround in code
- **Source:** `spacing-layout-system.md` Sections 7.2, 7.4 and 12.3.
- **Problem:** 7.2 says P-3b shows 2 regions in view from 600 and 4 from 1024, and 7.4 says the row uses scroll snap and a button moves "column width + gap". 12.3 has no container CSS for this row, so the column width is not a token and LAY-01 cannot be met without an arbitrary value. A scroll container also clips the focus ring (COL-13) of the items at its edges, and the specs give no room for it.
- **Workaround:** `RegionSlider.tsx` uses Tailwind arbitrary values built only from the gap token: `sm:auto-cols-[calc((100%-var(--grid-column-gap))/2)]` and `lg:auto-cols-[calc((100%-3*var(--grid-column-gap))/4)]`. The row has `sm:-m-1 sm:p-1 sm:scroll-p-1` (and the phone tablist `-mx-1 p-1`): 4px of room for the ring, while the columns stay in line with the shell. The row box reaches 4px into the page gutter; nothing visible does.
- **Suggested solution:** Add a `.slider-row` block to §12.3 with the column width per tier, the snap rules and the focus-ring room (or an inset focus ring for items in scroll containers).

---

### DOC-21 "4 regions in view" next to "no 4-up rows"; buttons with 3 or 4 regions

- **Found:** FL-11 · **Severity:** Low · **Status:** Open
- **Source:** `spacing-layout-system.md` 3.3, 7.2, 7.3, LAY-07; DR-44, DR-54.
- **Problem:** LAY-07 and 3.3 say the homepage has no 4-up row; 7.2 and DR-54 show 4 regions in view from 1024. Most read has its own exception (DR-51); the slider has none in the rule text. Also, 7.3 says "4 regions or fewer: no buttons", but at 600–1023 only 2 are in view, so with 3 or 4 regions a mouse user without a trackpad reaches the others only with the scrollbar or the keyboard.
- **Built:** As written: 4 in view from 1024; buttons only with 5 regions or more. The native scrollbar stays visible.
- **Suggested solution:** Add the slider to the LAY-07 exceptions. Decide whether the button rule counts regions or "more regions than in view".

---

### DOC-22 Footer container name and link list

- **Found:** FL-12 · **Severity:** Low · **Status:** Open
- **Spec:** `spacing-layout-system.md` 7.1 row 15 and 7.4; decision register DR-59
- **Problem:** 7.1 gives the footer container as "Ad container (full-width row) with content in the shell". Section 2 defines the ad container as one ad slot, so the name is confusing; the meaning is a full-width row. DR-59 lists Contact, Corrections and Privacy; 7.4 adds About and Terms.
- **Workaround:** Built per 7.4 (higher authority): a full-width `<footer>` row with the content in `Shell`, and all five links.
- **Suggested solution:** Say "Full-width row" in 7.1 row 15, and add About and Terms to DR-59.

### DOC-23 First screen at 1366×768 shows no headline

- **Found:** FL-13 · **Severity:** Medium · **Status:** Open
- **Spec:** `spacing-layout-system.md` Section 13 (first screen)
- **Problem:** Section 13 says top ad 274 + bar 64 + nav row 48 leave about 264px for the hero in a 650px viewport. It leaves out `space-section` above the hero (40px), so the hero starts at 426 and 224px shows. That is the top of the lead image only: no headline is in the first screen, in Bangla or English (`docs/fl-13/first-screen-*.jpg`).
- **Suggested solution:** Decide whether a headline must be in the first screen. If yes: a lower top-ad reservation from 1024, a shorter lead image ratio, or the lead text above the image at that size.

### DOC-24 Headline roles have no line-break rule for long words

- **Found:** FL-13 · **Severity:** Medium · **Status:** Open
- **Spec:** `typography-system.md` Section 8.2
- **Problem:** No role sets `overflow-wrap`. A headline with one long Bangla compound word (40 letters in the test) is wider than its column and scrolls the page at every width. Mock headlines with normal words fit.
- **Suggested solution:** Add `overflow-wrap: break-word` to the story title and section title roles (TYP-20: change the token, not the component).


### DOC-25 The §6 CSS block leaves out the button and icon tokens

- **Found:** R2-04 · **Severity:** Low · **Status:** Workaround in code
- **Spec:** `component-system.md` Section 6 (table and CSS block)
- **Problem:** The table lists `--button-height`, `--button-padding`, `--icon-button-size`, `--icon-button-size-bar`, `--icon-size` and `--button-icon-gap`, but the copy-ready CSS block has none of them. "Copy token CSS from the specs" has nothing to copy for these six.
- **Workaround:** `src/styles/components.css` is the spec block unchanged, plus the six tokens typed from the table values (3rem, 1.25rem, 2.75rem, 2rem, 1.25rem, 0.5rem) in their own group.
- **Suggested solution:** Add the six tokens to the CSS block in Section 6.

### DOC-26 Chip label size does not match the eyebrow role

- **Found:** R2-04 · **Severity:** Low · **Status:** Open
- **Spec:** `component-system.md` C-11 (label, live) and `typography-system.md` 7.1
- **Problem:** The sheet says "type-eyebrow 15px 600". In English `type-eyebrow` is 14px, 700, uppercase, 0.06em (Bangla is 15px 600). The label and live chips use the role (TYP-18), so English shows 14px bold capitals.
- **Suggested solution:** Say "type-eyebrow" only, or give both languages in the sheet.

### DOC-27 Pixel values and a color switch with no token

- **Found:** R2-05 · **Severity:** Low · **Status:** Workaround in code
- **Spec:** `component-system.md` C-12 (ThemeToggle: radius 6px and 4px; ThemeButton and ThemeToggle colors), C-17 (Layout: padding = page gutter minus the controls inner space), §6; `color-system.md` §2.9
- **Problem:** Three values have no token. (1) The switch corner radii, 6px and 4px, in a project where `--radius-*` is `initial` (CPT-05). (2) The top bar side padding, "the page gutter minus the controls inner space" (10px on phones at 16 gutter, 18px at 600, 12px from 768): no scale class gives it. (3) The theme control color is `interactive` in light and `ink` in dark; a component cannot write `dark:` (COL-03), and §2.9 says "no component has its own color tokens". `--color-bar` in §6 is the same kind of switch, so a token is the only way.
- **Workaround:** `components.css` has `--top-bar-inset`, `--switch-radius-track`, `--switch-radius-thumb` and `--color-theme-control` (CPT-07, `AGENTS.md` rule 19).
- **Suggested solution:** Add the four tokens to `component-system.md` §6, and drop the "no component color tokens" sentence in §2.9 or name this one as the exception.

### DOC-28 NavBar row height with the rule; Drawer row rule next to an accordion

- **Found:** R2-05 · **Severity:** Low · **Status:** Open
- **Spec:** `component-system.md` C-18 (item `min-h-12`, Surface "1px border rule at the bottom"), C-19 (`Drawer.item`, `Drawer.accordion`); `spacing-layout-system.md` §6 (`--nav-row-height` 48px)
- **Problem:** (1) The NavBar is 48px of items and a 1px rule. The sheet does not say if the rule is inside the 48px. Built: 48px row plus the rule, 49px in total. (2) "A 1px rule under every category row" does not say where the rule goes when the row has children. Built: under the row itself, then the child group on the page surface, so the rule is above the children.
- **Suggested solution:** Say "48px including the rule" or "48px plus the rule" in C-18, and say in C-19 where the rule goes for a row with open children.

### DOC-30 Values with no token: lead panel start, feature split

- **Found:** R2-07 · **Severity:** Low · **Status:** Workaround in code
- **Source:** `component-system.md` C-01 (panel padding "16px top and end, 0 at the start" narrow, 24 and 32px medium and wide), C-24 and P-2 (the image column `clamp(26.25rem, calc((100% - 24px) * 0.5 | 0.6), 34.8125rem)`), §6.
- **Problem:** §6 has `--space-lead-panel` but not its start side, and no tokens for the feature split numbers. The §6 container rule sets the lead tokens on `.lead-story`, which must sit inside the container, so the container is a wrapper and not the card itself.
- **Built as:** `components.css` adds `--space-lead-panel-start` (0, then `var(--space-lead-panel)` from 600px of card width) and `--story-feature-media-min`, `-max` and `-share` (0.5, 0.6 from 1024), with `@utility story-split-third` and `story-split-feature`. LeadStory has a `@container` wrapper around the `.lead-story` article.
- **Suggested solution:** Add the tokens to §6 and say that the container is the parent of `.lead-story`.

---

## Design-system gaps (U-)

### DOC-29 Rail ad box: 304 or 300

- **Found:** R2-06 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` C-16 (`AdSlot.creative`, rail) and `spacing-layout-system.md` 12.2 (`--ad-rail-w: 300px`).
- **Problem:** The sheet says "box = rail width 304 ... w-(--ad-rail-w)". The token is 300px; the rail is 304px.
- **Built as:** The row fills the 304px rail (surface-alt); the 300×600 creative box (`w-(--ad-rail-w)`) is centered in it.
- **Suggested solution:** Say "row = rail width 304, creative box 300".

### U-01 English category labels

- **Found:** FL-01 · **Severity:** Medium · **Status:** Open
- **Gap:** The specs name the categories in Bangla only (`IA-06`).
- **Treatment used:** The working labels from the `mock-content` skill, in `src/i18n/en.ts` under `categories` (FL-04). The region labels under `regions` are working labels too (see U-07).
- **Suggested solution:** The editorial team approves an English label list. Add it to the decision register.

### U-02 Card variants, radius, icons, motion

- **Found:** FL-01 · **Severity:** Medium · **Status:** Open
- **Gap:** No spec defines card variants, corner radius, elevation (other than `COL-15`), icons or motion (`agent-contract.md` Section 9).
- **Treatment used:** A neutral treatment: square corners, no shadow, no animation, text labels instead of icons where possible (`AGENTS.md` Section 8).
- **Suggested solution:** A components pass in the blueprint project after the homepage prototype rounds.

### U-03 বিশ্লেষণ ও মতামত section background

- **Found:** FL-01 · **Severity:** Low · **Status:** Built in FL-07; tajmin checks the look
- **Gap:** `DR-76` sets `surface-elevated`, which is pure white in light mode. It can look like a hole on the warm `background`.
- **FL-07 result:** Built as `DR-76` says. Measured: light `rgb(255,255,255)` on the page `rgb(255,249,237)`, next to ad rows `rgb(246,238,223)`; dark `rgb(48,50,57)` on `rgb(24,25,30)`. The three surfaces are distinct in both themes, as 7.4 asks. In light mode the white panel reads as a lifted block, not a hole, with the `space-module` padding (U-17).
- **Suggested solution:** tajmin and the design owner confirm the look. If it looks wrong, propose `surface` or `surface-alt` (but `surface-alt` is the ad-row color, which 7.4 rules out).

### U-04 Theme switch and language switch look

- **Found:** FL-02 · **Severity:** Medium · **Status:** Open
- **Gap:** Layout §6 gives the place and behavior of the theme and language switches, but not their look.
- **Treatment used:** `src/components/header/ThemeSwitch.tsx` is a bordered group of three text buttons; the pressed one is filled `interactive`. `LanguageSwitch.tsx` is a text link. Padding uses the Tailwind spacing scale (`px-3 py-2`), because no spacing token covers controls.
- **Suggested solution:** Design the controls in the header pass (FL-05): icon or text, one cycling button or three. Add control spacing tokens.

### U-05 No minimum touch target size

- **Found:** FL-02 · **Severity:** Medium · **Status:** Open
- **Gap:** No spec sets a minimum target size. The FL-02 switches are about 33px high. That passes WCAG 2.2 AA (24px) but not the 44px that most mobile guidelines use.
- **Suggested solution:** Add a token such as `--target-min: 2.75rem` (44px) to the layout spec, and use it for header controls from FL-05.

### U-06 Section heading rule thickness

- **Found:** FL-03 · **Severity:** Low · **Status:** Fixed in R2-04 (C-13 and C-22 give a 1px border rule and a brand bar; `SectionHeading` uses `Divider`)
- **Gap:** Layout §5.2 has `space-section-rule-title` and color §2 says `brand` is for editorial rules, but no spec gives the rule's thickness or length.
- **Treatment used:** `src/components/layout/SectionHeading.tsx`: a 1px `border-brand` top border across the full width of the heading row.
- **Suggested solution:** Set the thickness (1px, 2px or 3px) and whether the rule spans the shell or only the wrapper, in the components pass.

### U-07 Region list under অঞ্চল

- **Found:** FL-04 · **Severity:** Medium · **Status:** Open
- **Gap:** `DR-19` puts চীন under অঞ্চল, and the `mock-content` skill asks for 6 or more regions, but no spec or decision lists the regions or their order.
- **Treatment used:** Seven working regions in `src/content/homepage.ts` and `src/i18n/bn.ts` / `en.ts`: চীন, ভারত, মিয়ানমার, মধ্যপ্রাচ্য, দক্ষিণ-পূর্ব এশিয়া, ইউরোপ, আফ্রিকা. আফ্রিকা has no stories, so it never shows (§7.3).
- **Suggested solution:** The editorial team approves the region list, the order and the English labels. Add them to the IA label table (`IA-06`).

### U-08 Logo asset and its role

- **Found:** FL-05 · **Severity:** Medium · **Status:** Open
- **File:** `src/components/header/SiteHeader.tsx` (logo link)
- **Treatment used:** The site name as text, `type-section-title`, `text-brand` (COL-04), linking to the front page. The accessible name is "ফ্যাক্ট লেন্স, প্রথম পাতা" / "Fact Lens, front page".
- **Note:** `brand` on the dark background is 2.37:1. WCAG and `color-system.md` Section 3 exempt logos, so the e2e axe helper leaves out only that node of `color-contrast`. A text stand-in still reads as text, so in dark mode it is hard to read.
- **Suggested solution:** Supply the logo as SVG with a dark-theme version (or one color that works on both), and the size per tier. Remove the axe exception then.

### U-09 Theme control in the bar: one cycling icon button

- **Found:** FL-05 · **Severity:** Medium · **Status:** Open
- **File:** `src/components/header/ThemeToggle.tsx`
- **Treatment used:** One 44px icon button (monitor, sun, moon from `lucide-react`). Each press moves system → light → dark → system. The accessible name gives the current state ("থিম: সিস্টেম"). The three-button `ThemeSwitch` group does not fit the phone bar beside the logo; it stays on the temporary `/foundations` page.
- **Suggested solution:** Design owner confirms the cycle button, or chooses a small menu (button + three options).

### U-10 Drawer and search dialog look

- **Found:** FL-05 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/header/Drawer.tsx`, `SearchDialog.tsx`, `SearchForm.tsx`, `classes.ts`
- **Treatment used:** `surface-elevated` panels on the `overlay` scrim, no shadow (DOC-11), no radius. The drawer is `--drawer-width` from the left, with a 200ms slide (none with reduced motion). The search dialog is shell width, just below the bar height. Item rows are 44px. Region sub-items are indented 16px. In light mode `surface-elevated` is white against the cream page; visual QA noted the contrast between the two.
- **Suggested solution:** Include the drawer, search dialog and bar controls in the component pass (with U-02 and U-04).

### U-11 Headline link color

- **Found:** FL-06 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/story/links.ts`
- **Treatment used:** `text-ink`; hover `interactive-hover`, press `interactive-pressed`; no underline; focus ring with the `background` offset. See DOC-14.
- **Suggested solution:** Decide in the component pass with the card variants (U-02).

### U-12 Lead text panel inset and padding

- **Found:** FL-06 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/home/hero/LeadStory.tsx`
- **Treatment used:** From 768px the panel is `surface`, inset 64px from the end (`md:me-16`), with `space-story-media-text` (16px) padding on all sides. Its start edge lines up with the image. Below 768px the text is under the image with no panel color.
- **Suggested solution:** Give the inset and the padding in 7.4, or as tokens.

### U-13 Card without image beside a card with image

- **Found:** FL-06 · **Severity:** Medium · **Status:** Open
- **Files:** `src/components/story/StoryCard.tsx`, `src/components/home/hero/Hero.tsx`
- **Treatment used:** Section 8 and LAY-08: a missing part leaves its subgrid row empty. In the full mock content the second top story has no image. Its text starts level with the first card's text, so a blank band sits above it. The long Bangla headline of the first card also makes the shared title row tall, so a gap opens between the short headline and its summary. Visual QA noted this at 768.
- **Suggested solution:** One of: (a) require an image for both top stories; (b) a card variant without image, used for both cards when one has no image (LAY-08 allows one variant per row); (c) accept the gap. Decide in the component pass.

### U-14 Bangla Breaking label and label padding

- **Found:** FL-06 · **Severity:** Low · **Status:** Open
- **Files:** `src/i18n/bn.ts` (`story.breaking`), `src/components/story/StoryEyebrow.tsx`
- **Treatment used:** COL-11 names the English word "Breaking" only. The Bangla page shows "সদ্যপ্রাপ্ত" (no English word, T-27) on `bg-live` with `text-on-live`, padding `px-1`.
- **Suggested solution:** Editorial team confirms the Bangla word (for example "সদ্যপ্রাপ্ত" or "ব্রেকিং"). Component pass sets the label padding.

### U-15 Analysis item layout (image-led list)

- **Found:** FL-07 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/home/analysis-opinion/AnalysisList.tsx`
- **Gap:** 7.2 calls the analysis column an "image-led list" but gives no item layout, image size or ratio.
- **Treatment used:** Every item has the 16:9 image at the start, one third of the column wide, and the text beside it (`space-story-media-text` between them) at every width. Text: category eyebrow, `type-story-title-sm`, the summary if there is one, then time and reading time. A story with no image has the text only, at full column width. Items are separated by a `border` rule with `space-list-item` on each side.
- **Suggested solution:** Decide in the component pass: thumbnail beside the text (as built), a first item with a large image and smaller items below, or image above the text on phones.

### U-16 Opinion chip padding and quote icon

- **Found:** FL-07 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/home/analysis-opinion/OpinionList.tsx`
- **Gap:** Typography 7.1 gives the chip role and colors (`type-eyebrow` on `accent-subtle`, `text-ink`) and says the quote mark is a decorative SVG, but not the chip padding, the chip-to-list space, or the icon size, color and position.
- **Treatment used:** Chip `px-1` (as the Breaking label, U-14), `space-list-item` below it. Quote icon: `lucide-react` `Quote`, 24px (`size-6`), `text-ink-muted`, `aria-hidden`, at the start of each item with `space-story-media-text` to the text. Author in weight 600, then the time with a CSS dot separator.
- **Suggested solution:** Set the chip and icon in the component pass (with U-02 icons).

### U-17 Padding inside the বিশ্লেষণ ও মতামত background

- **Found:** FL-07 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/home/analysis-opinion/AnalysisOpinion.tsx`
- **Gap:** 7.4 sets the `surface-elevated` background inside the shell but no inner padding, so the text would touch the edge of the color.
- **Treatment used:** `space-module` on every side (24 / 32 / 40). The section heading rule and the columns start inside this padding, so their start edge is inset from the other sections' start edge.
- **Suggested solution:** Add a token such as `--space-panel` to 5.1, or confirm `space-module`.

### U-18 P-2 lead: image and text split from 1280px

- **Found:** FL-08 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/home/featured/FeaturedLead.tsx`
- **Gap:** 7.2 and DR-55 put the text beside the image from 1280px, but give no split.
- **Treatment used:** Two equal columns with `grid-column-gap`, text aligned to the top of the image. Below 1280px the text is under the image with `space-story-media-text`. A lead with no image is text only.
- **Suggested solution:** Give the split in 7.4 (for example 8 + 4 of the wrapper columns, or 1:1).

### U-19 P-2 rail at 600–1023px

- **Found:** FL-08 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/home/featured/FeaturedRail.tsx`
- **Gap:** 7.2 says only "Rail below the wrapper". In one column the rail image would be as wide as the shell (up to 976px), larger than the lead.
- **Treatment used:** Two columns, like the hero Latest list: the image story on the left over both rows, the two stories on the right with a rule between them. Source order unchanged (LAY-14). One column on phones and in the 304px rail.
- **Suggested solution:** Confirm, or state the rail layout at 600–1023px in 7.2.

### U-20 Story labels inside a category section

- **Found:** FL-08 · **Severity:** Low · **Status:** Open
- **Files:** `FeaturedLead.tsx`, `FeaturedRail.tsx`
- **Gap:** 7.1 gives the category label role, but not whether a story inside its own category section shows it.
- **Treatment used:** No category label in P-2: the section heading names the category. A breaking story keeps the filled label (COL-11). Rail stories use `type-story-title-sm` (compact card or list) with no summary.
- **Suggested solution:** Confirm in the component pass (U-02).

---

### U-21 Inside of a P-3 category block

- **Found:** FL-09 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/home/grouped/CategoryBlock.tsx`
- **Gap:** 7.2 says "rows of two categories" but not what one category shows.
- **Treatment used:** The section heading (rule and `type-section-title`, as in P-2), then a list: the first story with its 16:9 image and `type-story-title`, the other stories as compact items in `type-story-title-sm`, with the list rule between items (`space-list-item`). Time and reading time under each title. No summary, no category label (U-20), no "আরও দেখুন" link (as IMP-23).
- **Suggested solution:** Define the category block in the component pass (U-02), with the story count per block.

---

### U-22 P-3 rail module look (newsletter, poll)

- **Found:** FL-09 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/home/grouped/classes.ts`
- **Gap:** 7.4 lists the parts of the newsletter and the poll and says they never use the ad label or ad colors, but gives no surface, border or padding.
- **Treatment used:** No background. A 1px top rule in `border` with `space-section-rule-title` above the heading, so the module tops line up with the category heading rules beside them. The rule is the divider color, not `brand`, because the modules are not editorial sections (COL-04). Field and buttons 44px tall (U-05).
- **Suggested solution:** Decide the module surface in the component pass (for example `surface-elevated` with padding).

---

### U-23 Form text roles: field label, consent line, error and done messages

- **Found:** FL-09 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/home/grouped/NewsletterSignup.tsx`, `DailyPoll.tsx`
- **Gap:** Typography 7.1 maps the newsletter heading, text, email field and buttons, but not the field label, the consent line, the error message or the done message. 7.1 also says "every homepage text uses a role in this table".
- **Treatment used:** A visible field label (a placeholder alone is not a label) in `type-ui-sm` `text-ink-secondary`, as in the header search form. Consent line `type-ui-sm` `text-ink-secondary`, with an underlined `interactive` privacy link (a link in a sentence needs more than color). Error `type-ui-sm` `text-error`. Done message `type-ui` `text-success` on `success-subtle`, with the mock note in `type-ui-sm` `text-ink`.
- **Suggested solution:** Add rows for form label, help and error text, and status message to 7.1 or 7.3.

---

### U-24 Poll question role and result bar look

- **Found:** FL-09 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/home/grouped/DailyPoll.tsx`
- **Gap:** 7.1 gives the poll heading, options and results, but not the question. 7.4 says "result bars" with no size or color.
- **Treatment used:** The heading is "আজকের জরিপ" / "Daily poll" (`type-story-title-sm`); the question is the fieldset legend in `type-summary` `text-ink`. Each result: the option and its percent (`type-ui-sm`, tabular digits), then an 8px bar (`h-2`): track `border-soft`, fill `interactive`, width from the percent. The reader's own option is marked with "(আপনার ভোট)" in text, with no weight change (TYP-24). The total votes line is `type-ui-sm` `text-ink-muted`. No animation (motion is a gap, U-02).
- **Suggested solution:** Add the question role and the bar size and colors to the component pass.

---

### U-25 Spacing inside forms has no tokens

- **Found:** FL-09 · **Severity:** Medium · **Status:** Open
- **Files:** `src/components/home/grouped/NewsletterSignup.tsx`, `DailyPoll.tsx`, `classes.ts` (and `src/components/header/classes.ts` since FL-05)
- **Gap:** Section 5.2 has story and list spacing, but none for label to field, field to button, between radio options or the result bar height. LAY-01 says to add a token before typing a space value. The design reviewer flagged this as a strict LAY-01 break.
- **Treatment used:** The Tailwind spacing scale, as in the header controls accepted in FL-05: `gap-2` (label, field, button), `gap-3` (radio to label, result rows), `mt-1`, `mt-2`, `mt-3`, `px-3`, `py-2`, `h-2` (bar), `size-5` (radio), `min-h-11` (44px targets, U-05). No pixel values.
- **Suggested solution:** Add form spacing tokens (`space-field-label`, `space-field-gap`, `space-option`) and a control size token to Section 5.2.

### U-26 Bangla name of the Most read section

- **Found:** FL-10 · **Severity:** Low · **Status:** Open
- **Files:** `src/i18n/bn.ts` (`mostRead.title`)
- **Gap:** The specs and the decision register name P-5 in English only ("Most read"). The Bangla page needs a Bangla heading (T-27).
- **Treatment used:** "সর্বাধিক পঠিত" as a working label. English: "Most read".
- **Suggested solution:** The editorial team picks the Bangla name (for example "সর্বাধিক পঠিত" or "সবচেয়ে বেশি পড়া").

### U-27 Most read item content and row gap

- **Found:** FL-10 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/home/most-read/MostRead.tsx`
- **Gap:** §7.1 sets the numeral and says the title starts beside it. It does not say what else an item shows (time, category, image) or the space between the two rows. There is no list rule between items.
- **Treatment used:** Title only, in `type-story-title-sm` (compact list role). Row gap `space-module`; column gap `grid-column-gap`. No rules between items. The numeral top aligns with the title top through `align-items: start` and line height 1; visual QA measured the numeral glyph 2 to 4px lower than the first title line (the title line height is above 1).
- **Suggested solution:** Name the item parts and the row gap in the component pass.

---

### U-28 Region chip and region column heading look

- **Found:** FL-11 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/home/regions/RegionSlider.tsx`
- **Gap:** 7.1 gives the chip role (`type-ui-sm`), size (44px or more, as wide as the label) and nothing else. The heading of a region column in the slider is not in the role map.
- **Treatment used:** Chip: 1px `border-interactive` border, `text-interactive`, `px-3`, `gap-2` between chips; selected chip filled `interactive` with `on-interactive` text. Column heading: `h3` in `type-ui-sm text-ink` with the P-3 rail top rule (U-22), `space-list-item` below; visually hidden below 600, where the chip names the panel. Stories: the P-3 story stack (U-21).
- **Suggested solution:** Define the chip (tabs, filters) and the column heading in the component pass.

---

### U-29 Slider button place, icon and disabled look

- **Found:** FL-11 · **Severity:** Low · **Status:** Open
- **Files:** `RegionSlider.tsx`, `src/components/layout/SectionHeading.tsx`
- **Gap:** 7.4 names the buttons and their behavior, not their place or look. Motion has no token (U-02); 7.4 gives 200–300ms.
- **Treatment used:** Two 44px icon buttons (`lucide-react` chevrons, the header icon-button classes) at the end of the section heading row (LAY-18 bars only the "more" link there). At an end the button is `aria-disabled` in `ink-disabled`, so focus stays on it. 250ms ease-out scroll.
- **Suggested solution:** Place and draw the slider controls in the component pass; add a motion token.

---

### U-30 Minimum footer look and social icons

- **Found:** FL-12 · **Severity:** Low · **Status:** Open
- **Files:** `src/components/footer/SiteFooter.tsx`, `src/components/footer/SocialIcon.tsx`, `src/i18n/*.ts` `footer`
- **Gap:** 7.4 gives the footer content only. No background, rule, padding, text roles, icon set, network list or labels. Icons are a gap (U-02), and `lucide-react` 1.x has no brand icons.
- **Treatment used:** Page background with a 1px `border` rule across the full width; `space-module` above and below inside the shell; row 1 the text logo (U-08) and the social links, row 2 the five site links, both rows wrap. Site links `type-ui-sm` in `text-interactive` (like "আরও দেখুন"), 44px tall. Social links: 44px icon buttons (header classes) with Simple Icons 16.34.0 brand marks (CC0) inline in `currentColor`, for Facebook, YouTube, X and Instagram (tajmin's choice of inline icons). The text name is the `aria-label`; the list is named "সামাজিক মাধ্যমে ফ্যাক্ট লেন্স" / "Fact Lens on social media". Working Bangla labels: আমাদের সম্পর্কে, যোগাযোগ, সংশোধনী, গোপনীয়তা নীতি, ব্যবহারের শর্তাবলি.
- **Suggested solution:** Design the footer (tajmin, DR-59); confirm the networks, the icon source and the Bangla labels with the editorial team.

### U-31 Logo size and weight have no type role

- **Found:** R2-05 · **Severity:** Medium · **Status:** Open
- **Files:** `src/components/header/SiteHeader.tsx`, `Drawer.tsx`, `src/components/footer/SiteFooter.tsx`
- **Gap:** C-17 `TopBar.logo` says "serif 700, 24px (20px phones, 22px at 768)" and C-21 `Footer.logo` "the same stand-in, 24px". The typography system has no logo role (TYP-01), and raw sizes are not allowed (TYP-18). The ticket says to keep the text placeholder.
- **Treatment used:** `type-section-title` (22px, 600) in `brand`, as in run 1. The size is the same at every width.
- **Suggested solution:** Add a `type-logo` role (or call the stand-in a role) with the three sizes, or wait for the logo file (BRD-06) and remove the text.

### U-32 ThemeButton moon glyph "redrawn larger"

- **Found:** R2-05 · **Severity:** Low · **Status:** Open
- **File:** `src/components/header/ThemeButton.tsx`
- **Gap:** C-12 PhoneBarButtons says the moon is "redrawn larger, about 1px above the box center". There is no drawing, and icons are Lucide shapes (BRD-03).
- **Treatment used:** The Lucide moon at 20px, moved 1px up. The sun is unchanged.
- **Suggested solution:** Supply the redrawn moon as an SVG, or accept the Lucide moon.

### U-33 Story with no image

- **Found:** R2-07 · **Severity:** Medium · **Status:** Open (flag)
- **Files:** `LeadStory.tsx`, `OverlapCard.tsx`, `StoryCard.tsx`, `StoryImage.tsx`
- **Gap:** The R2-07 ticket says "use the missing-image look from the sheet". No sheet has one: C-01, C-02 and C-24 say "image required". The mock set keeps no-image stories on purpose (R2-03): the second hero top story, the sparse lead, and the long no-image headlines.
- **Treatment used:** The image part is left out. LeadStory and OverlapCard show their text block with no overlap, no inset and no notch; the lead keeps its bar. StoryCard shows its text in one column. No gray box, no blank band.
- **Rules:** CPT-08, LAY-17. The blank band of U-13 is gone because the hero pair no longer uses subgrid (DR-99).
- **Suggested solution:** Either every story that reaches these cards has an image (the mock set drops the cases), or the sheets add a no-image variant for each card.

---

## Implementation choices to confirm (IMP-)

### IMP-01 Remembered English choice redirects only at `/`

- **Found:** FL-02 · **Severity:** Medium · **Status:** Needs confirmation
- **Context:** `DR-17` says "the site remembers the reader's choice" but not how.
- **Choice made:** The language switch links to `?lang=xx`. `src/proxy.ts` stores the choice in the `fl-lang` cookie for one year. With `fl-lang=en`, only `/` redirects to `/en`. All other Bangla URLs stay Bangla, so a shared Bangla link opens in Bangla. The browser language is never read.
- **Alternative:** Redirect every unprefixed URL for English readers. That breaks shared Bangla links, and Bangla and English articles may not be pairs.
- **Suggested solution:** Keep the current choice. Ask the editorial team to confirm it, and add the reading to `DR-17`.

### IMP-02 shadcn CSS imports left out of `globals.css`

- **Found:** FL-02 · **Severity:** Medium · **Status:** Needs decision before `shadcn add`
- **Context:** The rule says `globals.css` imports Tailwind and the three token files only. `shadcn init` had added `tw-animate-css` and `shadcn/tailwind.css`.
- **Choice made:** Both imports are removed. The packages are still installed.
- **Impact:** The `base-nova` components use the variants and animations from those files. They will not style correctly until the imports come back.
- **Suggested solution:** Before the first `shadcn add` (likely FL-05, for the drawer and dialog), decide either to add the two imports to `globals.css` (a rule exception, recorded here), or to copy only the needed variants into a small `src/styles/shadcn.css`.

### IMP-03 Cookie redirect and CDN caching

- **Found:** FL-02 · **Severity:** Medium · **Status:** Check before the first deploy (FL-14 rejected)
- **Risk:** If a CDN caches the response for `/`, readers can get another reader's language.
- **Suggested solution:** In the first preview deploy, test `/` with and without the `fl-lang` cookie. If needed, send `Cache-Control: private, no-store` on the redirect.

### IMP-04 Theme choice kept in local storage, not a cookie

- **Found:** FL-02 · **Severity:** Low · **Status:** Closed (no action)
- **Choice made:** The theme choice is in `localStorage` (`fl-theme`). An inline script in `<head>` applies it before the first paint, so there is no flash and the pages stay static.
- **Note:** A cookie would only help if the server had to render the theme. That is not needed now.

### IMP-05 shadcn `base-nova` preset

- **Found:** FL-01 · **Severity:** Medium · **Status:** Needs decision before `shadcn add`
- **Context:** `shadcn init` chose the default `base-nova` preset (Base UI primitives, `lucide-react` icons, `tw-animate-css`). Icons and motion are gaps (U-02).
- **Suggested solution:** Confirm the preset together with IMP-02 before the first component is added.

### IMP-06 `agentRules: false` in `next.config.ts`

- **Found:** FL-01 · **Severity:** Low · **Status:** Closed (no action)
- **Note:** Without it, `next dev` writes a Next.js block into `AGENTS.md`, a kit file that must not change.

### IMP-07 Playwright runs Chromium only

- **Found:** FL-01 · **Severity:** Low · **Status:** Open (not added in FL-13)
- **Suggested solution:** Add WebKit (Safari on iPhone) in the next milestone. It matters most for Bangla text shaping and `text-wrap: balance`.

### IMP-08 Which creative the ad placeholder shows

- **Found:** FL-03 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** Where Section 9 lists several creatives, the placeholder shows the one that fills the reserved height: `ad-band-top` 320×100 / 728×90 / 970×250; `ad-band` 336×280 / 300×250 (768) / 970×250; `ad-inset` 300×250 / 728×90 (from 1280).
- **Note:** It is a stand-in only. Real creatives set their own size inside the reserved height.

### IMP-09 Extra layout part `WithRail`

- **Found:** FL-03 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** The `.with-rail` grid is its own part, `WithRail`, so that a section can put its `SectionHeading` above the wrapper and rail. For the sparse case (no rail content) a section uses `Wrapper` without `WithRail`, and the wrapper spans the shell. `PeerRow` and `PeerCard` are the peer-row grid.

### IMP-10 `readingMinutes` added to the `Story` type

- **Found:** FL-04 · **Severity:** Low · **Status:** Needs confirmation
- **Context:** `typography-system.md` §7.1 says card metadata is "time, then reading time". The `Story` shape in the `mock-content` skill has no reading-time field.
- **Choice:** `src/content/types.ts` adds an optional `readingMinutes`. Latest items have none, so a card must show time only when it is missing. `Lang` comes from `src/i18n/config.ts` instead of a second copy.
- **Suggested solution:** Add `readingMinutes?: number` to the skill's shape (a kit change, tajmin's call).

### IMP-11 `getHomepage` applies the content rules and has a sparse variant

- **Found:** FL-04 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** `getHomepage(lang)` returns the sections in page order. It removes a region with no stories, and returns `null` for a section with no content, so the page drops the section and its ad row (§7.3, `LAY-13`). `getHomepage(lang, { variant: "sparse" })` returns one sparse case per pattern: a lead with no image, one top story, a short Latest, an empty opinion column, a বাংলাদেশ section with no rail, no ভূরাজনীতি section, three grouped categories, three most-read items and three regions.
- **Suggested solution:** From FL-06, the homepage reads a `?content=sparse` query (prototype only) and passes the variant, so tajmin and the Playwright tests can see the sparse cases. Remove the query with the temporary pages in FL-13, or keep it behind a dev check.

### IMP-12 Category and region labels are interface strings

- **Found:** FL-04 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** Stories carry only `category` and `region` ids. The labels are in `src/i18n/bn.ts` and `en.ts` (`categories`, `regions`), because the nav row, drawer, section headings and region chips all show them (T-27).
- **Note:** A backend can later send labels with the content. Then the string tables keep only the fallback.

### IMP-13 Drawer and search use native `<dialog>`, not shadcn

- **Found:** FL-05 · **Severity:** Medium · **Status:** Needs confirmation
- **Choice:** `useModalDialog.ts` opens a `<dialog>` with `showModal()`. The browser makes the page inert, keeps focus in the dialog and closes it on Escape. The hook adds the first-item focus, the scrim click, the scroll lock (`data-modal-open` on `html`) and the focus return. No new dependency.
- **Why:** shadcn Dialog and Sheet need the CSS imports that IMP-02 and IMP-05 have not decided yet.
- **Note:** In Chrome, Tab can leave a modal dialog to the browser's own controls. That is the platform behavior. The page behind stays inert.

### IMP-14 Nav, region and Subscribe links go to homepage anchors

- **Found:** FL-05 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** Category and region pages do not exist (DR-01). Links go to `#category-<id>`, `#regions`, `#region-<id>` and `#newsletter`. FL-06 to FL-11 must give the sections these ids. A drawer link closes the drawer and moves the focus to its target when the target exists; otherwise focus returns to the menu button.
- **FL-08:** `#category-bangladesh` and `#category-geopolitics` now exist. The header test that used a stand-in target uses the real section. The other categories get ids in FL-09.
- **FL-09:** `#category-security`, `#category-history`, `#category-economy`, `#category-technology` and `#newsletter` now exist. Only `#regions` and `#region-<id>` (FL-11) are left.
- **FL-11:** `#regions` and every `#region-<id>` now exist. On phones a region link also selects its tab. Every anchor has a target.

### IMP-15 Search field is `type="text"`, not `type="search"`

- **Found:** FL-05 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** A `type="search"` field takes the first Escape to clear its text, so the dialog needed two presses to close. The field is `type="text"` with `enterKeyHint="search"` inside a `role="search"` form. Search shows a "no results in the prototype" note.

### IMP-16 Nav row hides the items that do not fit after hydration

- **Found:** FL-05 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** `NavRow.tsx` measures the items after load and on resize, and sets `hidden` on items that wrap to a second line (they also leave the tab order). The server HTML has all items. Today all 7 items fit at 1280 in both languages, so nothing is hidden and nothing moves. If labels get longer, the row can wrap for a moment before hydration.
- **Suggested solution:** If that happens, reserve one line before hydration, or decide the item list per language at build time.

### IMP-17 On phones the drawer focuses the search field first

- **Found:** FL-05 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** Section 6 says focus moves to the drawer's first item, and DR-21 makes search the first item on phones. So on a phone the keyboard opens with the drawer. From 768px focus goes to the first nav link.
- **Suggested solution:** If the keyboard is unwanted, focus the close button or the first link on phones; this changes the Section 6 wording.

### IMP-18 Story and Latest links lead to 404 pages

- **Found:** FL-06 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** Story headlines link to `/story/<slug>` (`/en/story/<slug>` in English) and the Latest "আরও দেখুন" link to `/latest`. These pages do not exist yet (AGENTS.md Section 1), so they show the 404 page. Real URLs keep the keyboard order and link semantics right.
- **Suggested solution:** Set the article URL pattern in the article layout pass.

### IMP-19 Hero metadata shows the clock time only, 24-hour

- **Found:** FL-06 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** `formatTime` shows "০৯:১৫" or "09:15" in Dhaka time, with `<time datetime>` and tabular digits. A 12-hour clock would show "AM" and "PM" in Latin letters on Bangla pages (T-27). No date and no relative time ("২০ মিনিট আগে"), because the mock stories are all from one day and a relative time changes with the server clock.
- **Suggested solution:** Editorial team picks clock, date or relative time per section.

### IMP-20 Hidden page heading and hero heading

- **Found:** FL-06 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** The page has a visually hidden `h1` ("ফ্যাক্ট লেন্স: প্রথম পাতা"), and the hero section is named by a hidden `h2` ("প্রধান খবর" / "Top stories"). The lead, the top stories and Latest are `h3`. The logo stays a link, not a heading.
- **Suggested solution:** Confirm the outline and the wording, or make the logo the `h1` on the homepage.

### IMP-21 P-4 heading outline

- **Found:** FL-07 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** The section heading "বিশ্লেষণ ও মতামত" is an `h2`. Each column is a `section` with an `h3`: the analysis heading ("বিশ্লেষণ") is visually hidden, because that column has no chip (DR-77); the opinion chip is the opinion `h3`. Story titles in both columns are `h4`.
- **Suggested solution:** Confirm, or make the chip a plain label and give both columns hidden headings.

### IMP-22 Shared `MoreLink` and elevated link classes

- **Found:** FL-07 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** The "আরও দেখুন" link is now one component, `src/components/story/MoreLink.tsx`, used by Latest and both P-4 columns. `links.ts` has `headlineLinkElevated` and `textLinkElevated`, with the focus ring offset in `surface-elevated` (COL-13, DOC-07), as `header/classes.ts` already does. The analysis and opinion "more" links go to `/analysis` and `/opinion`, which are 404 until those pages exist (IMP-18).
- **Suggested solution:** Confirm. Later sections reuse `MoreLink`.

### IMP-23 P-2 has no "আরও দেখুন" link

- **Found:** FL-08 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** 7.2 lists the P-2 content (lead, one image story, two stories) with no "more" link, so none is built. A link to the category page would sit below the last rail story (LAY-18) and lead to a 404 page until category pages exist (IMP-18).
- **Suggested solution:** Decide whether category sections link to their category page.

---

### IMP-24 Ad-inset count is fixed in the markup; the phone 600px rule is checked by a test

- **Found:** FL-09 · **Severity:** Medium · **Status:** Needs confirmation
- **Choice:** P-3 puts one `ad-inset` between each pair of rows, and no more than 3 (Section 9). Section 9 also says: on phones, skip an inset when the editorial content between two ads is shorter than 600px. That height depends on the width, the fonts and the reader size, so the server cannot know it. The prototype does not measure it at run time. Instead the Playwright test checks that the content from the ad row before P-3 to the first inset is 600px or more at 320 and 360 (it is, with two categories of three stories).
- **Risk:** With short categories (one story without an image each), two ads can come closer than 600px on a phone.
- **Suggested solution:** Give the inset rule a content condition the server can check (for example "skip the inset when the row above has fewer than N stories"), or measure it in the client after layout.

---

### IMP-25 Mock newsletter: own email check, 0.8s sending state, no email sent

- **Found:** FL-09 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** The form has `noValidate` and checks the address itself (`src/lib/email.ts`: one @, no spaces, a dot in the domain), so the error is in the page language, not the browser's (T-27). A valid address shows "sending" for 0.8s, then the done message replaces the form and takes the focus. Nothing is sent (DR-01); the done message says so. The privacy link goes to `/privacy` (`/en/privacy`), a 404 page until it exists (IMP-18).
- **Suggested solution:** Confirm the copy (heading "সকালের নিউজলেটার", text and consent line) with the editorial team, and the privacy page URL.

---

### IMP-26 Poll vote kept in local storage; percents by largest remainder

- **Found:** FL-09 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** "One vote per browser" is the key `fl-poll:<poll id>` in local storage. If storage is blocked, the vote is kept in memory for the visit. The server renders the form; a browser with a stored vote shows the results after hydration. The reader's vote is added to the mock counts. Whole percents use the largest remainder, so they add up to 100 (538 + 1 of 1,401 shows 39%, not 38%). Voting with no option chosen shows "একটি উত্তর বেছে নিন।". A reader can clear storage and vote again; a real poll needs a server check.
- **Suggested solution:** Confirm. Decide the server rule when a backend exists.

---

### IMP-27 Regions slider behavior

- **Found:** FL-11 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** One markup for both modes. The tab mode is on while the tablist is displayed (the CSS `sm:hidden`), so the script has no breakpoint of its own; below 600 the panels are `tabpanel`s, from 600 named `group`s (no extra landmarks). The server HTML has the tab roles until hydration. The buttons scroll with a 250ms script animation and switch scroll snap off while the row moves, because `scroll-behavior: smooth` has no set duration; with reduced motion the row moves at once. Arrow keys wrap, Home and End work, selection follows focus. A `#region-<id>` link (nav, drawer) selects that tab on phones. The native scrollbar shows on the row and the tablist.
- **Suggested solution:** Confirm. Hide the scrollbar only if the buttons cover every case (DOC-21).

---

### IMP-28 Shared `StoryStack`; `actions` slot on `SectionHeading`

- **Found:** FL-11 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** The P-3 category story list moved to `src/components/story/StoryStack.tsx` with a `titleAs` prop (h4 under a region h3); `CategoryBlock` and P-3b use it, with the same markup as before. `SectionHeading` has an optional `actions` slot for controls at the end of the row.
- **Suggested solution:** Confirm.

---

### IMP-29 Footer link targets

- **Found:** FL-12 · **Severity:** Low · **Status:** Needs confirmation
- **Choice:** About, Contact, Corrections, Privacy and Terms go to `/about` … `/terms` (with `/en` on English pages); these pages do not exist yet, so they are 404 (as IMP-18, IMP-25). The Fact Lens social accounts are not known, so the social links go to each network's front page and open in the same tab.
- **Suggested solution:** Give the real account URLs; build the site pages after the article pass.


### IMP-30 FL-13 screenshots and measurement run are in the repository

- **Found:** FL-13 · **Severity:** Low · **Status:** Open
- **Choice:** tajmin decided on 2026-10-08 to keep the 33 screenshots in `docs/fl-13/` (about 13 MB) and the measurement run in `tests/final-check/` (records only, not part of `pnpm test:e2e`) in the repository for now.
- **Suggested solution:** Remove both from the repository in the next milestone. Keep the screenshots outside git (a release asset or shared drive) if they are still needed.
### IMP-31 `shadcn/tailwind.css` is not imported

- **Found:** R2-02 · **Severity:** Low · **Status:** Decided (tajmin, 11 October 2026): leave it out; add it in the ticket that adds the first shadcn primitive (likely R2-05). Report to the blueprint that the spec states the import without a condition
- **Choice:** `color-system.md` §5 says `app/globals.css` also imports `shadcn/tailwind.css`. `globals.css` has only Tailwind and the three token files (FL-02 removed it, because `AGENTS.md` §5 says "Nothing else"). R2-02 left it that way. The base-nova shadcn components need it for their `data-*` variants.
- **Suggested solution:** Ask tajmin. If shadcn components are used in run 2, add the import after `tailwindcss`. Otherwise keep it out and update the spec note.

### IMP-32 `components.css` is not imported

- **Found:** R2-02 · **Severity:** Low · **Status:** Decided (tajmin, 11 October 2026): import it in R2-04
- **Choice:** `src/styles/components.css` (from `component-system.md` §6) is not imported in `globals.css`. R2-02 did not touch it.
- **Suggested solution:** Import it in R2-04 (Small parts), where the component tokens are first needed.

### IMP-33 Newsletter code stays until R2-11

- **Found:** R2-03 · **Severity:** Low · **Status:** Open
- **Choice:** `src/content/` has no newsletter content (a test checks this, DR-239). The newsletter strings in `src/i18n/` and the code in `NewsletterSignup.tsx`, `GroupedCategories.tsx`, `SiteHeader.tsx`, `Drawer.tsx` and `src/lib/email.ts` are outside the R2-03 files, and removing them now would break the build.
- **Suggested solution:** Remove them in R2-11 (the sprint says do not build NewsletterSignup) and in R2-05 for the header and Drawer.

### IMP-34 Mock ad creatives

- **Found:** R2-03 · **Severity:** Low · **Status:** Open
- **Choice:** `public/mock/ad-<width>x<height>.svg` for 320x100, 336x280, 300x250, 300x600, 728x90 and 970x250. Gray fill and a border, no text, no advertiser mark. `src/content/ads.ts` has one fictional booking per slot (`getAd(slot, lang)`) with the sizes of §9. The 320x50, 970x90 and 300x250-for-band-under-336 variants have no separate file: 300x250 serves both.
- **Suggested solution:** Replace with the advertiser images in Phase 1 (§9.2).

### IMP-35 The Eyebrow is a link to a page that does not exist

- **Found:** R2-04 · **Severity:** Low · **Status:** Open
- **Choice:** C-08 says the Eyebrow is a link to the category page. `categoryHref(lang, category)` in `src/components/story/links.ts` gives `/category/<id>` (`/en/category/<id>`), which is a 404 page until category pages exist, like the story links (IMP-18). Run 1 showed plain text for this reason. The hero and the analysis column now have 3 and 4 more links; the two keyboard tests count them.
- **Suggested solution:** Keep. The category pages come with their layout pass (agent contract §3).

### IMP-36 Bangla Breaking label

- **Found:** R2-04 · **Severity:** Low · **Status:** Open (flag: needs tajmin's yes)
- **Choice:** `src/i18n/bn.ts` has "সদ্যপ্রাপ্ত" (FL-06, U-14). The C-11 sheet says the working label is ব্রেকিং (CNT-11). The string is unchanged: this ticket is about look, not wording. The chip now follows the sheet (square, `px-2 py-0.5`, `type-eyebrow`, `bg-live`, `text-on-live`).
- **Suggested solution:** Change the string to ব্রেকিং if the sheet is the decision, with the tests that name the old word.

### IMP-37 Item divider is a class

- **Found:** R2-04 · **Severity:** Low · **Status:** Open
- **Choice:** C-22 says lists keep ul/li semantics and no hr sits between items. `dividerItem` (in `Divider.tsx`) is a class for the `li`: 1px `border` rule, `space-list-item` on each side, none above the first row. It is the old `listItem` class, which the P-4 files still use; the later tickets switch to `dividerItem`. `Divider` the component is the section variant only. The column variant is postponed (DR-104). The sheet status is Draft.
- **Suggested solution:** Confirm when the sheet leaves Draft.

### IMP-38 Red e2e tests on the branch, and the focus check

- **Found:** R2-04 · **Severity:** Medium · **Status:** Open
- **State:** Before R2-04, 106 Playwright tests (chromium) failed on `prototype-run-2`: the ad rows at 11 widths in both languages (22; R2-06), `grouped` (28; R2-11), `most-read` (28; R2-12) and `header` (28; R2-05). The cause is the tokens that R2-02 removed (`--ad-*` sizes, `--space-eyebrow-title` and others). R2-04 adds no failure and fixes none. `pnpm test:e2e` is green again only after those tickets.
- **Focus check:** The headline links and text links in `links.ts` lost their `ring-*` classes (COL-13 says the base outline only, and `ring-*` compiles to a shadow). The `hero` and `analysis-opinion` keyboard tests now check for the 2px solid outline. The `featured`, `grouped`, `footer`, `regions` and `most-read` keyboard tests accept the outline or the old ring, because the header classes, the footer, the poll and the newsletter form still use the old ring until R2-05, R2-11 and R2-14.
- **Suggested solution:** Tighten those five tests to the outline only when the last old ring is gone (`grep focusRing src`).

### IMP-39 Drawer and SearchDialog stay on the native `<dialog>`

- **Found:** R2-05 · **Severity:** Medium · **Status:** Open (flag: needs tajmin's decision)
- **Choice:** C-19 says "shadcn Sheet, side left, restyled", C-20 "shadcn Dialog", C-12 "shadcn Switch", C-19 "shadcn Collapsible", and CPT-16 says to restyle a shadcn component when you add it. R2-05 keeps the native `<dialog>` with `showModal()` from run 1 (IMP-13), a native `role="switch"` button and an `aria-expanded` button with a `hidden` list. All the behaviors in the sheets are there and tested: modal and inert page, focus to the panel, Escape, backdrop press, focus return, 450ms slide, no slide with reduced motion, accordions closed on open.
- **Why:** The shadcn components in this project are Base UI (`base-nova`) and need `shadcn/tailwind.css` and `tw-animate-css` (IMP-31), and a new dependency (`AGENTS.md` §10). The result for the reader is the same.
- **Suggested solution:** Keep the native elements and tell the blueprint that the sheets may say "modal dialog" instead of the shadcn names; or say yes to the shadcn components and R2-05 gets a second round (adds `@base-ui/react` or the shadcn primitives, `pnpm dlx shadcn add sheet dialog switch collapsible`).

### IMP-40 Two-state theme

- **Found:** R2-05 · **Severity:** Medium · **Status:** Open
- **Choice:** §6 and DR-201: light is the first state on every device, the system setting is not used, and the control has two states. `src/lib/theme.ts` now has `light` and `dark`, and the inline script no longer reads `prefers-color-scheme`. A stored `system` (from run 1) or any other value reads as light. The `data-theme-choice` attribute is gone. ThemeButton (phones) and ThemeToggle (from 768) are `role="switch"`, `aria-checked` = dark, named "ডার্ক থিম" / "Dark theme".
- **Tests:** An e2e test cannot set the theme with `emulateMedia` any more. `tests/e2e/theme.ts` has `setTheme(page, theme)`, which writes `fl-theme` before the page loads; the eight spec files that used `emulateMedia` use it. The `visual-qa` agent also sets the theme by `data-theme` (KIT-01); it must press the switch.
- **Suggested solution:** Confirm. If readers on a dark system should get dark, DR-201 must change first.

### IMP-41 Nav labels

- **Found:** R2-05 · **Severity:** Medium · **Status:** Open (flag: needs tajmin's decision)
- **Choice:** C-18 lists the Bangla nav labels হোম, বাংলাদেশ, অঞ্চল, ভূরাজনীতি, বিশ্ব অর্থনীতি, নিরাপত্তা ও সংঘাত, প্রযুক্তি, ইতিহাস ও প্রেক্ষাপট, বিশ্লেষণ ও মতামত. The code has the working category labels from the string tables (U-01): ভূরাজনীতি ও কূটনীতি, অর্থনীতি ও বাণিজ্য, প্রযুক্তি ও কৌশলগত শক্তি. They are also the section headings on the page, so the nav uses the same words. The order is the C-18 order. The English row shows 8 of 9 items at 1280 ("Analysis and Opinion" is hidden because it does not fit; it is in the Drawer).
- **Suggested solution:** Either change the three category labels in `bn.ts` and `en.ts` to the C-18 words (the section headings follow; tests that name the old words change), or give the nav its own short labels. Needs the IA table (IA-06).

### IMP-42 Trending terms, Op-ed and anchors

- **Found:** R2-05 · **Severity:** Low · **Status:** Open
- **Choice:** The six trending terms are mock (`src/content/trending.ts`). C-20 calls them links that run a search; there is no results page (DR-01), so each is a text-link-styled button that puts the term in the field and shows the same "no results in this prototype" note. The Drawer sub-items under বিশ্লেষণ ও মতামত link to the P-4 heading ids (`#analysis-opinion-title`, `#analysis-title`, `#opinion-title`); অপ-এড has no section and leads to `/op-ed`, a 404 page (IMP-18).
- **Suggested solution:** Keep until the search and category pages exist.

### IMP-43 LinkedIn mark

- **Found:** R2-05 · **Severity:** Low · **Status:** Open
- **Choice:** C-19 and C-21 list five social links with LinkedIn last. Simple Icons removed LinkedIn after 13.21.0, so the mark comes from that release (CC0-1.0) and the rest from 16.34.0. `socialLinks.ts` has the five links; the Drawer shows all five. The Footer uses the same list now, so it shows five links too (its tests changed to 5; reviewer blocker).
- **Suggested solution:** Confirm the icon source if the brand mark must be the current one.

### IMP-44 Band at 768–1023

- **Found:** R2-06 · **Severity:** Low · **Status:** Open
- **Choice:** Section 9 allows 728×90 or 300×250 for `ad-band` at 768–1023 and reserves 250. Built with 728×90 (the size Section 9.2 asks advertisers for at 768), centered in the 250 box, so the row has about 80px of surface-alt above and below the creative. Reserve and label are as the spec says (LAY-10).
- **Suggested solution:** Serve the 300×250 at 768–1023 so the creative fills the reserve, or reserve 90 at that tier. Needs a spec decision.

### IMP-45 No booking, no top ad

- **Found:** R2-06 · **Severity:** Low · **Status:** Open
- **Choice:** C-16 and Section 9.1 say Phase 1 leaves `ad-top` out when no campaign is booked (DR-250). Every mock slot has a booking, and `getAd` throws for a slot with none, so `AdSlot` always renders. The reserved-height test also runs with the creative blocked, to show that an unfilled row does not shrink or shift the page.
- **Suggested solution:** Add a booking check (dates against today) to `src/content/` when the ad data is real; until then keep as is.

### IMP-46 Rail variant and red tests

- **Found:** R2-06 · **Severity:** Low · **Status:** Open
- **State:** `AdSlot variant="rail"` (300×600 from the mock, `hidden xl:grid`, 624px with the label) is covered by a unit test only, because the P-3 rail is rebuilt in R2-11 (DR-239). After R2-06, 28 chromium e2e tests are red from before: `most-read` (R2-12). The 22 ad-row tests and the `grouped` 320px inset test (now DR-207) are green. WebKit runs the header tests only (R2-01); its `grouped` tests were already red.
- **Suggested solution:** None. R2-11 and R2-12 turn them green.

### IMP-47 Hero wiring and the development test page

- **Found:** R2-07 · **Severity:** Medium · **Status:** Open
- **State:** `Hero` imports `LeadStory` and `OverlapCard` from `components/story/` and `LatestList` uses `StoryList`, so the page keeps building. The lead title is an h2 (C-01) next to the hidden section h2. Changed in `hero.test.tsx` (h2, `type-story-title`, token overlap) and `hero.spec.ts` (lead overlap 32 under 600 and 10% from 600; Latest in two columns, column-first, from 768 to 1023; no shared meta row; tab stops exclude the aria-hidden image links). The pair uses `items-start`, no subgrid. R2-08 checks the hero against its own rows.
- **Test page:** `src/app/[lang]/dev/story-units/page.tsx` answers 404 in production. The Playwright tests need it because the homepage uses only some of the units.
- **Suggested solution:** Keep the page until Storybook (DR-88) replaces it.

### IMP-48 `StoryCard` layout values and `OverlapCard` surface

- **Found:** R2-07 · **Severity:** Low · **Status:** Open (flag)
- **Problem:** C-24 lists `layout: stack | row` and says the section sets it at the page breakpoints. P-2 needs stack under 768 and row from 768 (feature story), and row under 1024 and stack from 1024 (rail image story). C-02 has no variants, but the text block must take the color of its section (page or surface-elevated).
- **Built as:** `layout="row-from-md"` and `layout="row-until-lg"` next to `stack` and `row`; `surface="background" | "elevated"` on `OverlapCard`.
- **Suggested solution:** Name the responsive layouts in C-24, or let the card react to its container (CPT-04).

---

## Kit issues (KIT-)

### KIT-01 `visual-qa` agent switches theme with `data-theme`

- **Found:** FL-02 · **Severity:** Medium · **Status:** Open
- **Problem:** `.claude/agents/visual-qa.md` tells the agent to set `data-theme="dark"` on `html`. The colors follow the `.dark` class (DOC-03), so this changes nothing, and a dark check can report a pass on a light page.
- **Suggested solution:** Change step 3 to "use the theme switch, or `page.emulateMedia({ colorScheme: 'dark' })` with the theme on System". Fix it together with DOC-03.

### KIT-02 `visual-qa` agent checks the homepage only

- **Found:** FL-02 · **Severity:** Low · **Status:** Open
- **Problem:** The agent's steps cover `/` and `/en`. Temporary pages (FL-02, FL-03) need the URL given in the prompt.
- **Suggested solution:** Add an optional "pages to check" input to the agent. Default to `/` and `/en`.

### KIT-03 Raw-value hook flags object keys named `dark:`

- **Found:** FL-02 · **Severity:** Low · **Status:** Workaround in code
- **Problem:** `check-raw-values.mjs` matches `\bdark:` anywhere, so a string-table key `dark: "Dark"` is reported as a `dark:` variant.
- **Workaround:** The keys are named `optionSystem`, `optionLight` and `optionDark`. FL-05: `ThemeToggle.tsx` has a `dark:` key in two maps (icon and name); the hook reports them and they are left as is.
- **Suggested solution:** Check only inside `className` strings, or skip `src/i18n/`.

### KIT-04 Playwright MCP output folder not ignored

- **Found:** FL-02 · **Severity:** Low · **Status:** Fixed
- **Fix:** `.gitignore` now has `.playwright-mcp/`.

### KIT-05 `globals.css` content: `AGENTS.md` and the spec disagree

- **Found:** R2-02 · **Severity:** Medium · **Status:** Fixed (tajmin, 11 October 2026): the §12.4 block is in `globals.css`; `AGENTS.md` §5 updated
- **Problem:** `AGENTS.md` §5 says `globals.css` "imports the three token files. Nothing else". `spacing-layout-system.md` §12.4 says to put the base rules (pointer cursor on enabled buttons, square line ends on `svg.lucide`, reduced motion, DR-227) in `app/globals.css`. The spec ranks higher (`AGENTS.md` §2). R2-02 added neither and flagged it.
- **Suggested solution:** Ask tajmin. Either add the §12.4 block to `globals.css` and change `AGENTS.md` §5 to "imports and the §12.4 base rules", or move the block into a CSS file and tell the blueprint. Reduced motion (DR-227) is missing until then.

---

## Change log

| Date | Ticket | Change |
| --- | --- | --- |
| 2026-10-07 | FL-02 | File created. FL-01 and FL-02 findings added |
| 2026-10-07 | FL-03 | DOC-08, DOC-09, U-06, IMP-08, IMP-09 added. DOC-06 workaround noted |
| 2026-10-07 | FL-04 | U-07, IMP-10, IMP-11, IMP-12 added. U-01 updated |
| 2026-10-07 | FL-05 | DOC-10 to DOC-12, U-08 to U-10, IMP-13 to IMP-17 added. KIT-03 updated |
| 2026-10-07 | FL-06 | DOC-13 to DOC-15, U-11 to U-14, IMP-18 to IMP-20 added. IMP-11 updated |
| 2026-10-07 | FL-07 | DOC-16, U-15 to U-17, IMP-21, IMP-22 added. IMP-18 and U-03 updated |
| 2026-10-07 | FL-08 | DOC-17, U-18 to U-20, IMP-23 added. IMP-14 updated (category anchors now have targets) |
| 2026-10-07 | FL-09 | DOC-18, U-21 to U-25, IMP-24 to IMP-26 added. IMP-14 updated (the four P-3 category anchors and `#newsletter` now have targets) |
| 2026-10-07 | FL-10 | DOC-19, U-26, U-27 added. DOC-04 has a workaround (the §7.1 block is in `typography.css`) |
| 2026-10-07 | FL-11 | DOC-20, DOC-21, U-28, U-29, IMP-27, IMP-28 added. IMP-14 updated (all anchors have targets) |
| 2026-10-07 | FL-12 | DOC-22, U-30, IMP-29 added |
| 2026-10-07 | FL-13 | DOC-23, DOC-24, IMP-30 added. Results table with the Section 13 and §9 checks in `docs/PROGRESS.md` |
| 2026-10-08 | FL-14 | FL-14 rejected; no deploy. Milestone 1 closed. IMP-03 and IMP-07 status updated. Report: `docs/milestone-1-report.md` |
| 2026-10-11 | R2-01 | IMP-30 done (`docs/fl-13/`, `tests/final-check/` removed). IMP-11 done (`?content=sparse` only when `NODE_ENV !== 'production'`). IMP-07 done (WebKit project in Playwright) |
| 2026-10-11 | R2-02 | No new finding. The three token files are now the spec blocks. The current specs address DOC-01 (`:lang(en)`), DOC-02 (no second Tailwind import), DOC-04 (`--type-rank-*` tokens), DOC-06 (`@utility` containers), DOC-08 (ad tokens in §12.2, `ads.css` deleted), DOC-11 (shadows removed) and DOC-12 (`--z-bar`, `--z-overlay`). Statuses are confirmed when the components use the new CSS (R2-04 and later). IMP-31, IMP-32 and KIT-05 added and decided (§12.4 block added to `globals.css`, `AGENTS.md` §5 updated; `components.css` import in R2-04; `shadcn/tailwind.css` with the first shadcn primitive) |
| 2026-10-11 | R2-03 | IMP-33 and IMP-34 added. Mock ads (`ads.ts`, `getAd`, six SVG creatives) and tests for the poll, the ads, story ids in both languages (also sparse) and no newsletter content. The poll and the long-headline, no-image and sparse cases from run 1 were already right and are unchanged |
| 2026-10-11 | R2-04 | DOC-25, DOC-26, IMP-35 to IMP-38 added. U-06 fixed. `components.css` imported (IMP-32 done). Divider, SectionHeading, MoreLink, Eyebrow, MetaLine, Chip, Button, IconButton built from their sheets. U-14, U-28 and U-29 stay open until the header, regions and analysis tickets: the chip and slider buttons now follow the sheets, but the Bangla Breaking word (IMP-36) and the region column heading are not decided |
| 2026-10-11 | R2-05 | DOC-27, DOC-28, U-31, U-32, IMP-39 to IMP-43 added. DOC-10 (logo centered: tested at 13 widths), U-04, U-09, U-10 and IMP-17 fixed by the sheets. TopBar, NavBar, Drawer, SearchDialog, ThemeButton, ThemeToggle, SearchForm rebuilt; no subscribe button (DR-188); two-state theme (DR-201) |
| 2026-10-11 | R2-06 | IMP-44 to IMP-46 added. DOC-08, DOC-09 and DOC-18 fixed by the current spec. `AdSlot` (variants top, band, inset, rail) replaces `AdRow` and `AdPlaceholder`: one `<picture>` per slot, reserved height from the `--ad-*` tokens, region named by the label; page order checked against 7.1; tests for the reserved height at 360, 1024 and 1280 with and without the creative |
| 2026-10-11 | R2-07 | DOC-30, U-33, IMP-47, IMP-48 added. U-11 (headline link color) fixed by the sheets: ink, ink-muted on hover, no pressed color. U-12 (lead panel inset and padding), U-13 (blank band under a no-image card in the hero pair) fixed by C-01 and C-02 (tokens, no subgrid). LeadStory, OverlapCard, StoryCard, StoryList, StoryListItem built from their sheets; tests at 360, 768, 1024 and 1280 in both languages with long-headline and no-image content |
