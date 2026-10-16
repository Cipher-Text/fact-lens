# Fact Lens Prototype Findings

Version 4.0 · 16 October 2026 · Run 4 (short fix run)

The list of issues and gaps found while the homepage prototype is built. Each ticket adds its new findings here and updates the status of the items it fixed (DR-333).

- Run 1 (FL-01 to FL-13) and run 2 (R2-00 to R2-21) found the items below. The run 2 review (12 to 16 October 2026) decided all of them (DR-262 to DR-344) and put the rules in the specs.
- Run 3 put the decisions in the code. Run 3 (R3-01 to R3-09) also found DOC-38 to DOC-43, U-39, U-40 and IMP-71 to IMP-83; the run 3 review and design change decided them (DR-345 to DR-351). Run 4 puts these in the code; the run 4 ticket for each item is in the Summary. Read the rule in the spec section, not the old text of a finding.
- Open items (status Later) keep their full text below. The full text of every other item is in git history (`docs/prototype-findings.md` at `0225398`).

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

Status values:

- Open: new, not decided yet.
- Workaround in code: open, the code uses a value or a pattern the spec does not give.
- Decided (DR-) ; code in R4-: the spec has the rule; the named run 4 ticket changes the code. The ticket sets it to Fixed in R4-.
- Fixed in R2-, R3- or R4-, Done: the code follows the rule.
- Resolved by spec, Closed, Obsolete: no code change is needed.
- Later: decided to wait for a later phase (IA label table, logo, backend, newsletter).

New findings in run 4 take the next free number: DOC-51, U-42, IMP-90, KIT-11 (IMP-77 is not used). Put them under "New findings (run 4)" in the entry format at the end of "New findings (run 3)".

## Summary

| ID | Found | Title | Severity | Status |
| --- | --- | --- | --- | --- |
| DOC-01 | FL-02 | English block inside a Bangla page keeps Bangla type | High | Resolved by spec: typography v2.5 (DR-203) uses `:root, :lang(en)`; in `typography.css` since R2-02 |
| DOC-02 | FL-02 | Color CSS block imports Tailwind a second time | Low | Resolved by spec: color v2.3 (DR-200), no Tailwind import in the block |
| DOC-03 | FL-02 | Theme selector: `.dark` class against `data-theme` | Medium | Resolved by spec: color v2.3 (DR-201), two states, no system theme; built in R2-05 |
| DOC-04 | FL-02 | `type-rank` role has no utility in §8.2 | Low | Resolved by spec: typography v2.6 (DR-217), `@utility rank-list` |
| DOC-05 | FL-02 | No base rule for page background and text color | Medium | Resolved by spec: color v2.5 (COL-16, DR-232) |
| DOC-06 | FL-02 | Container classes are not in a cascade layer | Low | Resolved by spec: layout v2.5 (DR-204), `@utility` containers |
| DOC-07 | FL-02 | COL-13 gives utilities, §2.8 gives values only | Low | Resolved by spec: color v2.5 (COL-13, DR-225), base-layer outline |
| DOC-08 | FL-03 | Ad heights and creative sizes have no tokens | Medium | Resolved by spec (§12.2, LAY-19); fixed in R2-02 and R2-06 (`ads.css` deleted) |
| DOC-09 | FL-03 | 336×280 phone creative is wider than a 320px screen | Medium | Resolved by spec (DR-206); fixed in R2-06 |
| DOC-10 | FL-05 | Logo "in the center at every width" does not hold at 320 and 360 | Medium | Resolved by spec (typography §7.1, DR-174: short "En" on phones); fixed in R2-05. Centering at 320 and 360 not re-measured |
| DOC-11 | FL-05 | `shadow` color has no Tailwind mapping, so COL-15 cannot be applied | Low | Obsolete: color v2.3 (COL-15, DR-202) has no shadows; the token is removed |
| DOC-12 | FL-05 | `--z-scrim` and `--z-drawer` are not needed with a native modal dialog | Low | Obsolete: layout v2.7 (DR-228) has one `--z-overlay`. The native `<dialog>` stays a flag (IMP-39) |
| DOC-13 | FL-06 | "Cut corner on top-story images" has no matching rule | Low | Resolved by spec: top stories are OverlapCards (DR-105, DR-109); built in R2-07 |
| DOC-14 | FL-06 | Headline links: `ink` or `interactive` | Low | Resolved by spec: color v2.3 (COL-05, COL-06, DR-199); built in R2-07 |
| DOC-15 | FL-06 | The 64px lead overlap has no token | Low | Resolved by spec: `--space-lead-overlap` (component-system §6); built in R2-07 |
| DOC-16 | FL-07 | LAY-12 section-to-ad space on a section with its own background | Low | Resolved by spec: layout v2.5 (DR-205) |
| DOC-17 | FL-08 | Typography 7.1 has no role for the lead of a category section | Low | Fixed in R2-10 |
| DOC-18 | FL-09 | 300×250 inset creative is wider than the 288px shell at 320 | Low | Resolved by spec (DR-207); fixed in R2-06 |
| DOC-19 | FL-10 | Rank numeral must be `aria-hidden`, but the §7.1 CSS draws it as generated content | Medium | Fixed in R3-06 |
| DOC-20 | FL-11 | No slider CSS in §12.3: column width, snap and focus-ring room | Medium | Fixed in R3-06 |
| DOC-21 | FL-11 | "4 regions in view" next to "no 4-up rows" (LAY-07), and no buttons at 600–1023 with 3 or 4 regions | Low | Resolved by spec (LAY-07 allows 4 panels from 1280, C-15); fixed in R2-13 |
| DOC-22 | FL-12 | Footer: 7.1 calls it an "ad container"; DR-59 and 7.4 list different links | Low | Resolved by spec: §7.1 row 15 "Full-width row"; five links in §7.4 and C-21 |
| DOC-23 | FL-13 | 1366×768 first screen: the 264px hero estimate leaves out the section space; no headline in view | Medium | Resolved by spec (accepted trade-off): §13 (DR-257) says the lead headline shows after scrolling; R2-17 measured 224px |
| DOC-24 | FL-13 | Headline roles have no `overflow-wrap`; one long compound word scrolls the page | Medium | Resolved by spec: typography v2.7 (TYP-25, DR-217), `overflow-wrap: break-word` on `body` |
| DOC-25 | R2-04 | The §6 CSS block of `component-system.md` leaves out the button and icon tokens that its table lists | Low | Closed (DR-292): no run 3 code change |
| DOC-26 | R2-04 | The Chip label sheet gives "15px 600", the `type-eyebrow` role is 14px 700 uppercase in English | Low | Fixed in R3-04 |
| DOC-27 | R2-05 | C-12 and C-17 give the switch corners and the top bar padding in px, §6 has no tokens, and §2.9 says no component has color tokens | Low | Fixed in R3-02 |
| DOC-28 | R2-05 | C-18: does the 48px row include the 1px bottom rule? And where does the Drawer row rule sit when a row has children? | Low | Fixed in R3-02 |
| DOC-29 | R2-06 | C-16 says the rail box is "rail width 304" and also `w-(--ad-rail-w)`, which is 300px | Low | Fixed in R3-07 |
| DOC-30 | R2-07 | C-01 and C-24 give values that §6 has no token for: the LeadStory panel start padding (0 narrow) and the P-2 feature split image column (share, min, max) | Low | Fixed in R3-04 |
| DOC-31 | R2-11 | C-26 poll: the layout table says "under 1024: full row", but the inset follows the container width, so 600–647 stays stacked; the legend cannot sit in the start column of the row layout; the row layout has no column split or token | Low | Fixed in R3-05 |
| DOC-32 | R2-12 | C-07 Most read: the sheet gives a 24px column gap and 20 / 24px row gaps; `spacing-layout-system.md` 3.1 gives 16px (phone, 600) and 20px (768) column gaps and says the row gap equals the column gap | Low | Fixed in R3-03 |
| DOC-33 | R2-14 | C-21 Footer: the band has the panel inset (32 / 40px sides) and the contents sit "in the shell" (gutter 16 / 24px); both together leave 224px of content at 320 | Low | Fixed in R3-03 |
| DOC-34 | R2-15 | C-17 and §12.3 give the top bar `h-(--bar-height)` (a fixed height); the C-17 checks and DR-81 say the bar can wrap to two lines at 200% text size | Low | Fixed in R3-02 |
| DOC-35 | R2-17 | Every ad region carries the same accessible label, so axe reports `landmark-unique` (moderate, no serious or critical). C-16 gives one label text; it does not say whether slots need a number or a name each. Suggested: name each slot (top, band 1..n, inset, rail) | Low | Fixed in R3-07 |
| DOC-36 | Audit 13 Oct | StoryCard: "body first in the markup" against LAY-14 on phones | Medium | Fixed in R3-01 |
| DOC-37 | Audit 13 Oct | Sheet values off the 4px scale | Low | Fixed in R3-02 |
| DOC-38 | R3-01 | `component-system.md` P-2 Accessibility says text comes before the image in the markup; C-24 (DR-267) says the image comes first | Low | Fixed in R4-04 |
| U-01 | FL-01 | English category labels | Medium | Later: IA label table (DR-342, DR-282) |
| U-02 | FL-01 | Card variants, radius, icons, motion | Medium | Resolved by spec: no radius or shadow (CPT-05, COL-15), Lucide icons, 450ms slide (DR-227), card variants in C-01, C-02, C-24 |
| U-03 | FL-01 | বিশ্লেষণ ও মতামত section background | Low | Fixed in R3-03 |
| U-04 | FL-02 | Theme switch and language switch look | Medium | Fixed in R2-05 (C-12, C-17) |
| U-05 | FL-02 | No minimum touch target size | Medium | Resolved by spec: IconButton and controls are 44px (`--icon-button-size`); no global target token |
| U-06 | FL-03 | Section heading rule thickness | Low | Fixed in R2-04 (C-13 and C-22 give it) |
| U-07 | FL-04 | Region list under অঞ্চল | Medium | Later: IA label table; 7 working regions (DR-342) |
| U-08 | FL-05 | Logo asset and its role | Medium | Later: logo SVG from the design owner; text stand-in stays (DR-304) |
| U-09 | FL-05 | Theme control in the bar: one cycling icon button | Medium | Fixed in R2-05 (ThemeButton, ThemeToggle) |
| U-10 | FL-05 | Drawer and search dialog look | Low | Fixed in R2-05 (C-19, C-20) |
| U-11 | FL-06 | Headline link color | Low | Fixed in R2-07 (sheets: `ink`, `ink-muted` on hover, no pressed color) |
| U-12 | FL-06 | Lead text panel inset and padding | Low | Fixed in R2-07 (C-01 tokens) |
| U-13 | FL-06 | Card without image beside a card with image | Medium | Fixed in R2-07 (C-01, C-02, no subgrid) and through U-33 (R2-08) |
| U-14 | FL-06 | Bangla Breaking label and label padding | Low | Fixed in R3-04 |
| U-15 | FL-07 | Analysis item layout (image-led list) | Low | Fixed in R2-09 |
| U-16 | FL-07 | Opinion chip padding and quote icon | Low | Fixed in R3-03 |
| U-17 | FL-07 | Padding inside the বিশ্লেষণ ও মতামত background | Low | Fixed in R2-09 |
| U-18 | FL-08 | P-2 lead: image and text split from 1280px | Low | Fixed in R2-10 |
| U-19 | FL-08 | P-2 rail at 600–1023px | Low | Fixed in R2-10 |
| U-20 | FL-08 | Story labels inside a category section | Low | Fixed in R2-10 |
| U-21 | FL-09 | Inside of a P-3 category block | Low | Fixed in R2-11 |
| U-22 | FL-09 | P-3 rail module look (newsletter, poll) | Low | Fixed in R2-11 |
| U-23 | FL-09 | Form text roles: field label, consent line, error and done messages | Low | Fixed in R2-11 (the poll has them in 7.1; the newsletter is gone) |
| U-24 | FL-09 | Poll question role and result bar look | Low | Closed (DR-305) |
| U-25 | FL-09 | Spacing inside forms has no tokens | Medium | Fixed in R2-11 for the poll (C-26 gives the values, LAY-21) |
| U-26 | FL-10 | Bangla name of the Most read section | Low | Resolved by spec: component-system §3.3 and C-07 name "সর্বাধিক পঠিত" |
| U-27 | FL-10 | Most read item content and row gap | Low | Fixed in R2-12 |
| U-28 | FL-11 | Region chip and region column heading look | Low | Fixed in R2-13 (C-15: outline chips; panel heading `type-story-title-sm`, no top rule) |
| U-29 | FL-11 | Slider button place, icon and disabled look | Low | Fixed in R2-13 (C-15: 44px IconButtons, disabled look, 450ms `--ease-slide`) |
| U-30 | FL-12 | Minimum footer look and social icons | Low | Fixed in R2-14 (C-21) |
| U-31 | R2-05 | Logo size and weight (serif 700, 20/22/24px) have no type role | Medium | Fixed in R4-04 (Footer logo type-logo-sm) |
| U-32 | R2-05 | ThemeButton moon "redrawn larger" has no asset | Low | Fixed in R3-02 |
| U-33 | R2-07 | No sheet draws a story with no image, but the mock set has them (hero top card, lead in the sparse case, many list stories). C-01, C-02 and C-24 say the image is required | Medium | Fixed in R3-04 |
| U-34 | R2-09 | P-4 analysis stories: the P-4 sheet says rules between stories wait on the item divider (DR-104), but C-03 says StoryList rules and the other lists draw them | Low | Fixed in R3-03 |
| U-35 | R2-09 | C-06 quote mark: the sheet gives sizes and color, no drawing | Low | Fixed in R4-00 (DR-301; comment removed) |
| U-36 | R2-13 | C-15 panel: "3:2 image, 3 stories". The sheet does not say if the image belongs to the first story. Built as an image story (StoryCard 3:2) plus two text stories = 3 stories | Low | Closed (DR-307): no run 3 code change |
| U-37 | R2-15 | At 200% text size nothing sets the P-4 compact rows to stack: no trigger exists (DR-81, A11Y-18). Most read stacks because the rem breakpoints move with the browser text size | Medium | Fixed in R3-04 |
| U-38 | Audit 13 Oct | No skip link | Medium | Fixed in R3-02 |
| IMP-01 | FL-02 | Remembered English choice redirects only at `/` | Medium | Fixed in R3-08 |
| IMP-02 | FL-02 | shadcn CSS imports left out of `globals.css` | Medium | Fixed in R3-02 |
| IMP-03 | FL-02 | Cookie redirect and CDN caching | Medium | Done in R2-18 |
| IMP-04 | FL-02 | Theme choice kept in local storage, not a cookie | Low | Closed (no action) |
| IMP-05 | FL-01 | shadcn `base-nova` preset | Medium | Resolved by spec: CPT-16 keeps base-nova. No shadcn primitive is installed |
| IMP-06 | FL-01 | `agentRules: false` in `next.config.ts` | Low | Closed (no action) |
| IMP-07 | FL-01 | Playwright runs Chromium only | Low | Done in R2-01 (WebKit project; 40 known WebKit failures, `docs/webkit-failures.md`) |
| IMP-08 | FL-03 | Which creative the ad placeholder shows | Low | Resolved by spec: `AdSlot` follows the §9 tiers. 768–1023 stays IMP-44 |
| IMP-09 | FL-03 | Extra layout part `WithRail` | Low | Fixed in R3-01 |
| IMP-10 | FL-04 | `readingMinutes` added to the `Story` type | Low | Fixed in R3-04 |
| IMP-11 | FL-04 | `getHomepage` applies the content rules and has a sparse variant | Low | Done in R2-01 (`?content=sparse` in development only) |
| IMP-12 | FL-04 | Category and region labels are interface strings | Low | Later: backend integration; labels stay in `src/i18n/` (DR-263) |
| IMP-13 | FL-05 | Drawer and search use native `<dialog>`, not shadcn | Medium | Fixed in R3-02 |
| IMP-14 | FL-05 | Nav, region and Subscribe links go to homepage anchors | Low | Later: backend integration; homepage anchors stay (run 2 review, no DR) |
| IMP-15 | FL-05 | Search field is `type="text"`, not `type="search"` | Low | Resolved by spec: `type="text"` with `enterKeyHint` (DR-246) |
| IMP-16 | FL-05 | Nav row hides the items that do not fit after hydration | Low | Resolved by spec: DR-255, no "More" item. The server HTML wraps before hydration (R2A-08, IMP-56) |
| IMP-17 | FL-05 | On phones the drawer focuses the search field first | Low | Fixed in R2-05 (focus goes to the panel, DR-249) |
| IMP-18 | FL-06 | Story and Latest links lead to 404 pages | Low | Later: section and story pages; URL patterns are set, 404s stay (run 2 review, no DR) |
| IMP-19 | FL-06 | Hero metadata shows the clock time only, 24-hour | Low | Fixed in R3-04 |
| IMP-20 | FL-06 | Hidden page heading and hero heading | Low | Fixed in R3-08 |
| IMP-21 | FL-07 | P-4 heading outline: hidden analysis heading, chip as the opinion heading | Low | Fixed in R2-09 (the sheets give h3 titles and a chip label) |
| IMP-22 | FL-07 | Shared `MoreLink` and elevated link classes | Low | Resolved by spec: `MoreLink` is sheet C-10; the elevated link classes are gone. The 404s stay IMP-18 |
| IMP-23 | FL-08 | P-2 has no "আরও দেখুন" link | Low | Fixed in R2-10 |
| IMP-24 | FL-09 | Ad-inset count is fixed in the markup; the phone 600px rule is checked by a test | Medium | Fixed in R3-07 |
| IMP-25 | FL-09 | Mock newsletter: own email check, 0.8s sending state, no email sent | Low | Later: newsletter phase (DR-343) |
| IMP-26 | FL-09 | Poll vote kept in local storage; percents by largest remainder | Low | Fixed in R3-05 |
| IMP-27 | FL-11 | Regions slider: tab mode follows the CSS, scripted 250ms scroll, hash selects a tab | Low | Decided by C-15 in R2-13: scrollbar hidden; scripted slide is 450ms with `--ease-slide`; see IMP-51 |
| IMP-28 | FL-11 | Shared `StoryStack` for P-3 and P-3b; `actions` slot on `SectionHeading` | Low | Obsolete: `StoryStack` deleted in R2-13. The `SectionHeading` `actions` slot stays; the sheet names it |
| IMP-29 | FL-12 | Footer links: 404 site pages, social links to network front pages | Low | Fixed in R3-08 |
| IMP-30 | FL-13 | Screenshots and measurement run in the repository; remove in the next milestone | Low | Done in R2-01 (`docs/fl-13/` and `tests/final-check/` removed) |
| IMP-31 | R2-02 | `globals.css` does not import `shadcn/tailwind.css`, but `color-system.md` §5 says it does | Low | Fixed in R3-02 |
| IMP-32 | R2-02 | `components.css` is not imported in `globals.css` | Low | Done in R2-04 |
| IMP-33 | R2-03 | Newsletter strings and components stay until R2-11, because R2-03 only touches `src/content/` | Low | Later: newsletter phase (DR-343) |
| IMP-34 | R2-03 | Mock ad creatives are plain gray SVG files with no text, one per size | Low | Closed (DR-310): no run 3 code change |
| IMP-35 | R2-04 | The Eyebrow is now a link to `/category/<id>`, which is a 404 page | Low | Later: covered by the URL patterns, 404 stays (DR-311) |
| IMP-36 | R2-04 | The Bangla Breaking label is "সদ্যপ্রাপ্ত"; the Chip sheet says the working label is ব্রেকিং | Low | Fixed in R3-04 |
| IMP-37 | R2-04 | Item divider is a class, not a component; the section divider is a component | Low | Fixed in R3-03 |
| IMP-38 | R2-04 | 106 e2e tests were red on the branch before R2-04; five keyboard tests accept the old ring or the base outline for now | Medium | Fixed in R3-00 (the three loose keyboard tests now require the base outline) |
| IMP-39 | R2-05 | Drawer and SearchDialog stay on the native `<dialog>`; the sheets name the shadcn Sheet, Dialog, Switch and Collapsible (CPT-16) | Medium | Fixed in R3-02 |
| IMP-40 | R2-05 | The theme has two states and does not follow the system; an old stored "system" reads as light; e2e tests set the theme in storage | Medium | Fixed in R3-02 |
| IMP-41 | R2-05 | The nav uses the working category labels; C-18 lists shorter ones | Medium | Later: IA label table; working labels stay (DR-282) |
| IMP-42 | R2-05 | Trending terms are mock buttons that run the mock search; Op-ed and the Analysis anchors | Low | Fixed in R3-02 |
| IMP-43 | R2-05 | LinkedIn mark from Simple Icons 13.21.0, the last release that has it; the Drawer lists 5 links, the Footer still 4 | Low | Fixed in R3-08 |
| IMP-44 | R2-06 | At 768–1023 the band shows the 728×90 creative inside the 250 reserve, so 160px of the band is empty | Low | Fixed in R3-07 |
| IMP-45 | R2-06 | `AdSlot` reads its mock booking itself and always renders; the Phase 1 rule "no booking, no `ad-top` row" (DR-250) has no code path yet | Low | Later: no-booking path with real ad data, M3 (DR-316) |
| IMP-46 | R2-06 | The `rail` variant is built and tested alone; it goes into the P-3 rail in R2-11. 28 chromium e2e tests stay red from before (`most-read`, R2-12) | Low | Done in R2-11 |
| IMP-47 | R2-07 | The story units are wired into the hero (needed to keep it building); two hero tests and the hero e2e layout checks were changed to the sheets. A development-only test page `/dev/story-units` carries the unit tests | Medium | Closed (DR-317): no run 3 code change |
| IMP-48 | R2-07 | `StoryCard` `layout` has four values (`stack`, `row`, `row-from-md`, `row-until-lg`) and `OverlapCard` has a `surface` prop, so a section can set the page-breakpoint switch and the P-4 background; the sheets say "the section sets it" but give no prop | Low | Fixed in R3-01 |
| IMP-49 | R2-09 | Mock content changed to the sheet counts: 3 analysis stories (1 feature, 2 compact) and 5 opinion pieces; the `listItem` class file is gone | Low | Done in R2-09 (mock counts follow the sheets) |
| IMP-50 | R2-11 | DailyPoll: native hidden radios with a drawn square marker, `aria-labelledby` on the fieldset instead of a `<legend>`, result rows filled with `accent-soft`, 50 : 50 row layout | Medium | Fixed in R3-05 |
| IMP-51 | R2-13 | RegionSlider moves by `scrollLeft` (450ms, `--ease-slide` read from the token) in a scroll-snap row, not by a `transform` (C-15, 7.4); native swipe works and the keyboard reaches every link | Medium | Fixed in R3-06 |
| IMP-52 | R2-13 | The \"See more\" link of P-3b goes to `/regions`, a 404 page until the regions page exists. The slider buttons show by CSS from the region count (no layout shift) | Low | Fixed in R3-06 |
| IMP-53 | R2-20 | Poll radio cannot be set in WebKit (native radio hidden, drawn marker); may be a test artifact | Medium | Open: real Safari check in R4-05 (DR-345) |
| IMP-54 | R2-20 | P-4 section gap measures -8 instead of 40 in WebKit, English, 1280 and wider | Medium | Fixed in R3-03 |
| IMP-55 | R2-20 | `RegionSlider` server markup has `role="tabpanel"` at every width before hydration | Low | Fixed in R3-06 |
| IMP-56 | R2-20 | `NavBar` reads the top bar height once, but the bar can wrap at large text sizes (DOC-34) | Low | Fixed in R3-02 |
| IMP-57 | R2-20 | Nav and Drawer links are plain `<a>` (full page load) with no comment, unlike `LanguageSwitch` | Low | Fixed in R3-01 (`LanguageSwitch` stays a plain `<a>`, R3-08) |
| IMP-58 | Audit 13 Oct | Installed packages that the spec forbids or that nothing uses | Medium | Fixed in R3-02 (DR-285) |
| IMP-59 | Audit 13 Oct | Tests that depend on the environment | Medium | Fixed in R3-00 (slider animation test and a fixed sleep no longer depend on machine speed) |
| IMP-60 | Audit 13 Oct | Next.js LCP warning on hero images | Low | Fixed in R3-04 |
| IMP-61 | Audit 13 Oct | Component and folder names differ from the approved list | Medium | Fixed in R3-01 |
| IMP-62 | Audit 13 Oct | Arbitrary variants that couple components | Medium | Fixed in R3-02 and R3-05 |
| IMP-63 | Audit 13 Oct | Bangla headings differ from the sheet words | Medium | NavBar and Drawer item অঞ্চলসমূহ fixed in R4-01; hero শীর্ষ খবর and অঞ্চলসমূহ in P-3b fixed in R4-04 |
| IMP-64 | Audit 13 Oct | Dead code, stale comments and unused tokens | Low | Fixed in R3-01 |
| IMP-65 | Audit 13 Oct | Production-only behavior is not tested | Low | Later: production smoke run in M2 (DR-345) |
| IMP-66 | Audit 13 Oct | Proxy matcher and language cookie | Medium | Fixed in R3-08 |
| IMP-67 | Audit 13 Oct | Storage fallbacks and missing tests | Medium | Fixed in R3-08 |
| IMP-68 | Audit 13 Oct | Drawer link leaves `tabindex="-1"` on its target | Low | Fixed in R3-02 |
| IMP-69 | Audit 13 Oct | Drawer links to Analysis and Opinion have no target | Medium | Fixed in R3-02 |
| IMP-70 | Audit 13 Oct | Footer year fixed at build time | Low | Fixed in R4-04 (year in Dhaka time) |
| IMP-71 | R3-01 | `PeerCard` (subgrid) is named in the spec as a helper part but nothing on the homepage uses it | Low | Closed: kept as built (DR-348) |
| KIT-01 | FL-02 | `visual-qa` agent switches theme with `data-theme` | Medium | Fixed: `visual-qa` step 3 uses the theme control or the `dark` class |
| KIT-02 | FL-02 | `visual-qa` agent checks the homepage only | Low | Fixed: `visual-qa` takes the pages to check from the prompt and checks the drawer and the search dialog |
| KIT-03 | FL-02 | Raw-value hook flags object keys named `dark:` | Low | Fixed: the hook skips `src/i18n/` |
| KIT-04 | FL-02 | Playwright MCP output folder not ignored | Low | Fixed |
| KIT-05 | R2-02 | `AGENTS.md` §5 says `globals.css` holds only the imports; `spacing-layout-system.md` §12.4 puts base rules there | Medium | Fixed |
| KIT-06 | Audit 13 Oct | No skill tells the agent to update the findings file | Medium | Fixed (kit patch applied 16 Oct, DR-333) |
| KIT-07 | Audit 13 Oct | Commit message rules are not written in the repository | Medium | Done: `AGENTS.md` §9.7 (DR-334) |
| KIT-08 | Audit 13 Oct | GitHub workflows and MCP servers | Low | Fixed (kit patch applied 16 Oct, DR-335) |
| KIT-09 | Audit 13 Oct | Hooks and local permissions | Low | Fixed (kit patch applied 16 Oct, DR-336) |
| KIT-10 | Audit 13 Oct | Definition of done names an e2e command that cannot pass | Medium | Fixed in R3-00 (`pnpm test:e2e:chromium`) |
| DOC-39 | R3-02 | Header sheets disagree on focus, on the search component and on the close button order | Low | Fixed in R4-04 |
| U-39 | R3-02 | No token for the theme control icon color (`interactive` in light, `ink` in dark) | Medium | Closed (DR-349: ThemeToggle and the theme icon token removed, icon ink); Fixed in R4-01 |
| U-40 | R3-03 | Divider.column (column-inset, column-full): tajmin sets where each version is used (DR-262) | Low | Fixed in R4-03 (DR-351) |
| IMP-80 | R3-05 | DailyPoll: the fieldset is `display: contents` so its legend sits in the grid | Low | Closed: kept as built (DR-348); Safari check in R4-05 |
| DOC-40 | R3-05 | C-26 `DailyPoll.vote`: "focus stays on the group" does not fit a button press | Low | Fixed in R4-04 |
| IMP-81 | R3-05 | DailyPoll keeps a hidden copy of the results to hold the cell height | Low | Closed: kept as built (DR-348) |
| DOC-41 | R3-06 | `region-row` block in §12.3 sets 2 columns at every width | Low | Resolved by spec (DR-348) |
| IMP-82 | R3-06 | Base UI Tabs.Panel cannot be used for the region panels | Low | Closed: kept as built (DR-348) |
| DOC-42 | R3-07 | §9 says "one ad-inset after every 2nd category row" but P-3 and C-16 place the inset between the two rows | Medium | Resolved by spec (DR-348) |
| IMP-83 | R3-09 | WebKit formats `bn-BD` numbers and dates in Latin digits, so Bangla pages fail to hydrate in Safari | High | Fixed in R3-09 |
| DOC-43 | R3-09 | TYP-17 names `bn-BD` but WebKit needs `bn-BD-u-nu-beng` for Bangla digits | Medium | Resolved by spec (DR-348) |
| IMP-72 | R3-02 | Base UI hides the page behind the panel with `aria-hidden`, not `inert` | Low | Resolved by spec (DR-348) |
| IMP-73 | R3-02 | ThemeToggle is a hand-built switch, not the shadcn Switch | Low | Closed (DR-349: ThemeToggle removed) |
| IMP-74 | R3-02 | Region links in the Drawer have no target for 3 of 7 regions | Medium | Later: editorial question, M2 (DR-348) |
| IMP-75 | R3-02 | The bar rule under 1280px follows the scroll position | Low | Resolved by spec (DR-348); fixed in R4-02 |
| IMP-76 | R3-02 | Removing `--scroll-offset` in the effect cleanup breaks a #hash scroll in development | Low | Closed: kept as built (DR-348); production check in R4-05 |
| IMP-78 | R3-04 | The story time script is a little over 1 KB | Low | Fixed in R4-04 (checked: 985 bytes on `/`, 938 on `/en` in the built HTML) |
| DOC-44 | R4-01 | C-17 gives the TopBar language link as 15px 600; typography §7 gives `type-ui-sm` 600 (14px on the En / English label) | Low | Open |
| DOC-45 | R4-02 | Typography §8 `type-logo` shrinks the stuck logo with font-size; C-17 says a transform | Low | Open (code follows C-17, tajmin's choice) |
| DOC-46 | R4-02 | C-18 intro says the NavBar "scrolls away with the page"; layout §6 says it hides "past the page top" | Low | Open |
| IMP-84 | R4-02 | Focus on a control in the stuck header scrolls the page to the top in Chromium | Medium | Open (flag) |
| IMP-85 | R4-02 | The pinned NavBar is a full-width page-color band; only its shell has the items and the rule (`UNRESOLVED_DESIGN_SYSTEM`) | Low | Open |
| IMP-86 | R4-02 | The theme storage-event test fails now and then under parallel load in Chromium | Low | Open |
| U-41 | R4-03 | Divider.item: no method and no values for "measured to the text ink" (DR-350); per-language ink tokens (`UNRESOLVED_DESIGN_SYSTEM`) | Medium | Open (tajmin approved the tokens, 17 Oct 2026) |
| DOC-47 | R4-03 | The R4-03 check "16px ±1 to the ink" cannot hold for every string: glyphs below the baseline and digit heights vary | Low | Open (test: median ±1, each ±3, tajmin's choice) |
| DOC-48 | R4-03 | Layout §7.2 P-1 row and LAY-18 say Latest has no "more" link; C-03 and C-10 give it one (DR-350) | Low | Open (code follows DR-350) |
| DOC-49 | R4-03 | P-4 column rule "12 + 1 + 12" and "16 + 1 + 16" is 25 and 33px, not the 24 and 32px gap; R4-03 check gives the chip space 24px from 600, §5.1 from 768 | Low | Open |
| DOC-50 | R4-03 | C-06 and the R4-03 sprint check give the OpinionList chip space as "20 / 24 / 24" and "24 from 600"; the token changes at 768 | Low | Open (code uses the token) |
| IMP-87 | R4-03 | The Latest list two columns shared grid rows, so a short item got the height of the item beside it (41px to the rule at 768) | Medium | Fixed in R4-03 (flag F-3: CSS columns, tajmin confirms) |
| IMP-88 | R4-03 | WebKit starts the second Latest column 1 to 3px low (W4-07, W4-08) | Low | Open (Safari check in R4-05) |
| IMP-89 | R4-03 | In dark, the border color on `surface-elevated` (P-4) makes the item and column rules very faint | Low | Open |
| IMP-79 | R3-04 | A failed image shows the placeholder only after hydration | Low | Closed: kept as built (DR-348) |

## Open items (Later)

These items wait for a later phase. Run 3 does not change them, except where a ticket names them.

### U-01 English category labels

- **Found:** FL-01 · **Severity:** Medium · **Status:** Later: IA label table (DR-342, DR-282)
- **Gap:** The specs name the categories in Bangla only (`IA-06`).
- **Treatment used:** The working labels from the `mock-content` skill, in `src/i18n/en.ts` under `categories` (FL-04). The region labels under `regions` are working labels too (see U-07).
- **Suggested solution:** The editorial team approves an English label list. Add it to the decision register.

---

### U-07 Region list under অঞ্চল

- **Found:** FL-04 · **Severity:** Medium · **Status:** Later: IA label table; 7 working regions (DR-342)
- **Gap:** `DR-19` puts চীন under অঞ্চল, and the `mock-content` skill asks for 6 or more regions, but no spec or decision lists the regions or their order.
- **Treatment used:** Seven working regions in `src/content/homepage.ts` and `src/i18n/bn.ts` / `en.ts`: চীন, ভারত, মিয়ানমার, মধ্যপ্রাচ্য, দক্ষিণ-পূর্ব এশিয়া, ইউরোপ, আফ্রিকা. আফ্রিকা has no stories, so it never shows (§7.3).
- **Suggested solution:** The editorial team approves the region list, the order and the English labels. Add them to the IA label table (`IA-06`).

---

### U-08 Logo asset and its role

- **Found:** FL-05 · **Severity:** Medium · **Status:** Later: logo SVG from the design owner; text stand-in stays (DR-304)
- **File:** `src/components/header/SiteHeader.tsx` (logo link)
- **Treatment used:** The site name as text, `type-section-title`, `text-brand` (COL-04), linking to the front page. The accessible name is "ফ্যাক্ট লেন্স, প্রথম পাতা" / "Fact Lens, front page".
- **Note:** `brand` on the dark background is 2.37:1. WCAG and `color-system.md` Section 3 exempt logos, so the e2e axe helper leaves out only that node of `color-contrast`. A text stand-in still reads as text, so in dark mode it is hard to read.
- **Suggested solution:** Supply the logo as SVG with a dark-theme version (or one color that works on both), and the size per tier. Remove the axe exception then.

---

### IMP-12 Category and region labels are interface strings

- **Found:** FL-04 · **Severity:** Low · **Status:** Later: backend integration; labels stay in `src/i18n/` (DR-263)
- **Choice:** Stories carry only `category` and `region` ids. The labels are in `src/i18n/bn.ts` and `en.ts` (`categories`, `regions`), because the nav row, drawer, section headings and region chips all show them (T-27).
- **Note:** A backend can later send labels with the content. Then the string tables keep only the fallback.

---

### IMP-14 Nav, region and Subscribe links go to homepage anchors

- **Found:** FL-05 · **Severity:** Low · **Status:** Later: backend integration; homepage anchors stay (run 2 review, no DR)
- **Choice:** Category and region pages do not exist (DR-01). Links go to `#category-<id>`, `#regions`, `#region-<id>` and `#newsletter`. FL-06 to FL-11 must give the sections these ids. A drawer link closes the drawer and moves the focus to its target when the target exists; otherwise focus returns to the menu button.
- **FL-08:** `#category-bangladesh` and `#category-geopolitics` now exist. The header test that used a stand-in target uses the real section. The other categories get ids in FL-09.
- **FL-09:** `#category-security`, `#category-history`, `#category-economy`, `#category-technology` and `#newsletter` now exist. Only `#regions` and `#region-<id>` (FL-11) are left.
- **FL-11:** `#regions` and every `#region-<id>` now exist. On phones a region link also selects its tab. Every anchor has a target.

---

### IMP-18 Story and Latest links lead to 404 pages

- **Found:** FL-06 · **Severity:** Low · **Status:** Later: section and story pages; URL patterns are set, 404s stay (run 2 review, no DR)
- **Choice:** Story headlines link to `/story/<slug>` (`/en/story/<slug>` in English) and the Latest "আরও দেখুন" link to `/latest`. These pages do not exist yet (AGENTS.md Section 1), so they show the 404 page. Real URLs keep the keyboard order and link semantics right.
- **Suggested solution:** Set the article URL pattern in the article layout pass.

---

### IMP-35 The Eyebrow is a link to a page that does not exist

- **Found:** R2-04 · **Severity:** Low · **Status:** Later: covered by the URL patterns, 404 stays (DR-311)
- **Choice:** C-08 says the Eyebrow is a link to the category page. `categoryHref(lang, category)` in `src/components/story/links.ts` gives `/category/<id>` (`/en/category/<id>`), which is a 404 page until category pages exist, like the story links (IMP-18). Run 1 showed plain text for this reason. The hero and the analysis column now have 3 and 4 more links; the two keyboard tests count them.
- **Suggested solution:** Keep. The category pages come with their layout pass (agent contract §3).

---

### IMP-41 Nav labels

- **Found:** R2-05 · **Severity:** Medium · **Status:** Later: IA label table; working labels stay (DR-282)
- **Choice:** C-18 lists the Bangla nav labels হোম, বাংলাদেশ, অঞ্চল, ভূরাজনীতি, বিশ্ব অর্থনীতি, নিরাপত্তা ও সংঘাত, প্রযুক্তি, ইতিহাস ও প্রেক্ষাপট, বিশ্লেষণ ও মতামত. The code has the working category labels from the string tables (U-01): ভূরাজনীতি ও কূটনীতি, অর্থনীতি ও বাণিজ্য, প্রযুক্তি ও কৌশলগত শক্তি. They are also the section headings on the page, so the nav uses the same words. The order is the C-18 order. The English row shows 8 of 9 items at 1280 ("Analysis and Opinion" is hidden because it does not fit; it is in the Drawer).
- **Suggested solution:** Either change the three category labels in `bn.ts` and `en.ts` to the C-18 words (the section headings follow; tests that name the old words change), or give the nav its own short labels. Needs the IA table (IA-06).

---

### IMP-45 No booking, no top ad

- **Found:** R2-06 · **Severity:** Low · **Status:** Later: no-booking path with real ad data, M3 (DR-316)
- **Choice:** C-16 and Section 9.1 say Phase 1 leaves `ad-top` out when no campaign is booked (DR-250). Every mock slot has a booking, and `getAd` throws for a slot with none, so `AdSlot` always renders. The reserved-height test also runs with the creative blocked, to show that an unfilled row does not shrink or shift the page.
- **Suggested solution:** Add a booking check (dates against today) to `src/content/` when the ad data is real; until then keep as is.

---

### IMP-25 Mock newsletter: own email check, 0.8s sending state, no email sent

- **Found:** FL-09 · **Severity:** Low · **Status:** Later: newsletter phase (DR-343)
- **Choice:** The form has `noValidate` and checks the address itself (`src/lib/email.ts`: one @, no spaces, a dot in the domain), so the error is in the page language, not the browser's (T-27). A valid address shows "sending" for 0.8s, then the done message replaces the form and takes the focus. Nothing is sent (DR-01); the done message says so. The privacy link goes to `/privacy` (`/en/privacy`), a 404 page until it exists (IMP-18).
- **Suggested solution:** Confirm the copy (heading "সকালের নিউজলেটার", text and consent line) with the editorial team, and the privacy page URL.

---

### IMP-33 Newsletter code stays until R2-11

- **Found:** R2-03 · **Severity:** Low · **Status:** Later: newsletter phase (DR-343)
- **Choice:** `src/content/` has no newsletter content (a test checks this, DR-239). The newsletter strings in `src/i18n/` and the code in `NewsletterSignup.tsx`, `GroupedCategories.tsx`, `SiteHeader.tsx`, `Drawer.tsx` and `src/lib/email.ts` are outside the R2-03 files, and removing them now would break the build.
- **Suggested solution:** Remove them in R2-11 (the sprint says do not build NewsletterSignup) and in R2-05 for the header and Drawer.

---

## New findings (run 3)

### DOC-38 P-2 Accessibility contradicts C-24 on markup order

- **Found:** R3-01, 16 Oct 2026 · **Severity:** Low · **Status:** Fixed in R4-04
- **Source:** `component-system.md` P-2 FeaturedCategorySection, Accessibility ("Text comes before the image in the markup at every width"); C-24 StoryCard, `StoryCard.body` and Accessibility (DR-267: the image comes before the text at every layout).
- **Problem:** the two sheets give opposite source orders for the same component (the P-2 feature story is a StoryCard).
- **Suggested solution:** change the P-2 line to "the image comes before the text in the markup at every width; grid areas move it". The code follows C-24.

### IMP-71 PeerCard has no user on the homepage

- **Found:** R3-01, 16 Oct 2026 · **Severity:** Low · **Status:** Closed: kept as built (DR-348)
- **Source:** `component-system.md` §3.1 helper parts (PeerCard); `src/components/layout/PeerRow.tsx`, `src/styles/layout.css` (`peer-card`).
- **Problem:** the hero pair no longer uses subgrid (DR-99), so only a unit test uses `PeerCard`. The spec still names it.
- **Suggested solution:** keep it until the spec drops the name or a section needs aligned peer rows (LAY-08).

### DOC-39 Header sheets disagree on focus, on the search component and on the close button order

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Low · **Status:** Fixed in R4-04
- **Source:** `spacing-layout-system.md` §6 Search ("focus goes to the panel itself, DR-249 … Focus moves to the field") and §11 checks ("search is the shadcn `Dialog`"); `component-system.md` C-20 (shadcn `Drawer`, focus to the panel, "one Tab reaches the field", close button in the top right corner).
- **Problem:** §6 gives two focus targets for the search panel in one paragraph, and the check list names the shadcn Dialog where C-20 names the Drawer from the top. With the close button first in the source, one Tab from the panel reaches the close button, not the field.
- **Suggested solution:** keep C-20 (Drawer, focus to the panel). Say in §6 that focus goes to the panel and one Tab reaches the field. Say in C-20 that the close button comes after the field in the source and sits in the corner by position. The code does this.

### U-39 No token for the theme control icon color

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Medium · **Status:** Closed (DR-349: ThemeToggle and the theme icon token removed, icon ink); Fixed in R4-01
- **Source:** `color-system.md` §2.9 (icon `interactive` in light, `ink` in dark; only `--color-bar` and `--color-theme-control` are component color tokens); `COL-03`; `component-system.md` C-12 ThemeToggle and ThemeButton.
- **Problem:** `--color-theme-control` is now the track color (`fill-neutral` / `interactive`). The icon color changes between themes, there is no token for it and `dark:` is not allowed. The code uses `text-interactive` in both themes. In dark the ThemeButton icon is `interactive`, not `ink` like the En text.
- **Suggested solution:** allow a third component color token `--color-theme-icon` (`interactive` in light, `ink` in dark), or approve `interactive` in both themes. tajmin decides.

### IMP-72 Base UI hides the page behind the panel with aria-hidden, not inert

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Low · **Status:** Resolved by spec (DR-348)
- **Source:** `spacing-layout-system.md` §6 ("the page behind it is `inert`"); `src/components/ui/sheet.tsx`, `drawer.tsx` (Base UI Dialog and Drawer).
- **Problem:** the shadcn base-nova primitives use Base UI. It sets `aria-hidden` on the page outside the panel, traps Tab with focus guards and locks the scroll on `<body>`. It does not set `inert`. The page is out of reach for keyboard and screen reader, and the backdrop covers pointer input.
- **Suggested solution:** accept `aria-hidden` plus the focus trap as "inert", and say so in §6.

### IMP-73 ThemeToggle is a hand-built switch, not the shadcn Switch

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Low · **Status:** Closed (DR-349: ThemeToggle removed)
- **Source:** `component-system.md` C-12 ThemeToggle ("shadcn Switch (CPT-16)"); `AGENTS.md` §5 (`components/ui/` lists Sheet, Drawer, Collapsible, Tabs, RadioGroup, not Switch).
- **Problem:** the sheet names the shadcn Switch, the ticket and the folder list do not. The R3-02 code keeps the `role="switch"` button with the sheet's sizes and tokens.
- **Suggested solution:** keep the button, or add the shadcn Switch in a later ticket and restyle it to the sheet. tajmin decides.

### IMP-74 Region links in the Drawer have no target for 3 of 7 regions

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Medium · **Status:** Later: editorial question, M2 (DR-348)
- **Source:** `component-system.md` C-19 Content (DR-331: every # target in the nav must exist); `src/components/header/navItems.ts`, `src/content/homepage.ts` (the slider shows 4 regions: China, India, Middle East, Africa).
- **Problem:** the Drawer lists 7 regions, so `#region-myanmar`, `#region-southeast-asia` and `#region-europe` have no panel on the homepage. All other # links (categories, `#regions`, `#analysis-opinion-title`) have a target and a test checks them.
- **R3-06:** the slider builds every region that has stories (6 of 7). `#region-africa` still has no target, because the mock keeps Africa without stories on purpose (mock-content skill, `spacing-layout-system.md` 7.3: a region with no stories does not show).
- **Suggested solution:** tajmin decides: give Africa two mock stories (7 panels), or drop `africa` from the Drawer list while it has no stories.

### IMP-75 The bar rule under 1280px follows the scroll position

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Low · **Status:** Resolved by spec (DR-348); fixed in R4-02
- **Source:** `component-system.md` C-17 Surface ("1px border rule at the bottom when the bar is stuck, … every width"); C-18 NavBar.rules; DR-287, DR-295.
- **Problem:** the NavBar sets `data-bar-stuck` when it scrolls away, but it is hidden under 1280px. Run 2 showed the bar rule at the page top under 1280px. The code now sets `data-bar-stuck` when the page has scrolled (scrollY above 0) while the NavBar is hidden, so the rule shows only when the bar is stuck, at every width.
- **Suggested solution:** say in C-17 that under 1280px the bar is stuck once the page scrolls.

### U-40 Where the column dividers go

- **Found:** R3-03, 16 Oct 2026 · **Severity:** Low · **Status:** Fixed in R4-03 (DR-351)
- **Source:** `component-system.md` C-22 ("tajmin sets where each column version is used"), `agent-contract.md` Section 9, DR-262.
- **Problem:** no sheet names a place for `column-inset` or `column-full`. The code draws no column rule. Item and section dividers are done.
- **Suggested solution:** tajmin names the sections and the version for each (for example P-4 between analysis and opinion). Then add a `variant` to `Divider`.

---

### IMP-76 Removing `--scroll-offset` in the effect cleanup breaks a #hash scroll in development

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Low · **Status:** Closed: kept as built (DR-348); production check in R4-05
- **Source:** `src/components/header/ScrollOffset.tsx`; test `regions.spec.ts` "a #region-<id> link selects the region on phones".
- **Problem:** with `removeProperty` in the cleanup, the page did not scroll to `#region-europe` on load (React Strict Mode runs the cleanup once in development). The cause is not found. The code leaves the property set on cleanup.
- **Suggested solution:** keep it as it is; the bar is on every page. Check a production build in R3-09.

### IMP-78 The story time script is a little over 1 KB

- **Found:** R3-04, 16 Oct 2026 · **Severity:** Low · **Status:** Fixed in R4-04 (checked: 985 bytes on `/`, 938 on `/en` in the built HTML)
- **Source:** `typography-system.md` TYP-17 (DR-274: "under 1 KB"); `src/lib/story-time.ts`.
- **Problem:** the inline script is about 1.1 to 1.4 KB in the development build (it holds the format function and its Intl calls). I did not measure the production build. The unit test allows 1.5 KB.
- **Suggested solution:** accept up to 1.5 KB, or drop the year rule from the script. tajmin decides.

### IMP-79 A failed image shows the placeholder only after hydration

- **Found:** R3-04, 16 Oct 2026 · **Severity:** Low · **Status:** Closed: kept as built (DR-348)
- **Source:** `component-system.md` C-24 (DR-338); `src/components/story/StoryImage.tsx`.
- **Problem:** a broken image switches to the placeholder in `onError`. Before hydration the browser shows the broken-image icon over the `bg-surface-alt` fill.
- **Suggested solution:** keep it. Mock images are local files that always load.

Entry format:

```markdown
### IMP-xx Short title

- **Found:** R4-0x, date · **Severity:** High | Medium | Low · **Status:** Open
- **Source:** spec section and rule IDs; file and line.
- **Problem:** what is wrong, with the measured or read value.
- **Suggested solution:** one proposal. tajmin decides.
```

### IMP-80 DailyPoll: the fieldset is `display: contents` so its legend sits in the grid

- **Found:** R3-05, 16 Oct 2026 · **Severity:** Low · **Status:** Closed: kept as built (DR-348); Safari check in R4-05
- **Source:** `component-system.md` C-26 (DR-273, DR-298); `DailyPoll.tsx`, `@utility poll-layout` in `components.css`.
- **Problem:** the sheet wants the question as the legend of a fieldset, and also in the start column next to the options (DOC-31). A legend of a normal fieldset cannot be a grid item. The fieldset has `display: contents`, so the legend and the options cell are items of the grid. The group name works in Chromium (tested). WebKit and Firefox are not tested yet.
- **Suggested solution:** keep it. Check the group name in WebKit in R3-09.

### DOC-40 C-26 `DailyPoll.vote`: "focus stays on the group" does not fit a button press

- **Found:** R3-05, 16 Oct 2026 · **Severity:** Low · **Status:** Fixed in R4-04
- **Source:** `component-system.md` C-26 `DailyPoll.vote` ("a press with no choice does nothing and focus stays on the group").
- **Problem:** the button has the focus when it is pressed, so focus cannot stay on the group. The code does nothing: no message, no focus move, so the focus stays on the button.
- **Suggested solution:** change the sheet to "does nothing and focus stays where it is", or say that focus returns to the first option.

### IMP-81 DailyPoll keeps a hidden copy of the results to hold the cell height

- **Found:** R3-05, 16 Oct 2026 · **Severity:** Low · **Status:** Closed: kept as built (DR-348)
- **Source:** `component-system.md` C-26 `DailyPoll.results` ("replaces the choose state in place"); `LAY-10`; `DailyPoll.tsx`.
- **Problem:** the results (4 rows of 64px, gaps and the total line) are taller than the choose state, so the vote would move the rail ad (66px at 1280). A hidden copy of the results (`inert`, `aria-hidden`, `invisible`) shares the grid cell before the vote and holds the height.
- **Spec difference:** C-26 names `@utility stack-cell` for the shared cell. The legend and the choose parts are inside the fieldset (`display: contents`) while the results are outside, so one wrapper cannot hold both. The code puts both in the grid area `cell` of `poll-layout`. The result is the same.
- **Suggested solution:** keep it, and let the sheet say "share one grid cell" without the utility name. tajmin decides.

### DOC-41 `region-row` block in `spacing-layout-system.md` §12.3 sets 2 columns at every width

- **Found:** R3-06, 16 Oct 2026 · **Severity:** Low · **Status:** Resolved by spec (DR-348)
- **Source:** `spacing-layout-system.md` §12.3 `@utility region-row` ("Copy this block"); `component-system.md` C-15.
- **Problem:** the block sets `grid-auto-columns` for 2 in view and `overflow-x: auto` with snap at all widths. Below 600px one panel shows, so it would be half the row wide.
- **What the code does:** it keeps its own `region-row` in `components.css` (`--region-in-view` 1 under 600, 2, 3, 4; scroll and snap from 600). Same result from 600px.
- **Suggested solution:** change the §12.3 block to the `--region-in-view` form.

### IMP-82 Base UI Tabs.Panel cannot be used for the region panels

- **Found:** R3-06, 16 Oct 2026 · **Severity:** Low · **Status:** Closed: kept as built (DR-348)
- **Source:** `component-system.md` C-15 (Chips: shadcn Tabs, CPT-16).
- **Problem:** the Base UI panel sets `hidden` and `inert` when not selected, but from 600px every panel is a live column of the slider. `ui/tabs.tsx` has `Tabs`, `TabsList` and `TabsTab` only; `RegionSlider` writes its own panels and sets `aria-controls` on the tabs.
- **Suggested solution:** keep it; say in the sheet that the panels are the slider columns.

### DOC-42 Ad-inset placement: "after every 2nd category row" or between the two rows

- **Found:** R3-07, 16 Oct 2026 · **Severity:** Medium · **Status:** Resolved by spec (DR-348)
- **Source:** `spacing-layout-system.md` §9 and §14 (DR-276) against §7.2 P-3 ("A, B, ad, C, D") and the `GroupedCategoriesSection.adInset` row of `component-system.md` ("between the two rows of blocks").
- **Problem:** with the 4 mock categories there are 2 rows of blocks. "After every 2nd row" puts the inset after row 2, next to the poll and Most read; §7.2 puts it between row 1 and row 2.
- **What the code does:** it keeps the inset between rows (matches §7.2 and the sheet). The server decides it (`insetBefore`): 3 or fewer, none after a row where no story has an image. No run-time height check.
- **Suggested solution:** say "between rows of blocks, after every row but the last, 3 or fewer", or say that a "row" in §9 means two rows of blocks. tajmin decides.

### IMP-83 WebKit formats `bn-BD` numbers and dates in Latin digits

- **Found:** R3-09, 16 Oct 2026 · **Severity:** High · **Status:** Fixed in R3-09
- **Source:** `typography-system.md` (TYP-17: Bangla pages use Bangla digits); `AGENTS.md` Section 7.
- **Problem:** the Playwright WebKit build returns `29%`, `1,234` and `2026` for the locale `bn-BD`. Node and Chromium return Bangla digits. The server HTML had `২৯%`, so React threw "Hydration failed" on every Bangla page (230 errors in one run) and rebuilt the tree on the client. Most of the first 143 WebKit failures were "element has no box" after this rebuild; 101 of them went away with the fix. It would also show Latin digits in Safari after the rebuild.
- **What the code does:** `format.ts` and `story-time.ts` use the locale `bn-BD-u-nu-beng`, which sets the digits in every engine.
- **Result:** WebKit failures fell from 143 to 42. Chromium unchanged (591 pass).

### DOC-43 TYP-17 names `bn-BD`; WebKit needs the numbering system set

- **Found:** R3-09, 16 Oct 2026 · **Severity:** Medium · **Status:** Resolved by spec (DR-348)
- **Source:** `typography-system.md` TYP-17 (locales `en-GB` and `bn-BD`); see IMP-83.
- **Problem:** plain `bn-BD` gives Latin digits in WebKit. The code uses `bn-BD-u-nu-beng`, a workaround no rule names.
- **Suggested solution:** TYP-17 names `bn-BD-u-nu-beng`. tajmin decides.

## New findings (run 4)

### DOC-44 Language link size: C-17 and typography §7 disagree

- **Found:** R4-01, 17 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` C-17 `TopBar.language` ("Text link, 15px 600"); `typography-system.md` Section 7 ("Top bar language link: `type-ui-sm` at weight 600"); `TYP-04`.
- **Problem:** the link carries `lang` of the other language (TYP-03), so `type-ui-sm` is 14px on the En / English label of a Bangla page and 15px only on বাংলা. C-17 says 15px at every place. The code follows typography §7 (`src/components/header/LanguageSwitch.tsx`), as it did in run 3.
- **Suggested solution:** C-17 says "type-ui-sm 600 (typography §7)", or typography names a fixed 15px role for the link. tajmin decides.

### DOC-45 Stuck logo: typography §8 changes the font size, C-17 uses a transform

- **Found:** R4-02, 17 Oct 2026 · **Severity:** Low · **Status:** Open (code follows C-17, tajmin's choice on 17 Oct 2026)
- **Source:** `typography-system.md` Section 8 `@utility type-logo` (`html[data-bar-stuck] & { font-size: 1.5rem; }` from 768) and Section 3 role table; `component-system.md` C-17 `TopBar.logo` ("the logo scales down with a transform (zoom out), 450ms ease-slide"); DR-295, DR-349.
- **Problem:** the two level-1 specs give two ways to draw the 24px stuck logo. Both together shrink it twice (32 to 24 to 18px). A font-size change cannot run as the C-17 transform.
- **What the code does:** `src/styles/typography.css` drops the stuck font-size rule (a comment points here). The `logo-scale` utility in `components.css` scales the logo with `transform: scale(var(--logo-stuck-scale))`: 24/32 from 1024, 24/28 at 768 to 1023, 1 on phones.
- **Suggested solution:** remove the stuck rule from typography §8 and say in the role table "24px when stuck: a transform, C-17".

### DOC-46 NavBar: "scrolls away" and "past the page top"

- **Found:** R4-02, 17 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` C-18 intro ("Scrolls away with the page"); C-18 `NavBar.rules`, C-17 Surface, LAY-15 ("past the nav row"); `spacing-layout-system.md` Section 6 table ("past the page top it slides up") and §15 changelog line for DR-349.
- **Problem:** the C-18 intro is the old rule; the sheet and LAY-15 now make the NavBar sticky. Section 6 says "past the page top" in one place and "past the nav row" in another. The R4-02 check (46px) follows "past the nav row".
- **What the code does:** the NavBar is sticky with the TopBar. `data-bar-stuck` is set once `scrollY` is the row height (45px) or more, and removed only at `scrollY` 0.
- **Suggested solution:** C-18 intro: "Sticky with the TopBar; hides past its row." Section 6 table: "past the nav row".

### IMP-84 Focus in the stuck header scrolls the page to the top (Chromium)

- **Found:** R4-02, 17 Oct 2026 · **Severity:** Medium · **Status:** Open (flag to tajmin)
- **Source:** `spacing-layout-system.md` §6 and §12.3 (`scroll-padding-top: var(--scroll-offset)` on `html`); `src/components/header/ScrollOffset.tsx`; LAY-15.
- **Problem:** when the bar is stuck and focus moves into it (Shift+Tab back from the page, or `focus()`), Chromium scrolls the focused control out of the `scroll-padding-top` area. The control is sticky, so the page scrolls all the way to the top. From 1280 the NavBar then shows again. The run 3 code does the same (checked on `0bebd07` with a script), so R4-02 did not cause it. The R4-02 test focuses the theme button with `preventScroll` to check the tab order without this jump.
- **Suggested solution:** a rule that the header controls are not scrolled to, for example `scroll-margin-top: calc(-1 * var(--scroll-offset))` on the focusable elements of the site header. This is a workaround that no rule names, so tajmin decides. Check Safari in R4-05.

### IMP-85 The pinned NavBar is a full-width band

- **Found:** R4-02, 17 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` C-18 Surface ("Shell width, page color, 1px border rule at the bottom"); DR-349.
- **Problem:** the NavBar is now pinned under the TopBar for the first 45px of scroll. A shell-width row lets the page show in the gutters beside it while the page scrolls under it.
- **What the code does:** SiteHeader stays a fragment (component-system §3). The `nav` (`data-nav-row`) is sticky by itself at `top: calc(var(--scroll-offset) - 1rem)` (the rendered bar height) on `--z-bar`. It is a full-width band in the page color; an inner shell (`data-nav-shell`) holds the items and the 1px rule, so the rule and the items stay at shell width. At rest it looks the same as before. Both parts share `--z-bar`, and the NavBar comes later in the source, so a transform alone would draw it over the TopBar. A `clip-path` moves with the transform and cuts off the part that has passed the bar bottom (`nav-row-slide` in `components.css`).
- **Suggested solution:** C-18 Surface says "band full width in the page color; items and rule in the shell".

### IMP-86 The theme storage-event test is flaky under load (Chromium)

- **Found:** R4-02, 17 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `tests/e2e/header.spec.ts` "a theme change in one tab applies in the other tab (storage event, DR-340)"; `src/components/header/useThemeChoice.ts`.
- **Problem:** in 3 of 4 full or near-full Chromium runs in R4-02 one language of this test failed: the second tab did not get `.dark`. It passed 30 of 30 alone and in a full header spec run. The test clicks in the first tab once that tab has hydrated, but it does not wait for the second tab to hydrate, so its storage listener may not be attached yet. The run 3 WebKit list has the same test. R4-02 does not change the theme code; the test runs at 1024, where the NavBar is hidden.
- **Suggested solution:** in the test, wait until the second tab has hydrated (for example its theme button responds) before the click. This is a test fix, not a loosening; tajmin decides whether it goes in R4-05.

### U-41 Divider.item: no method or values for "measured to the text ink"

- **Found:** R4-03, 17 Oct 2026 · **Severity:** Medium · **Status:** Open (`UNRESOLVED_DESIGN_SYSTEM`; tajmin approved the tokens on 17 Oct 2026, flag F-1)
- **Source:** `component-system.md` C-22 `Divider.item` ("16px space each side, measured to the text ink, not the line box", DR-350); `spacing-layout-system.md` §5.2 `space-list-item`; `LAY-01`, `CPT-07`; `src/styles/components.css` (`--ink-*` tokens, `divider-item`, `list-ink-*`).
- **Problem:** no spec gives how to trim the line box or by how much. Measured in Chromium (pixel scan): the line box gave 21 to 22px above and 15px below a rule in Bangla, 18 to 19px in English. CSS `text-box: trim-both cap alphabetic` gave 9 to 14px (Bangla vowel signs stand about 6px above the cap edge; descenders hang below the baseline); the `text` edge gave 18 to 21px. No CSS edge reaches 16px in both scripts.
- **What the code does:** component tokens per language, as a share of the role size, measured from the fonts: `--ink-title-sm-start` (bn 0.03, en 0.2 × `type-story-title-sm`), `--ink-title-sm-end` (bn 0.25, en 0.12), `--ink-metadata-end` (bn 0.33, en 0.18 × `type-metadata`). The list sets `--list-ink-start` for the top of its items; the item above a rule trims its meta line in place with a negative margin (`[data-meta-line]`), so in a card with the image at the end edge the taller of image and text sets the row. Most read (a row-first grid) uses `--list-ink-end`. Result: 92 of 99 rules 16 ±1px in Chromium, all 16 ±3px.
- **Suggested solution:** the blueprint adds the ink values (or an approved method) to typography §3 or component-system §6, per language and role.

### DOC-47 The "16px ±1 to the ink" check cannot hold for every string

- **Found:** R4-03, 17 Oct 2026 · **Severity:** Low · **Status:** Open (test uses median ±1, each rule ±3; tajmin's choice on 17 Oct 2026, flag F-2)
- **Source:** `docs/SPRINT.md` R4-03 check "Item rule space … `space-list-item` (16px) ±1px"; C-22 (DR-350).
- **Problem:** the ink of a line depends on its letters. A Bangla meta line with ্র or ু (প্রযুক্তি ও কৌশলগত শক্তি) hangs about 2px lower than one without; an English title line with g or y hangs 4px lower than one without; Bangla rank digits differ by up to 6px in height. A fixed token gives 16 ±1px for the usual line and 13 to 18px for the others.
- **What the code does:** `tests/e2e/small-parts.spec.ts` checks, at 360, 768 and 1280 in both languages, that the median space of each list is 16 ±1px and every rule is 16 ±3px (`tests/e2e/rules.ts`).
- **Suggested solution:** the check says "per list, the median 16 ±1px; each rule 16 ±3px", or C-22 says the space is measured to the baseline and the cap or headline edge.

### DOC-48 Layout P-1 and LAY-18 say Latest has no "more" link

- **Found:** R4-03, 17 Oct 2026 · **Severity:** Low · **Status:** Open (code follows DR-350)
- **Source:** `spacing-layout-system.md` §7.2 P-1 row ("Latest, 5 items, no 'more' link (DR-102)") and LAY-18 ("Latest and Most read have no link"); `component-system.md` C-03 `HeroSection.latest MoreLink` and C-10 Content (DR-350, amends DR-102).
- **Problem:** the layout spec still has the DR-102 rule. The sheets and the R4-03 ticket give Latest one MoreLink to `/latest`.
- **Suggested solution:** P-1 row: "Latest, 5 items, one 'more' link to the Latest page (DR-350)"; LAY-18: "Most read has no link".

### DOC-49 P-4 column rule widths do not add up to the gap

- **Found:** R4-03, 17 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` P-4 "Column rule" ("centered in the existing --grid-column-gap (12 + 1 + 12 at 768 to 1279, 16 + 1 + 16 from 1280). No gap change", DR-351); `spacing-layout-system.md` §12.2 (`--grid-column-gap` 24px from 768, 32px from 1280).
- **Problem:** 12 + 1 + 12 is 25px and 16 + 1 + 16 is 33px; the gap is 24 and 32px and does not change.
- **What the code does:** the rule is 1px, centered in the 24 or 32px gap (11.5 + 1 + 11.5, 15.5 + 1 + 15.5). The test checks the center ±0.5px and that the gap is 24 or 32px.
- **Suggested solution:** "11.5 + 1 + 11.5 at 768 to 1279, 15.5 + 1 + 15.5 from 1280", or only "centered in the gap".

### DOC-50 OpinionList chip space: "24 from 600" against the token

- **Found:** R4-03, 17 Oct 2026 · **Severity:** Low · **Status:** Open (code uses the token)
- **Source:** `docs/SPRINT.md` R4-03 check ("chip to the first item is 20px under 600 and 24px from 600"); `component-system.md` C-06 ("space-section-title-after (20 / 24 / 24)"); `spacing-layout-system.md` §5.1 (values "phone / from 768px / from 1024px") and §12.2 (`--space-section-title-after: 1.5rem` from 48rem).
- **Problem:** the token is 20px up to 767px and 24px from 768. The sprint check says 24px from 600.
- **What the code does:** `mb-(--space-section-title-after)`: 20px at 360 and 600, 24px from 768. The test follows the token.
- **Suggested solution:** the sprint check says "20px under 768 and 24px from 768".

### IMP-87 The two Latest columns shared row heights

- **Found:** R4-03, 17 Oct 2026 · **Severity:** Medium · **Status:** Fixed in R4-03 (flag F-3: the design-reviewer calls CSS columns a layout choice no sheet names; tajmin confirms)
- **Source:** `component-system.md` C-03 (2 columns at 768 to 1023, column-first, rules within a column); C-22 (DR-350); `src/components/story/StoryList.tsx`.
- **Problem:** the two columns were one grid that flowed by column. Grid rows are shared, so an item took the height of the item beside it: 41px from the ink to the rule at 768 in Bangla.
- **What the code does:** CSS columns (`columns-2`) with a column break before the first item of the second column (items 1 to 3, then 4 and 5). Each column keeps its own heights. The e2e column-first checks are unchanged.

### IMP-88 WebKit starts the second Latest column 1 to 3px low

- **Found:** R4-03, 17 Oct 2026 · **Severity:** Low · **Status:** Open (Safari check in R4-05; W4-07, W4-08)
- **Source:** `docs/webkit-failures.md` W4-07, W4-08; `src/components/story/StoryList.tsx`.
- **Problem:** in WebKit, item 4 (the top of the second column) is 1 to 3px below item 1. The offset shows only when the column-start item has 0 padding and the other items have a fractional padding (16.43px). Chromium is exact.
- **Suggested solution:** check in real Safari in R4-05. If it shows, round the item padding to whole pixels or give both column starts the same top. tajmin decides.

### IMP-89 Dark rules on the P-4 panel are very faint

- **Found:** R4-03, 17 Oct 2026 (visual-qa) · **Severity:** Low · **Status:** Open
- **Source:** `color-system.md` `border` and `surface-elevated` (dark); C-22 (one color: border); P-4 (DR-264).
- **Problem:** in dark, the rule color rgb(58, 61, 68) on the panel rgb(48, 50, 57) is barely visible: the dotted item rules and the new column rule in বিশ্লেষণ ও মতামত. The rules are drawn as specified. Decorative rules have no contrast minimum, but the grouping is hard to see.
- **Suggested solution:** the blueprint checks the dark `border` value on `surface-elevated`. No code change in run 4.

## Change log

| Date | Ticket | Change |
| --- | --- | --- |
| 2026-10-07 to 2026-10-08 | FL-01 to FL-14 | Run 1: DOC-01 to DOC-24, U-01 to U-30, IMP-01 to IMP-30 and KIT-01 to KIT-04 added |
| 2026-10-11 | R2-00 to R2-20 | Run 2: DOC-25 to DOC-35, U-31 to U-37, IMP-31 to IMP-57 and KIT-05 added; many run 1 items fixed |
| 2026-10-13 | Audit | Statuses checked against specs and code; run 2 audit items moved in (DOC-36, DOC-37, U-38, IMP-58 to IMP-70, KIT-06 to KIT-10) |
| 2026-10-16 | Run 3 start | File shortened for run 3: every item has its run 2 review decision (DR-262 to DR-344) and its run 3 ticket; full text kept for the Later items only |
| 2026-10-16 | R3-01 | DOC-38 and IMP-71 added; DOC-36, IMP-09, IMP-48, IMP-57, IMP-61 and IMP-64 set to Fixed in R3-01 |
| 2026-10-16 | R3-02 | DOC-39, U-39 and IMP-72 to IMP-76 added; DOC-27, DOC-28, DOC-34, DOC-37, U-31, U-32, U-38, IMP-02, IMP-13, IMP-31, IMP-39, IMP-40, IMP-42, IMP-56, IMP-68 and IMP-69 set to Fixed in R3-02 |
| 2026-10-16 | R3-03 | U-40 added; DOC-32, DOC-33, U-03, U-16, U-34, IMP-37 and IMP-54 set to Fixed in R3-03 |
| 2026-10-16 | R3-04 | IMP-78 and IMP-79 added; DOC-26, DOC-30, U-14, U-33, U-37, IMP-10, IMP-19, IMP-36 and IMP-60 set to Fixed in R3-04 |
| 2026-10-16 | R3-05 | IMP-80, DOC-40 and IMP-81 added; DOC-31, IMP-26, IMP-50, IMP-53 and IMP-62 set to Fixed in R3-05 |
| 2026-10-16 | R3-06 | DOC-41 and IMP-82 added; DOC-19, DOC-20, IMP-51, IMP-52, IMP-55 and IMP-63 set to Fixed in R3-06; IMP-74 updated (only `#region-africa` has no target) |
| 2026-10-16 | R3-07 | DOC-42 added; DOC-29, DOC-35, IMP-24 and IMP-44 set to Fixed in R3-07 |
| 2026-10-16 | R3-09 | IMP-83 added and fixed; DOC-43 added |
| 2026-10-16 | R3-00 (added later) | IMP-38, IMP-59 and KIT-10 set to Fixed in R3-00 |
| 2026-10-16 | R3-08 (added later) | IMP-01, IMP-20, IMP-29, IMP-43, IMP-66, IMP-67 and IMP-70 set to Fixed in R3-08 |
| 2026-10-16 | R4-00 | Run 3 review and design change (DR-345 to DR-351): statuses and run 4 tickets set; Summary rows IMP-78 and IMP-79 added; next free IDs DOC-44, U-41, IMP-84, KIT-11; template heading has no real ID |
| 2026-10-17 | R4-01 | DOC-44 added; U-39 set to Fixed in R4-01; IMP-63 NavBar and Drawer part fixed in R4-01 |
| 2026-10-17 | R4-02 | DOC-45, DOC-46 and IMP-84 to IMP-86 added; IMP-75 code fixed in R4-02 |
| 2026-10-17 | R4-03 | U-41, DOC-47 to DOC-50 and IMP-87 to IMP-89 added; U-40 and IMP-87 set to Fixed in R4-03 |
| 2026-10-17 | R4-04 | No new findings; DOC-38, DOC-39, DOC-40, U-31, IMP-63, IMP-70 and IMP-78 set to Fixed in R4-04 (DOC-38 and DOC-39: the code already followed the decision; R4-04 adds the tests) |
