# Fact Lens Prototype Findings

Version 3.0 · 16 October 2026 · Run 3 (fix run)

The list of issues and gaps found while the homepage prototype is built. Each ticket adds its new findings here and updates the status of the items it fixed (DR-333).

- Run 1 (FL-01 to FL-13) and run 2 (R2-00 to R2-21) found the items below. The run 2 review (12 to 16 October 2026) decided all of them (DR-262 to DR-344) and put the rules in the specs.
- Run 3 puts the decisions in the code. The run 3 ticket for each item is in the Summary. Read the rule in the spec section, not the old text of a finding.
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
- Decided (DR-) ; code in R3-: the spec has the rule; the named run 3 ticket changes the code. The ticket sets it to Fixed in R3-.
- Fixed in R2- or R3-, Done: the code follows the rule.
- Resolved by spec, Closed, Obsolete: no code change is needed.
- Later: decided to wait for a later phase (IA label table, logo, backend, newsletter).

New findings in run 3 take the next free number: DOC-40, U-41, IMP-77, KIT-11. Use the entry format under "New findings (run 3)".

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
| DOC-38 | R3-01 | `component-system.md` P-2 Accessibility says text comes before the image in the markup; C-24 (DR-267) says the image comes first | Low | Open; code follows C-24 |
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
| U-24 | FL-09 | Poll question role and result bar look | Low | Decided (DR-305); code in R3-02, R3-05 |
| U-25 | FL-09 | Spacing inside forms has no tokens | Medium | Fixed in R2-11 for the poll (C-26 gives the values, LAY-21) |
| U-26 | FL-10 | Bangla name of the Most read section | Low | Resolved by spec: component-system §3.3 and C-07 name "সর্বাধিক পঠিত" |
| U-27 | FL-10 | Most read item content and row gap | Low | Fixed in R2-12 |
| U-28 | FL-11 | Region chip and region column heading look | Low | Fixed in R2-13 (C-15: outline chips; panel heading `type-story-title-sm`, no top rule) |
| U-29 | FL-11 | Slider button place, icon and disabled look | Low | Fixed in R2-13 (C-15: 44px IconButtons, disabled look, 450ms `--ease-slide`) |
| U-30 | FL-12 | Minimum footer look and social icons | Low | Fixed in R2-14 (C-21) |
| U-31 | R2-05 | Logo size and weight (serif 700, 20/22/24px) have no type role | Medium | Fixed in R3-02 |
| U-32 | R2-05 | ThemeButton moon "redrawn larger" has no asset | Low | Fixed in R3-02 |
| U-33 | R2-07 | No sheet draws a story with no image, but the mock set has them (hero top card, lead in the sparse case, many list stories). C-01, C-02 and C-24 say the image is required | Medium | Fixed in R3-04 |
| U-34 | R2-09 | P-4 analysis stories: the P-4 sheet says rules between stories wait on the item divider (DR-104), but C-03 says StoryList rules and the other lists draw them | Low | Fixed in R3-03 |
| U-35 | R2-09 | C-06 quote mark: the sheet gives sizes and color, no drawing | Low | Decided (DR-301); code in R3-02 |
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
| IMP-53 | R2-20 | Poll radio cannot be set in WebKit (native radio hidden, drawn marker); may be a test artifact | Medium | Fixed in R3-05 |
| IMP-54 | R2-20 | P-4 section gap measures -8 instead of 40 in WebKit, English, 1280 and wider | Medium | Fixed in R3-03 |
| IMP-55 | R2-20 | `RegionSlider` server markup has `role="tabpanel"` at every width before hydration | Low | Fixed in R3-06 |
| IMP-56 | R2-20 | `NavBar` reads the top bar height once, but the bar can wrap at large text sizes (DOC-34) | Low | Fixed in R3-02 |
| IMP-57 | R2-20 | Nav and Drawer links are plain `<a>` (full page load) with no comment, unlike `LanguageSwitch` | Low | Fixed in R3-01 (`LanguageSwitch` stays a plain `<a>`, R3-08) |
| IMP-58 | Audit 13 Oct | Installed packages that the spec forbids or that nothing uses | Medium | Decided (DR-285); `tw-animate-css` removed in R3-00, rest in R3-02 |
| IMP-59 | Audit 13 Oct | Tests that depend on the environment | Medium | Fixed in R3-00 (slider animation test and a fixed sleep no longer depend on machine speed) |
| IMP-60 | Audit 13 Oct | Next.js LCP warning on hero images | Low | Fixed in R3-04 |
| IMP-61 | Audit 13 Oct | Component and folder names differ from the approved list | Medium | Fixed in R3-01 |
| IMP-62 | Audit 13 Oct | Arbitrary variants that couple components | Medium | Fixed in R3-02 and R3-05 |
| IMP-63 | Audit 13 Oct | Bangla headings differ from the sheet words | Medium | Fixed in R3-06 |
| IMP-64 | Audit 13 Oct | Dead code, stale comments and unused tokens | Low | Fixed in R3-01 |
| IMP-65 | Audit 13 Oct | Production-only behavior is not tested | Low | Decided (DR-327); code in R3-09 |
| IMP-66 | Audit 13 Oct | Proxy matcher and language cookie | Medium | Fixed in R3-08 |
| IMP-67 | Audit 13 Oct | Storage fallbacks and missing tests | Medium | Fixed in R3-08 |
| IMP-68 | Audit 13 Oct | Drawer link leaves `tabindex="-1"` on its target | Low | Fixed in R3-02 |
| IMP-69 | Audit 13 Oct | Drawer links to Analysis and Opinion have no target | Medium | Fixed in R3-02 |
| IMP-70 | Audit 13 Oct | Footer year fixed at build time | Low | Fixed in R3-08 |
| IMP-71 | R3-01 | `PeerCard` (subgrid) is named in the spec as a helper part but nothing on the homepage uses it | Low | Open; kept |
| KIT-01 | FL-02 | `visual-qa` agent switches theme with `data-theme` | Medium | Fixed: `visual-qa` step 3 uses the theme control or the `dark` class |
| KIT-02 | FL-02 | `visual-qa` agent checks the homepage only | Low | Fixed: `visual-qa` takes the pages to check from the prompt and checks the drawer and the search dialog |
| KIT-03 | FL-02 | Raw-value hook flags object keys named `dark:` | Low | Fixed: the hook skips `src/i18n/` |
| KIT-04 | FL-02 | Playwright MCP output folder not ignored | Low | Fixed |
| KIT-05 | R2-02 | `AGENTS.md` §5 says `globals.css` holds only the imports; `spacing-layout-system.md` §12.4 puts base rules there | Medium | Fixed |
| KIT-06 | Audit 13 Oct | No skill tells the agent to update the findings file | Medium | Decided (DR-333); kit change: `/ticket` and `/accept` update this file |
| KIT-07 | Audit 13 Oct | Commit message rules are not written in the repository | Medium | Done: `AGENTS.md` §9.7 (DR-334) |
| KIT-08 | Audit 13 Oct | GitHub workflows and MCP servers | Low | Decided (DR-335); kit change: workflows and MCP pins |
| KIT-09 | Audit 13 Oct | Hooks and local permissions | Low | Decided (DR-336); kit change: hook regexes and local permissions |
| KIT-10 | Audit 13 Oct | Definition of done names an e2e command that cannot pass | Medium | Fixed in R3-00 (`pnpm test:e2e:chromium`) |
| DOC-39 | R3-02 | Header sheets disagree on focus, on the search component and on the close button order | Low | Open |
| U-39 | R3-02 | No token for the theme control icon color (`interactive` in light, `ink` in dark) | Medium | Workaround in code (`interactive` in both themes) |
| U-40 | R3-03 | Divider.column (column-inset, column-full): tajmin sets where each version is used (DR-262) | Low | Open: flag for tajmin |
| IMP-80 | R3-05 | DailyPoll: the fieldset is `display: contents` so its legend sits in the grid | Low | Open |
| DOC-40 | R3-05 | C-26 `DailyPoll.vote`: "focus stays on the group" does not fit a button press | Low | Open |
| IMP-81 | R3-05 | DailyPoll keeps a hidden copy of the results to hold the cell height | Low | Open |
| DOC-41 | R3-06 | `region-row` block in §12.3 sets 2 columns at every width | Low | Open |
| IMP-82 | R3-06 | Base UI Tabs.Panel cannot be used for the region panels | Low | Open |
| DOC-42 | R3-07 | §9 says "one ad-inset after every 2nd category row" but P-3 and C-16 place the inset between the two rows | Medium | Open |
| IMP-72 | R3-02 | Base UI hides the page behind the panel with `aria-hidden`, not `inert` | Low | Open |
| IMP-73 | R3-02 | ThemeToggle is a hand-built switch, not the shadcn Switch | Low | Open |
| IMP-74 | R3-02 | Region links in the Drawer have no target for 3 of 7 regions | Medium | Open; code in R3-06 |
| IMP-75 | R3-02 | The bar rule under 1280px follows the scroll position | Low | Open |
| IMP-76 | R3-02 | Removing `--scroll-offset` in the effect cleanup breaks a #hash scroll in development | Low | Workaround in code |

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

- **Found:** R3-01, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` P-2 FeaturedCategorySection, Accessibility ("Text comes before the image in the markup at every width"); C-24 StoryCard, `StoryCard.body` and Accessibility (DR-267: the image comes before the text at every layout).
- **Problem:** the two sheets give opposite source orders for the same component (the P-2 feature story is a StoryCard).
- **Suggested solution:** change the P-2 line to "the image comes before the text in the markup at every width; grid areas move it". The code follows C-24.

### IMP-71 PeerCard has no user on the homepage

- **Found:** R3-01, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` §3.1 helper parts (PeerCard); `src/components/layout/PeerRow.tsx`, `src/styles/layout.css` (`peer-card`).
- **Problem:** the hero pair no longer uses subgrid (DR-99), so only a unit test uses `PeerCard`. The spec still names it.
- **Suggested solution:** keep it until the spec drops the name or a section needs aligned peer rows (LAY-08).

### DOC-39 Header sheets disagree on focus, on the search component and on the close button order

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `spacing-layout-system.md` §6 Search ("focus goes to the panel itself, DR-249 … Focus moves to the field") and §11 checks ("search is the shadcn `Dialog`"); `component-system.md` C-20 (shadcn `Drawer`, focus to the panel, "one Tab reaches the field", close button in the top right corner).
- **Problem:** §6 gives two focus targets for the search panel in one paragraph, and the check list names the shadcn Dialog where C-20 names the Drawer from the top. With the close button first in the source, one Tab from the panel reaches the close button, not the field.
- **Suggested solution:** keep C-20 (Drawer, focus to the panel). Say in §6 that focus goes to the panel and one Tab reaches the field. Say in C-20 that the close button comes after the field in the source and sits in the corner by position. The code does this.

### U-39 No token for the theme control icon color

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Medium · **Status:** Open
- **Source:** `color-system.md` §2.9 (icon `interactive` in light, `ink` in dark; only `--color-bar` and `--color-theme-control` are component color tokens); `COL-03`; `component-system.md` C-12 ThemeToggle and ThemeButton.
- **Problem:** `--color-theme-control` is now the track color (`fill-neutral` / `interactive`). The icon color changes between themes, there is no token for it and `dark:` is not allowed. The code uses `text-interactive` in both themes. In dark the ThemeButton icon is `interactive`, not `ink` like the En text.
- **Suggested solution:** allow a third component color token `--color-theme-icon` (`interactive` in light, `ink` in dark), or approve `interactive` in both themes. tajmin decides.

### IMP-72 Base UI hides the page behind the panel with aria-hidden, not inert

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `spacing-layout-system.md` §6 ("the page behind it is `inert`"); `src/components/ui/sheet.tsx`, `drawer.tsx` (Base UI Dialog and Drawer).
- **Problem:** the shadcn base-nova primitives use Base UI. It sets `aria-hidden` on the page outside the panel, traps Tab with focus guards and locks the scroll on `<body>`. It does not set `inert`. The page is out of reach for keyboard and screen reader, and the backdrop covers pointer input.
- **Suggested solution:** accept `aria-hidden` plus the focus trap as "inert", and say so in §6.

### IMP-73 ThemeToggle is a hand-built switch, not the shadcn Switch

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` C-12 ThemeToggle ("shadcn Switch (CPT-16)"); `AGENTS.md` §5 (`components/ui/` lists Sheet, Drawer, Collapsible, Tabs, RadioGroup, not Switch).
- **Problem:** the sheet names the shadcn Switch, the ticket and the folder list do not. The R3-02 code keeps the `role="switch"` button with the sheet's sizes and tokens.
- **Suggested solution:** keep the button, or add the shadcn Switch in a later ticket and restyle it to the sheet. tajmin decides.

### IMP-74 Region links in the Drawer have no target for 3 of 7 regions

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Medium · **Status:** Open
- **Source:** `component-system.md` C-19 Content (DR-331: every # target in the nav must exist); `src/components/header/navItems.ts`, `src/content/homepage.ts` (the slider shows 4 regions: China, India, Middle East, Africa).
- **Problem:** the Drawer lists 7 regions, so `#region-myanmar`, `#region-southeast-asia` and `#region-europe` have no panel on the homepage. All other # links (categories, `#regions`, `#analysis-opinion-title`) have a target and a test checks them.
- **R3-06:** the slider builds every region that has stories (6 of 7). `#region-africa` still has no target, because the mock keeps Africa without stories on purpose (mock-content skill, `spacing-layout-system.md` 7.3: a region with no stories does not show).
- **Suggested solution:** tajmin decides: give Africa two mock stories (7 panels), or drop `africa` from the Drawer list while it has no stories.

### IMP-75 The bar rule under 1280px follows the scroll position

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` C-17 Surface ("1px border rule at the bottom when the bar is stuck, … every width"); C-18 NavBar.rules; DR-287, DR-295.
- **Problem:** the NavBar sets `data-bar-stuck` when it scrolls away, but it is hidden under 1280px. Run 2 showed the bar rule at the page top under 1280px. The code now sets `data-bar-stuck` when the page has scrolled (scrollY above 0) while the NavBar is hidden, so the rule shows only when the bar is stuck, at every width.
- **Suggested solution:** say in C-17 that under 1280px the bar is stuck once the page scrolls.

### U-40 Where the column dividers go

- **Found:** R3-03, 16 Oct 2026 · **Severity:** Low · **Status:** Open: flag for tajmin (`UNRESOLVED_DESIGN_SYSTEM`)
- **Source:** `component-system.md` C-22 ("tajmin sets where each column version is used"), `agent-contract.md` Section 9, DR-262.
- **Problem:** no sheet names a place for `column-inset` or `column-full`. The code draws no column rule. Item and section dividers are done.
- **Suggested solution:** tajmin names the sections and the version for each (for example P-4 between analysis and opinion). Then add a `variant` to `Divider`.

---

### IMP-76 Removing `--scroll-offset` in the effect cleanup breaks a #hash scroll in development

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `src/components/header/ScrollOffset.tsx`; test `regions.spec.ts` "a #region-<id> link selects the region on phones".
- **Problem:** with `removeProperty` in the cleanup, the page did not scroll to `#region-europe` on load (React Strict Mode runs the cleanup once in development). The cause is not found. The code leaves the property set on cleanup.
- **Suggested solution:** keep it as it is; the bar is on every page. Check a production build in R3-09.

### IMP-78 The story time script is a little over 1 KB

- **Found:** R3-04, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `typography-system.md` TYP-17 (DR-274: "under 1 KB"); `src/lib/story-time.ts`.
- **Problem:** the inline script is about 1.1 to 1.4 KB in the development build (it holds the format function and its Intl calls). I did not measure the production build. The unit test allows 1.5 KB.
- **Suggested solution:** accept up to 1.5 KB, or drop the year rule from the script. tajmin decides.

### IMP-79 A failed image shows the placeholder only after hydration

- **Found:** R3-04, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` C-24 (DR-338); `src/components/story/StoryImage.tsx`.
- **Problem:** a broken image switches to the placeholder in `onError`. Before hydration the browser shows the broken-image icon over the `bg-surface-alt` fill.
- **Suggested solution:** keep it. Mock images are local files that always load.

Entry format:

```markdown
### IMP-80 Short title

- **Found:** R3-0x, date · **Severity:** High | Medium | Low · **Status:** Open
- **Source:** spec section and rule IDs; file and line.
- **Problem:** what is wrong, with the measured or read value.
- **Suggested solution:** one proposal. tajmin decides.
```

### IMP-80 DailyPoll: the fieldset is `display: contents` so its legend sits in the grid

- **Found:** R3-05, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` C-26 (DR-273, DR-298); `DailyPoll.tsx`, `@utility poll-layout` in `components.css`.
- **Problem:** the sheet wants the question as the legend of a fieldset, and also in the start column next to the options (DOC-31). A legend of a normal fieldset cannot be a grid item. The fieldset has `display: contents`, so the legend and the options cell are items of the grid. The group name works in Chromium (tested). WebKit and Firefox are not tested yet.
- **Suggested solution:** keep it. Check the group name in WebKit in R3-09.

### DOC-40 C-26 `DailyPoll.vote`: "focus stays on the group" does not fit a button press

- **Found:** R3-05, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` C-26 `DailyPoll.vote` ("a press with no choice does nothing and focus stays on the group").
- **Problem:** the button has the focus when it is pressed, so focus cannot stay on the group. The code does nothing: no message, no focus move, so the focus stays on the button.
- **Suggested solution:** change the sheet to "does nothing and focus stays where it is", or say that focus returns to the first option.

### IMP-81 DailyPoll keeps a hidden copy of the results to hold the cell height

- **Found:** R3-05, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` C-26 `DailyPoll.results` ("replaces the choose state in place"); `LAY-10`; `DailyPoll.tsx`.
- **Problem:** the results (4 rows of 64px, gaps and the total line) are taller than the choose state, so the vote would move the rail ad (66px at 1280). A hidden copy of the results (`inert`, `aria-hidden`, `invisible`) shares the grid cell before the vote and holds the height.
- **Spec difference:** C-26 names `@utility stack-cell` for the shared cell. The legend and the choose parts are inside the fieldset (`display: contents`) while the results are outside, so one wrapper cannot hold both. The code puts both in the grid area `cell` of `poll-layout`. The result is the same.
- **Suggested solution:** keep it, and let the sheet say "share one grid cell" without the utility name. tajmin decides.

### DOC-41 `region-row` block in `spacing-layout-system.md` §12.3 sets 2 columns at every width

- **Found:** R3-06, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `spacing-layout-system.md` §12.3 `@utility region-row` ("Copy this block"); `component-system.md` C-15.
- **Problem:** the block sets `grid-auto-columns` for 2 in view and `overflow-x: auto` with snap at all widths. Below 600px one panel shows, so it would be half the row wide.
- **What the code does:** it keeps its own `region-row` in `components.css` (`--region-in-view` 1 under 600, 2, 3, 4; scroll and snap from 600). Same result from 600px.
- **Suggested solution:** change the §12.3 block to the `--region-in-view` form.

### IMP-82 Base UI Tabs.Panel cannot be used for the region panels

- **Found:** R3-06, 16 Oct 2026 · **Severity:** Low · **Status:** Open
- **Source:** `component-system.md` C-15 (Chips: shadcn Tabs, CPT-16).
- **Problem:** the Base UI panel sets `hidden` and `inert` when not selected, but from 600px every panel is a live column of the slider. `ui/tabs.tsx` has `Tabs`, `TabsList` and `TabsTab` only; `RegionSlider` writes its own panels and sets `aria-controls` on the tabs.
- **Suggested solution:** keep it; say in the sheet that the panels are the slider columns.

### DOC-42 Ad-inset placement: "after every 2nd category row" or between the two rows

- **Found:** R3-07, 16 Oct 2026 · **Severity:** Medium · **Status:** Open
- **Source:** `spacing-layout-system.md` §9 and §14 (DR-276) against §7.2 P-3 ("A, B, ad, C, D") and the `GroupedCategoriesSection.adInset` row of `component-system.md` ("between the two rows of blocks").
- **Problem:** with the 4 mock categories there are 2 rows of blocks. "After every 2nd row" puts the inset after row 2, next to the poll and Most read; §7.2 puts it between row 1 and row 2.
- **What the code does:** it keeps the inset between rows (matches §7.2 and the sheet). The server decides it (`insetBefore`): 3 or fewer, none after a row where no story has an image. No run-time height check.
- **Suggested solution:** say "between rows of blocks, after every row but the last, 3 or fewer", or say that a "row" in §9 means two rows of blocks. tajmin decides.

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
