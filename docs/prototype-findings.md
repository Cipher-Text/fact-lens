# Fact Lens Prototype Findings

The complete report of the issues and gaps found while the homepage prototype is built. Claude updates it at the end of each ticket (FL-01 to FL-14). Each finding has a suggested solution.

- Last updated: 7 October 2026, after FL-05 (accepted)
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
| DOC-03 | FL-02 | Theme selector: `.dark` class against `data-theme` | Medium | Workaround in code |
| DOC-04 | FL-02 | `type-rank` role has no utility in §8.2 | Low | Open |
| DOC-05 | FL-02 | No base rule for page background and text color | Medium | Workaround in code |
| DOC-06 | FL-02 | Container classes are not in a cascade layer | Low | Workaround in code |
| DOC-07 | FL-02 | COL-13 gives utilities, §2.8 gives values only | Low | Open |
| DOC-08 | FL-03 | Ad heights and creative sizes have no tokens | Medium | Workaround in code |
| DOC-09 | FL-03 | 336×280 phone creative is wider than a 320px screen | Medium | Workaround in code |
| DOC-10 | FL-05 | Logo "in the center at every width" does not hold at 320 and 360 | Medium | Open |
| DOC-11 | FL-05 | `shadow` color has no Tailwind mapping, so COL-15 cannot be applied | Low | Open |
| DOC-12 | FL-05 | `--z-scrim` and `--z-drawer` are not needed with a native modal dialog | Low | Open |
| U-01 | FL-01 | English category labels | Medium | Open |
| U-02 | FL-01 | Card variants, radius, icons, motion | Medium | Open |
| U-03 | FL-01 | বিশ্লেষণ ও মতামত section background | Low | Check in FL-07 |
| U-04 | FL-02 | Theme switch and language switch look | Medium | Open |
| U-05 | FL-02 | No minimum touch target size | Medium | Open |
| U-06 | FL-03 | Section heading rule thickness | Low | Open |
| U-07 | FL-04 | Region list under অঞ্চল | Medium | Open |
| U-08 | FL-05 | Logo asset and its role | Medium | Open |
| U-09 | FL-05 | Theme control in the bar: one cycling icon button | Medium | Open |
| U-10 | FL-05 | Drawer and search dialog look | Low | Open |
| IMP-01 | FL-02 | Remembered English choice redirects only at `/` | Medium | Needs confirmation |
| IMP-02 | FL-02 | shadcn CSS imports left out of `globals.css` | Medium | Needs decision before `shadcn add` |
| IMP-03 | FL-02 | Cookie redirect and CDN caching | Medium | Check in FL-14 |
| IMP-04 | FL-02 | Theme choice kept in local storage, not a cookie | Low | Closed (no action) |
| IMP-05 | FL-01 | shadcn `base-nova` preset | Medium | Needs decision before `shadcn add` |
| IMP-06 | FL-01 | `agentRules: false` in `next.config.ts` | Low | Closed (no action) |
| IMP-07 | FL-01 | Playwright runs Chromium only | Low | Decide in FL-13 |
| IMP-08 | FL-03 | Which creative the ad placeholder shows | Low | Needs confirmation |
| IMP-09 | FL-03 | Extra layout part `WithRail` | Low | Needs confirmation |
| IMP-10 | FL-04 | `readingMinutes` added to the `Story` type | Low | Needs confirmation |
| IMP-11 | FL-04 | `getHomepage` applies the content rules and has a sparse variant | Low | Needs confirmation |
| IMP-12 | FL-04 | Category and region labels are interface strings | Low | Needs confirmation |
| IMP-13 | FL-05 | Drawer and search use native `<dialog>`, not shadcn | Medium | Needs confirmation |
| IMP-14 | FL-05 | Nav, region and Subscribe links go to homepage anchors | Low | Needs confirmation |
| IMP-15 | FL-05 | Search field is `type="text"`, not `type="search"` | Low | Needs confirmation |
| IMP-16 | FL-05 | Nav row hides the items that do not fit after hydration | Low | Needs confirmation |
| IMP-17 | FL-05 | On phones the drawer focuses the search field first | Low | Needs confirmation |
| KIT-01 | FL-02 | `visual-qa` agent switches theme with `data-theme` | Medium | Open |
| KIT-02 | FL-02 | `visual-qa` agent checks the homepage only | Low | Open |
| KIT-03 | FL-02 | Raw-value hook flags object keys named `dark:` | Low | Workaround in code |
| KIT-04 | FL-02 | Playwright MCP output folder not ignored | Low | Fixed |

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

---

## Design-system gaps (U-)

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

- **Found:** FL-01 · **Severity:** Low · **Status:** Check in FL-07
- **Gap:** `DR-76` sets `surface-elevated`, which is pure white in light mode. It can look like a hole on the warm `background`.
- **Suggested solution:** Look at it in FL-07 in both themes. If it looks wrong, propose `surface` or `surface-alt` to the design owner.

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

- **Found:** FL-03 · **Severity:** Low · **Status:** Open
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

- **Found:** FL-02 · **Severity:** Medium · **Status:** Check in FL-14
- **Risk:** If a CDN caches the response for `/`, readers can get another reader's language.
- **Suggested solution:** In the FL-14 preview deploy, test `/` with and without the `fl-lang` cookie. If needed, send `Cache-Control: private, no-store` on the redirect.

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

- **Found:** FL-01 · **Severity:** Low · **Status:** Decide in FL-13
- **Suggested solution:** Add WebKit (Safari on iPhone) in FL-13. It matters most for Bangla text shaping and `text-wrap: balance`.

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

---

## Change log

| Date | Ticket | Change |
| --- | --- | --- |
| 2026-10-07 | FL-02 | File created. FL-01 and FL-02 findings added |
| 2026-10-07 | FL-03 | DOC-08, DOC-09, U-06, IMP-08, IMP-09 added. DOC-06 workaround noted |
| 2026-10-07 | FL-04 | U-07, IMP-10, IMP-11, IMP-12 added. U-01 updated |
| 2026-10-07 | FL-05 | DOC-10 to DOC-12, U-08 to U-10, IMP-13 to IMP-17 added. KIT-03 updated |
