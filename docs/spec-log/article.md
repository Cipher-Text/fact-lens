# Article page spec log

Branch `page/article-parallel` (wild card build) · Brief: none (free design, then moved onto the design system) · Specs at branch start: color 2.15, typography 2.16, layout 2.22, components 1.17.1, contract 2.12.1 · After checkpoint 1: color 2.16, typography 2.17, layout 2.23, components 1.18, contract 2.13

This log records how the article page code uses or changes the design system (DR-372). It does not edit `docs/design-system/`. The code is the reference: after tajmin marks the items, a project thread writes the Keep items into the specs and the decision register. Line numbers are for commit `c29f254`. `reader.css` is `src/styles/reader.css`.

## Kinds

| Kind | Use when |
| --- | --- |
| Reuse | An existing rule, token or component is used in a new place. Name it |
| New token | A tweak has no token step. Give the name, the value and the scale it joins (`CPT-07`) |
| New component | A part that no sheet in `component-system.md` §7 covers. Give the name per `N-01` to `N-05` |
| New rule | A behavior that no rule covers |
| Changed rule | The page needs an existing rule to change. Always a flag |

## Items

### Reuse

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| SL-01 | Reuse | Site header, footer, top and band ad rows, unchanged | `ReaderPage.tsx:52`, `:54`, `:184`, `:189` | C-18, `LAY-09` to `LAY-13` | build green |
| SL-02 | Reuse | Header section links point to `/#…` or `/en#…` on pages other than home, so every target exists | `navItems.ts:30` | DR-331 | fix 24 Oct green |
| SL-03 | Reuse | Read next: `Shell`, `SectionHeading`, `StoryCard` | `ArticleParts.tsx:240`, `:246`, `:250` | C-13, C-24, `LAY-07` | build green: layout §3.3 allows 3 from 1024px on other pages (`ArticleParts.tsx:247`) |
| SL-04 | Reuse | Heading text, body, key points, context and caption in the reading measure (`measure-reading-en` 44rem, `-bn` 42rem), centered | `reader.css:164`, `:470`, `:490` | `TYP-12`, `LAY-04` | tajmin 23 Oct green |
| SL-05 | Reuse | Type roles: eyebrow, deck, metadata, caption, ui, ui-sm, button, nav, article-h2, article-h3, article-body, section-title | throughout `reader.css` | `TYP-01`, `TYP-02` | build green |
| SL-06 | Reuse | Article text scales with `--reader-scale` (text size control, 4 steps) and never goes below `--type-body-min` | `reader.css:823`, `ReaderRoot.tsx:22` | `TYP-15`, `TYP-11` | build green |
| SL-07 | Reuse | Spacing tokens: `space-page-start`, `space-module`, `space-list-item`, `space-media-caption`, `space-section-title-after`, `space-section`, `grid-row-gap`, `grid-column-gap` | `reader.css:157`, `:280`, `:240`, `:457`, `:660`, `:851`, `:793`, `:507` | `LAY-01` | tajmin 23 to 24 Oct green |
| SL-08 | Reuse | Metadata line under the deck with the drawn square separator (4px, 10px each side, `--color-meta`) | `reader.css:243` to `:271` | `CPT-10`, `CPT-12` | tajmin 23 to 24 Oct green |
| SL-09 | Reuse | Byline avatar and Google prompt button use `--color-bar` (brand light, interactive dark) | `reader.css:317`, `:405` | `COL-04` | build green |
| SL-10 | Reuse | Motion: slides and fades use `--duration-slide` and `ease-slide`; color changes 200ms; reduced motion turns all of it off | `reader.css:185`, `:1337` | DR-357, layout §12.1 | commit 886e535 green |
| SL-11 | Reuse | Ad space belongs to the section, not the ad row (band ad, Read next) | `reader.css:851` to `:861` | `LAY-12` | tajmin 24 Oct green |

### New tokens

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| SL-12 | Changed rule | `--rd-panel-inset` 1.5rem at every width: the inset of panels in the reading column (Google prompt, key points, context). LAY-20's panel inset is sized for page bands | `reader.css:41` (`--rd-panel-inset`) | `LAY-20` | tajmin 24 Oct red: overrides LAY-20's panel inset, so a changed rule; token sits in reader.css, not components.css (CPT-07) |
| SL-13 | New token | Article heading gaps: eyebrow to title 12px, title to deck 12px, deck to lead image 2.5rem | `reader.css:44` to `:48` | `--space-lead-eyebrow-title`, `--space-story-title-summary` | tajmin 23 Oct green |
| SL-14 | New token | `--rd-lead-media-max` `min(32rem, 60svh)`: the lead image keeps its own ratio, is centered and never taller than this | `reader.css:49`, `:440` | `LAY-02` | build green |
| SL-15 | New token | Article title size 3rem (en) and 2.75rem (bn) at every width, in place of the fluid `type-article-title` | `reader.css:207`, `:216` | `TYP-01`, `TYP-18` | tajmin 23 Oct green |
| SL-16 | New token | Inline ad: `ad-inline` variant, 300×250 px in the reading column at every width; borrows the ad-inset mock creative | `reader.css:52`, `AdSlot.tsx:42` | `LAY-19`, `LAY-10` | tajmin 24 Oct green |
| SL-17 | New token | z-index steps above `--z-overlay` 50: dock 55, popover 70, selection bar 80, toast 90 (plus local 1 inside the contents marker and selection bar) | `reader.css:1051`, `:1097`, `:1235`, `:1289` | `--z-bar`, `--z-overlay` | build green |
| SL-18 | New token | Control sizes: icon button 40px (site token `--icon-button-size` is 2.75rem), progress, avatar, text-size and share icons 48px, icon glyphs 16 to 24px | `reader.css:112`, `:317`, `:972`, `:1131`, `:1189` | `--icon-button-size`, `--icon-size`, `LAY-21` | build green |
| SL-19 | New token | Raw px gaps, paddings and offsets (about 200: mostly 4, 8, 10, 12, 14, 16, 18px). Map each to the 4px scale or a component token; 10, 14 and 18px are off the scale | throughout `reader.css` | `LAY-21`, `CPT-07` | build green |
| SL-20 | New token | 200ms color transitions are typed raw; use `--default-transition-duration` | `reader.css:121` and 12 more | DR-357 | build green |
| SL-21 | New token | Hover and pressed washes by `color-mix`: icon button 8% ink, category 85% and 72% with ink, selection bar 16% background | `reader.css:125`, `:199`, `:202`, `:1275` | `COL-01` | build green |

### New components

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| SL-22 | New component | Article heading: kicker with the category as a brand button, title, deck, metadata line | `ReaderPage.tsx:58`, `reader.css:153` to `:271` | `N-01` to `N-05` | build green |
| SL-23 | New component | Byline: avatar initials, name, role, under the lead image with a rule above | `reader.css:277` to `:331` | `N-01` to `N-05` | tajmin 23 Oct green |
| SL-24 | New component | Lead image with caption and credit (caption bar before the text) | `reader.css:431` to `:480` | C-08 (StoryImage) | tajmin 23 Oct green |
| SL-25 | New component | KeyPoints: numbered summary panel, dotted rule between items | `ArticleParts.tsx:41`, `reader.css:650` | `LAY-20`, `CPT-06` | tajmin 23 Oct green |
| SL-26 | New component | ContextCard: shadcn Card with icon, title, teaser and labelled parts, no top bar | `ContextCard.tsx:18`, `reader.css:739` | `CPT-16` | tajmin 24 Oct green |
| SL-27 | New component | PreferredSourceAlert: shadcn Alert with the Google mark and an outline button | `ArticleParts.tsx:168`, `reader.css:382` | `CPT-16` | build green |
| SL-28 | New component | ArticleBody: paragraphs, h2 with SectionAnchor (copy link on hover), figures, square-bullet list, inline ad between paragraphs only | `ArticleParts.tsx:137`, `reader.css:823` to `:950` | `TYP-15`, `CPT-10` | tajmin 24 Oct green |
| SL-29 | New component | Tags: shadcn Badge links after a 1px rule | `ArticleParts.tsx:192`, `reader.css:953` | `CPT-16` | tajmin 24 Oct green |
| SL-30 | New component | Reading rail (from 1280): contents with a moving marker, progress, minutes left, text size, share, copy link, save | `Reading.tsx:85`, `:149`, `reader.css:499` to `:640` | `LAY-05` | tajmin 23 to 24 Oct green |
| SL-31 | New component | Reading dock (below 1280): the same tools in a bar at the bottom edge, shown after the reader starts | `ReaderPage.tsx:190`, `reader.css:1049` | `LAY-15` | tajmin 24 Oct green |
| SL-32 | New component | ProgressButton: square frame that fills clockwise, percent, back to top on hover | `Reading.tsx:25`, `:48`, `reader.css:972` to `:1047` | | build green |
| SL-33 | New component | Popover and TextSize: the three reader sizes (A, A+, A++) as a radio group | `Popover.tsx:17`, `Controls.tsx:15`, `:66`, `reader.css:1091` to `:1158` | `TYP-15` | build green |
| SL-34 | New component | ShareDialog: shadcn Dialog, network grid and copy field; CopyLinkButton; SaveButton | `Share.tsx:72`, `:98`, `Controls.tsx:117`, `components.css:340` | `CPT-16` | build green |
| SL-35 | New component | SelectionShare: a bar over selected text to share or copy the quote | `SelectionShare.tsx:18`, `reader.css:1233` | | build green |
| SL-36 | New component | Toaster: short confirmation messages (link copied, saved) | `Toaster.tsx:51`, `reader.css:1282` | | build green |

### New rules

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| SL-37 | New rule | Entrance motion: heading parts, lead image and byline rise 18px and fade in; popovers pop, selection bar fades | `reader.css:185`, `:1320` to `:1336` | DR-357 | build green |
| SL-38 | New rule | Text size change eases the body to its new size | `reader.css:1357` | `TYP-15` | build green |
| SL-39 | New rule | Lead image: editors upload landscape images of any ratio; never cropped or stretched | `reader.css:436` | `LAY-02` | build green |
| SL-40 | New rule | Inline ads only between paragraphs, never next to a heading, image, key points or context | `ArticleParts.tsx:120`, `reader.css:839` | `LAY-13` (does not cover it) | tajmin 24 Oct red: LAY-13 does not cover placement between paragraphs; a new rule |
| SL-41 | New rule | Print hides the dock, rail, actions, Read next and toast | `reader.css:1346` | | build green |

### Changed rules (flags)

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| SL-42 | Changed rule | Only the site header may be sticky, but the reading rail is sticky, and the dock, selection bar and toast are fixed | `reader.css:525`, `:1050`, `:1234`, `:1288` | `LAY-15` | build red: conflicts with LAY-15 |
| SL-43 | Changed rule | Page width: own gutter `clamp(16px, 4.5vw, 44px)` and containers 1240px and 1400px in place of `--gutter-page` and `--measure-shell` (80rem); uses `vw` | `reader.css:30` to `:32` | `LAY-01`, `LAY-02`, `LAY-03` | build red: breaks LAY-01, LAY-02, LAY-03; wider than the 80rem shell |
| SL-44 | Changed rule | Third-party brand colors in hex: share networks, the Google mark, white on the share icons | `reader.css:346` to `:378`, `:1195` | `COL-01`, `COL-02` | build red: COL-02 needs a brand-mark exception |
| SL-45 | Changed rule | Focus ring is 2px in `--rd-accent` (brand in light, interactive in dark) | `reader.css:82` | `COL-13`, `COL-04` | build red: COL-13 color and offset differ |
| SL-46 | Changed rule | The category is a filled brand button (brand in light, interactive in dark) | `reader.css:188` | `COL-04`, `COL-05` | build red: COL-04 and COL-05 keep brand off controls |
| SL-47 | Changed rule | shadcn Alert, Badge, Card and Dialog are added; CPT-16 lists Sheet, Drawer, Collapsible, Tabs and RadioGroup only | `src/components/ui/alert.tsx`, `badge.tsx`, `card.tsx`, `dialog.tsx` | `CPT-16` | build red: CPT-16 list needs the four components |
| SL-48 | Changed rule | Interface text lives in `src/components/reader/strings.ts`, not in `src/i18n/` | `strings.ts` | AGENTS §7 | build red: AGENTS §6 rule 15 and §7 |
| SL-49 | Changed rule | Content comes from `@/content/reader`, which the lint rule allows only through `@/content` | `ReaderPage.tsx:11`, `ArticleParts.tsx:10`, `ContextCard.tsx:10`, `page.tsx:5` | DR-01 | build red: fails pnpm lint (DR-01) |
| SL-50 | Changed rule | Borders on non-card panels: popover, dock and share link field | `reader.css:1095`, `:1049`, `:1204` | `CPT-06` | build green: not cards, so CPT-06 holds |
| SL-51 | Changed rule | The inline ad row has `margin-block: space-module` on the ad row itself, inside the body | `reader.css:842` | `LAY-09`, `LAY-12` | tajmin 24 Oct | red: LAY-09 says ad rows have no margin |
| SL-52 | New token | A page alias layer over the color tokens: `--rd-bg`, `--rd-card`, `--rd-line`, `--rd-accent`, `--rd-flare` and others; dark swaps brand for interactive | `reader.css:10` to `:27`, `:66` | `COL-01`, `COL-03` | build | red: colors must be the tokens themselves, or the aliases become component tokens |
| SL-53 | New token | Viewport units `100dvh`, `60svh` and `env(safe-area-inset-bottom)` | `reader.css:49`, `:56`, `:1056` | `LAY-01`, `LAY-02` | build | red: not in the layout tokens |

## Open code issues (not spec items)

- `tests/e2e/article.spec.ts` covers the widths, axe, the share dialog focus and copy result, the text size keys, the dock focus, the stored text size and the ads. Gaps are under Later.
- Dark mode logo contrast (2.37:1 and 1.72:1): `--brand` is the same in both themes. Also on the homepage.

### Later (PR #8 review notes, 24 Oct 2026)

Not fixed in code. They wait for a later ticket.

- Read next hand-writes a grid in `ReadNext` (`ArticleParts.tsx`) instead of extending `PeerRow` (`LAY-08`, AGENTS §9.3). Titles do not align across cards without subgrid.
- The reading store writes `hidden`, `past` and `scrolled` but nothing reads them. The JS uses raw offsets: `72`, `240` and `8` in `ReaderRoot.tsx`, and `76` and `130` in `SelectionShare.tsx`. Remove the dead state; take the offsets from the layout tokens.
- The Vercel preview domain is hard-coded twice: the Google preferred-source link (`ArticleParts.tsx`) and the share origin for the server render (`Share.tsx`). Move both to one site setting before production.
- `SelectionShare` works with the mouse and touch only. Give it a keyboard path.
- E2E gaps: keyboard and axe run at 1280 only, so the dock and the popovers below 1280 have no keyboard test. No CLS, reduced-motion or 200% text test on the article page. The `#region-` links are filtered out of the DR-331 check, as in `header.spec.ts`.
- `.rd-sharedlg__link` and the `.rd-selbar` buttons have fixed heights (`LAY-17`). They are controls, not text blocks; check them at 200% text size.
- Dark mode logo contrast: see the item above.

## Checkpoint reports

### Checkpoint 1 · 24 Oct 2026

| Item | Keep / Fix now / Later | Note |
| --- | --- | --- |
| SL-13 | Keep, Fix now | 12px and 12px at every width; deck to lead image is space-module (24 / 32 / 40), like the other module gaps (tajmin 24 Oct) |
| SL-15 | Fix now | Done: en `clamp(2.25rem, 1.957rem + 1.304vw, 3rem)` 36 to 48px, bn `clamp(2.125rem, 1.88rem + 1.087vw, 2.75rem)` 34 to 44px, largest from 1280 |
| SL-18 | Fix now | Done: icon buttons `--icon-button-size-ghost`, controls `--icon-button-size`, icons `--icon-size` |
| SL-19 | Fix now | Done: every spacing and size px is `calc(var(--spacing) * n)` (LAY-21, half steps allowed); odd 5px and 7px snapped to 4px and 8px. Left in px: 1px rules, ad sizes (LAY-19), media queries, the SVG frame, SL-43 widths |
| SL-20 | Fix now | Done: `--default-transition-duration` |
| SL-21 | Fix now | Done: no wash. Icon buttons change icon color (interactive-hover, -pressed); category fill interactive-hover, -pressed; selection bar fill interactive |
| SL-22 | Question | "Kicker" is the CSS name of the row that holds the category; it is the Eyebrow. Rename when the heading is rebuilt |
| SL-24 | Fix now | Done: no caption bar |
| SL-33 | Question | Three sizes, as the spec; the log and a code comment said four (corrected) |
| SL-44 | Fix now | Done: no hex. Share icons are ink, interactive-hover on hover; the Google mark takes the text color |
| SL-45 | Fix now | Done: the page's focus override is removed; the base rule applies (2px ring, 2px offset, COL-13) |
| SL-48 | Fix now | Done: reader strings moved to `src/i18n/bn.ts` and `en.ts` under `reader` |
| SL-49 | Fix now | Done: article functions and types exported from `src/content/index.ts`; the page imports `@/content` (DR-01, no rule change) |
| SL-51 | Fix now | Done: no margin on the ad row; the paragraphs before and after it own space-module (LAY-12) |
| SL-52 | Fix now | Done: the `--rd-*` color aliases are removed; colors are the color-system tokens, accents `--color-bar` |
| SL-53 | Fix now | Done: no `dvh`; lead image cap 32rem; `env(safe-area-inset-bottom)` stays with the dock (SL-42 Keep) |
| SL-12, SL-40, SL-42, SL-43, SL-46, SL-47 | Keep | tajmin 24 Oct: "all ok" |

- Spec log items so far: SL-01 to SL-53. Reviewer verdict: 40 green, 13 red (design-reviewer, 24 Oct; SL-03 reviewed red, corrected to green: layout §3.3 allows 3 per row from 1024px on other pages).
- Decisions so far: dead code removed (commits 7187808, c29f254); header section links fixed (bca4abf). tajmin 24 Oct: no hook bypass; spec edits by a project thread after accept. Fix now done for SL-20, 21, 24, 44, 45, 48, 51, 52. Green items wait for /accept; red items need an explicit mark. Round 2: SL-15, 18, 19, 53 done; SL-12, 40, 42, 43, 46, 47 Keep. SL-13 deck gap on space-module. SL-49 done; Popover ref fixed; `pnpm check` green.
- Accepted by tajmin, 24 Oct 2026: the green items and every Keep and Fix now item go into the specs. Spec edits and register entries by a project thread (DR-372, no hook bypass).
