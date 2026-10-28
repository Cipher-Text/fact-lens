# Fact Lens: Issues

Version 1.1 · 27 October 2026 · Fixed, decided and closed items removed (the git history keeps them); the article page open items moved here (IMP-101 to IMP-114)

The one place for every open item, flag and decision on an issue. Read it instead of the git history. Items from `prototype-findings.md` and `PROGRESS.md` (removed 24 October 2026) are copied here with their full text.

## How to use this file

- Add a row for each new finding with the next free ID of its prefix (U-48, IMP-116, DOC-57, KIT-xx). Add a detail entry below when one line is not enough.
- This file lists open items only: Open, Open (flag) or Later. When an item is fixed, decided or closed, record the result where it belongs (the spec, the decision register or the commit) and remove the row and its detail entry (tajmin, 27 Oct 2026). The git history keeps the old rows.
- A flag is an item that needs tajmin's decision (`AGENTS.md` Section 8). Its status is "Open (flag)" until tajmin decides.
- Page spec logs keep only their open spec items. Open code items of a page are rows here.

| Prefix | Kind | Who acts |
| --- | --- | --- |
| `DOC-` | A spec is wrong, unclear or does not agree with itself | tajmin |
| `U-` | The design system has no decision (`UNRESOLVED_DESIGN_SYSTEM`) | tajmin |
| `IMP-` | A choice made in code where the specs leave room. It needs confirmation | tajmin |
| `KIT-` | A problem in the Claude Code kit (agents, hooks, skills, settings) | tajmin |

Severity: High (breaks a rule or shows wrong output to readers), Medium (works now, causes a fault or rework later), Low (wording, clarity or tidiness).

| ID | Found | Title | Severity | Status |
| --- | --- | --- | --- | --- |
| U-01 | FL-01 | English category labels | Medium | Later: IA label table (DR-342, DR-282) |
| U-07 | FL-04 | Region list under অঞ্চল | Medium | Later: the backend owns the list and order (DR-411); 8 working regions, labels approved (tajmin, 28 Oct 2026) |
| U-08 | FL-05 | Logo asset and its role. The dark text logo fails axe contrast until the SVG exists | Medium | Later: logo SVG from the design owner; text stand-in stays (DR-304) |
| IMP-12 | FL-04 | Category and region labels are interface strings | Low | Later: backend integration; labels stay in `src/i18n/` (DR-263) |
| IMP-14 | FL-05 | Nav, region and Subscribe links go to homepage anchors | Low | Later: backend integration. Category items go to the category pages (PR #11); region, Regions, বিশ্লেষণ and মতামত items go to `/regions/<slug>`, `/regions`, `/analysis` and `/opinion` (404 until IMP-18). The parent বিশ্লেষণ ও মতামত stays an anchor (DR-331) |
| IMP-18 | FL-06 | Story and Latest links lead to 404 pages | Low | Later: section pages; URL patterns are set (layout 7C), 404s stay for `/latest`, `/analysis`, `/opinion`, `/regions`, `/regions/<slug>`, `/topic/<slug>` and stories with no text. Category part fixed (PR #11) |
| IMP-25 | FL-09 | Mock newsletter: own email check, 0.8s sending state, no email sent | Low | Later: newsletter phase (DR-343) |
| IMP-33 | R2-03 | Newsletter strings and components stay until the newsletter phase | Low | Later: newsletter phase (DR-343) |
| IMP-41 | R2-05 | The nav uses the working category labels; C-18 lists shorter ones | Medium | Later: IA label table; working labels stay (DR-282) |
| IMP-45 | R2-06 | `AdSlot` always renders; the rule "no booking, no `ad-top` row" (DR-250) has no code path yet | Low | Later: no-booking path with real ad data (DR-316) |
| IMP-65 | Audit 13 Oct | Production-only behavior is not tested | Low | Later: production smoke run in M2 (DR-345) |
| IMP-74 | R3-02 | Region links in the Drawer have no target for 3 of 7 regions | Medium | Later: editorial question, M2 (DR-348) |
| IMP-91 | R5-01 | Bangla pages shift at load from 1280: the Noto Sans Bengali swap moves the centered NavBar row 3.7px (CLS 0.00003) | Low | Open (test blocks the web fonts, tajmin's choice) |
| DOC-51 | R5-01 | C-18 cuts the NavBar.item focus ring at its top and bottom: the links fill the 44px row; the list overflow (DR-359) and the slide clip-path cut the COL-13 ring. Options: inset ring (outline-offset -4px), a link shorter than the row, or `overflow: clip` with a clip margin (not in Safari) | Medium | Open (flag) |
| IMP-92 | R5-02 | Real Safari (macOS): Tab does not reach the poll vote button | Low | Open (tajmin: low priority) |
| IMP-93 | PR #7 review | Before hydration (or with JS off) the NavBar items that wrap are cut off but are still in the Tab order | Low | Open |
| IMP-94 | PR #7 review | Latest with one story at 768 to 1023: the column rule shows beside an empty second column (layout §7.3) | Low | Open |
| IMP-95 | PR #7 review | `header.spec.ts` uses fixed waits (lines 357, 1216: 100ms; 1310: 500ms) for "nothing changes" checks | Low | Open |
| IMP-97 | – | URL format, home and article: one `/story/<slug>-<id>` root, formats, South Asia, topics, Eyebrow (task `docs/tasks/url-format.md`) | Medium | Open: built on `page/url-format` (checkpoints 1 to 5, spec log UF-01 to UF-07); closes when the PR merges. Run 2 is IMP-118 |
| IMP-118 | – | Category page lists opinion and analysis in its main stream; DR-415 wants news only, with analysis and opinion sections before Most read | Medium | Open: run 2, `page/category-formats` (tajmin, 28 Oct 2026) |
| IMP-119 | `page/url-format` final checkpoint | The axe checks on the article page can run while the heading still fades in (rd-rise): color-contrast then reads the metadata at 4.46:1 and fails about 1 run in 5. `url-format.spec.ts` now waits for `document.getAnimations()` to end; `article.spec.ts:91` does not yet | Low | Open |
| IMP-100 | Category page checkpoint | Move the hand-drawn 1px horizontal rules to Divider.rule (C-22): the article rule above the Tags, and the candidates in the detail entry | Medium | Open: to do (tajmin, 27 Oct 2026) |
| U-47 | `page/home-most-read` checkpoint | 200% text size: layout §13 and the C-07 check say most read stacks; with the one RankedList layout it keeps two list columns from 600 (no sideways scroll, `text-size.spec.ts` passes). Keep two columns and change §13, or set a stacking trigger (spec log HM-04) | Medium | Open (flag) |
| U-48 | `page/url-format` final checkpoint | `MissingTranslationNote` (DR-401) has no sheet: neutral `type-ui-sm` `ink-secondary` line above the category page title, `--space-module` below (`src/components/category/MissingTranslationNote.tsx`; spec log UF-06). The page is static, so the text comes in after hydration and pushes the title down (layout shift, PR #15 review); the empty status region is in the server HTML so the text is announced. To stop the shift: make the category route read `searchParams` (dynamic), or have the sheet place the note where it moves nothing | Low | Open (flag) |
| U-49 | `page/url-format` final checkpoint | C-08 `format` mode: the code uses it on the hero lead and top stories only; the sheet also names region columns and More stories, which show no Eyebrow (DR-153, DR-370). Read next keeps `category`. Change the sheet or add the Eyebrow (spec log UF-02) | Medium | Open (flag): tajmin fixes later |
| DOC-56 | `page/home-most-read` checkpoint | `--type-story-title-sm-ink-end` (typography 3.1, "Below the last title line (RankedList)") has no user since RankedList dropped Divider.item (IMP-99); only `tokens.test.ts` reads it. Retire it or name a new user | Low | Open |
| IMP-115 | `page/home-most-read` visual QA | Homepage `/` and `/en` at 768 with the root font size at 200%: the page scrolls sideways (scrollWidth 936 for 753): Featured story media and the Regions row. Category pages do not. `text-size.spec.ts` passes; check how it sets the text size. Not caused by IMP-99 | Medium | Open |
| IMP-98 | Category page checkpoint | `regions.spec.ts:579` axe at 360 fails in the full Chromium run (`scrollable-region-focusable` on the phone tab list) and passes when run alone: timing before hydration | Low | Open |
| IMP-101 | Article PR #8 review | Read next (`ReadNext`, `ArticleParts.tsx`) hand-writes a grid instead of extending `PeerRow`; titles do not align across cards without subgrid (`LAY-08`) | Medium | Later (tajmin, 27 Oct 2026) |
| IMP-102 | Article PR #8 review | Dead reading state (`hidden`, `past`, `scrolled` are written, never read) and raw offsets in JS: `240`, `8`, `10` in `ReaderRoot.tsx`, `76`, `130`, `12` in `SelectionShare.tsx` | Low | Later |
| IMP-103 | Article PR #8 review | The Vercel preview domain is hard-coded twice: the Google preferred-source link (`ArticleParts.tsx:32`) and the share origin (`Share.tsx:20`). One site setting before production | Medium | Later |
| IMP-104 | Article PR #8 review | `SelectionShare`: no keyboard path; `role="toolbar"` without arrow keys; its scroll listener removes the bar while touch readers drag the selection handles (`COL-13`) | Medium | Later |
| IMP-105 | Article PR #8 review | Fixed heights on `.rd-sharedlg__link` and the `.rd-selbar` buttons (`LAY-17`): controls, not text blocks; check them at 200% text | Low | Later |
| IMP-106 | Article PR #8 review | The lead image passes `story.image.alt` through, so it may repeat the caption; the comment above it (`ReaderPage.tsx:114`) says the image is decorative | Low | Later |
| IMP-107 | Article PR #8 review | `textSizes` and `textSizeGlyphs` are comma-packed strings in the string tables, split in `Controls.tsx`. Make them arrays | Low | Later |
| IMP-108 | Article PR #8 review | The toast does not announce the same text twice in a row; `.rd-toast:empty` is dead CSS | Low | Later |
| IMP-109 | Article PR #8 review | The dock meta can wrap to two lines; `--rd-dock-h` assumes one, so the scroll padding may be a line short | Low | Later |
| IMP-110 | Article PR #8 review | Back to top (`Reading.tsx:45`) scrolls with `behavior: "smooth"` and ignores `prefers-reduced-motion` | Medium | Later |
| IMP-111 | Article PR #8 review | `inlineAdPositions` (`ArticleParts.tsx:119`): when the first ad moves past paragraph 10, the second can follow right after it (`LAY-22`). Add a minimum gap and a unit test | Medium | Later |
| IMP-112 | Article PR #8 review | `Popover.tsx` sets `aria-controls` while the panel is closed and not in the DOM | Low | Later |
| IMP-113 | Article PR #8 review | Code comments in `src/components/reader/` and `reader.css` cite "tajmin, 24 Oct 2026" for approvals given on 23 Oct 2026 (10 places) | Low | Later |
| IMP-114 | Article PR #8 review | Article e2e gaps: keyboard and axe at 1280 only (the dock and popovers below 1280 untested); no CLS, reduced-motion or 200% text test; the dock at 320px with 200% text; axe with the dock, a popover and the share dialog open; `SelectionShare`, the toast, popover focus-out. The `#region-` links are filtered out of the DR-331 check, as in `header.spec.ts` | Medium | Later |

## Details

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

- **Found:** FL-05 · **Severity:** Low · **Status:** Later: backend integration. Category items go to the category pages (PR #11); region and Analysis links stay anchors
- **Choice:** Region pages do not exist (DR-01). Before PR #11 the category items were anchors too. Links go to `#category-<id>`, `#regions`, `#region-<id>` and `#newsletter`. FL-06 to FL-11 must give the sections these ids. A drawer link closes the drawer and moves the focus to its target when the target exists; otherwise focus returns to the menu button.
- **FL-08:** `#category-bangladesh` and `#category-geopolitics` now exist. The header test that used a stand-in target uses the real section. The other categories get ids in FL-09.
- **FL-09:** `#category-security`, `#category-history`, `#category-economy`, `#category-technology` and `#newsletter` now exist. Only `#regions` and `#region-<id>` (FL-11) are left.
- **FL-11:** `#regions` and every `#region-<id>` now exist. On phones a region link also selects its tab. Every anchor has a target.

---

### IMP-18 Story and Latest links lead to 404 pages

- **Found:** FL-06 · **Severity:** Low · **Status:** Later: section and story pages; URL patterns are set, 404s stay (run 2 review, no DR)
- **Choice:** Story headlines link to `/story/<slug>` (`/en/story/<slug>` in English) and the Latest "আরও দেখুন" link to `/latest`. These pages do not exist yet (AGENTS.md Section 1), so they show the 404 page. Real URLs keep the keyboard order and link semantics right.
- **Category part:** fixed by the category pages (PR #11). Story links and `/latest` stay 404 pages until IMP-97 and the Latest page.
- **Suggested solution:** Set the article URL pattern in IMP-97.

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

### IMP-74 Region links in the Drawer have no target for 3 of 7 regions

- **Found:** R3-02, 16 Oct 2026 · **Severity:** Medium · **Status:** Later: editorial question, M2 (DR-348)
- **Source:** `component-system.md` C-19 Content (DR-331: every # target in the nav must exist); `src/components/header/navItems.ts`, `src/content/homepage.ts` (the slider shows 4 regions: China, India, Middle East, Africa).
- **Problem:** the Drawer lists 7 regions, so `#region-myanmar`, `#region-southeast-asia` and `#region-europe` have no panel on the homepage. All other # links (categories, `#regions`, `#analysis-opinion-title`) have a target and a test checks them.
- **R3-06:** the slider builds every region that has stories (6 of 7). `#region-africa` still has no target, because the mock keeps Africa without stories on purpose (mock-content skill, `spacing-layout-system.md` 7.3: a region with no stories does not show).
- **Suggested solution:** tajmin decides: give Africa two mock stories (7 panels), or drop `africa` from the Drawer list while it has no stories.

### IMP-91 Bangla font swap moves the NavBar items at load

- **Found:** R5-01, 18 Oct 2026 · **Severity:** Low · **Status:** Open (test blocks the web fonts, tajmin's choice)
- **Source:** R5-01 checkpoint 3 check "CLS 0 at load"; typography §8 (`next/font`); `src/components/header/NavBar.tsx`.
- **Problem:** on `/` at 1280 and 1440 the load has one layout shift, 0.000036 (1280) and 0.000028 (1440): when Noto Sans Bengali replaces its fallback, ভূরাজনীতি ও কূটনীতি is 1px narrower and the centered items before it move 3.7px sideways. With the `.woff2` files blocked the CLS is 0, and `/en` is 0. The production build shows the same. It is not hydration: the NavBar row is one line from the server HTML (IMP-90).
- **What the code does:** no change. `header.spec.ts` blocks the web fonts in the hydration test, so it measures the NavBar row only.
- **Suggested solution:** better fallback metrics for Noto Sans Bengali (size-adjust, ascent and descent overrides), or preload the Bangla UI font. tajmin decides.

### DOC-51 C-18: the NavBar.item focus ring is cut at its top and bottom

- **Found:** R5-01, 18 Oct 2026 · **Severity:** Medium · **Status:** Open (flag)
- **Source:** C-18 Surface (max-height --nav-row-height, overflow hidden, DR-359) and NavBar.rules (the slide, `nav-row-slide` clip-path inset(0), DR-349); COL-13 (2px ring, 2px offset); `src/styles/colors.css` `:focus-visible`.
- **Problem:** the NavBar links are as tall as the 44px row, so the ring is drawn 4px outside the list at the top and the bottom. The overflow hidden of the list cuts it, and the clip-path of the band already cut it in run 4. Only the left and right sides of the ring show (screenshot at 1280, `/en`).
- **What the code does:** C-18 as written. No treatment chosen (tajmin: flag).
- **PR #7 review (18 Oct 2026):** claude-review raised it as a fix (COL-13): fix it or approve the clip as an exception. Claude's recommendation: the inset ring, since both the list overflow and the band clip-path stay as specified. Needs tajmin's and the blueprint's decision (COL-13 sets the 2px offset).
- **Suggested solution:** one of: an inset ring on NavBar.item (outline-offset -4px); a link shorter than the row with the 3px current line on the li; or `overflow: clip` with `overflow-clip-margin` (not in Safari). The blueprint decides.

### IMP-92 Safari: Tab does not reach the poll vote button

- **Found:** R5-02, 18 Oct 2026 (real Safari checklist, item 1) · **Severity:** Low · **Status:** Open (tajmin: low priority)
- **Source:** C-26 (DailyPoll), COL-13; `src/components/home/grouped/DailyPoll.tsx`; A11Y-24; IMP-53.
- **Problem:** in macOS Safari, Tab from a poll option does not move to the vote button, so the keyboard vote (option, Space, Tab, Enter) cannot finish. Every other Safari checklist item passed, on macOS and iOS.
- **What the code does:** the vote button is a plain `<button>` (the shared Button), not disabled, with no `tabIndex`. Chromium and the WebKit e2e reach it.
- **Suggested solution:** first check whether the result depends on Safari Settings > Advanced > "Press Tab to highlight each item" (with it off, Safari's Tab skips buttons by design and Option+Tab reaches them). If the button is skipped with the setting on, find the cause in the poll markup. tajmin decides; not in run 5.

### IMP-93 Clipped NavBar items are focusable before hydration

- **Found:** PR #7 review (claude-review), 18 Oct 2026 · **Severity:** Low · **Status:** Open (fix planned later)
- **Source:** C-18 (DR-359, IMP-90); `src/components/header/NavBar.tsx:110`; COL-13.
- **Problem:** the item list is one row tall from the server HTML (`max-h`, `overflow-hidden`). Items that wrap are cut off but not `hidden` until `fit()` runs, so before hydration, or with JS off, Tab can move focus to a link that is not visible. The R5-01 check "wrapped items are not in the Tab order" is tested only after hydration.
- **What the code does:** no change.
- **Suggested solution:** hide the items past a fixed count in the server HTML (the IMP-90 option), so the server and the client agree. A behavior change: plan it with the fix.

### IMP-94 The Latest column rule shows beside an empty column

- **Found:** PR #7 review (claude-review), 18 Oct 2026 · **Severity:** Low · **Status:** Open (fix planned later)
- **Source:** layout §7.3 (P-1: "Latest shows the items that exist"; P-4: "the other column spans"); C-03, DR-355; `src/components/story/StoryList.tsx:55`, `divider-column-columns`.
- **Problem:** with `columns={2}`, the rule draws at 768 to 1023 whatever the item count. With one story there is no column break, so the second column is empty and the rule stands beside it. With 2 or more stories both columns have items. The mock data (5 stories) hides it.
- **What the code does:** no change.
- **Suggested solution:** with fewer than 2 stories, StoryList renders one column (no `columns-2`, no rule), as in P-4. Add a sparse e2e case: one story at 768 and 1000.

### IMP-95 Fixed waits in the header tests

- **Found:** PR #7 review (claude-review), 18 Oct 2026 · **Severity:** Low · **Status:** Open (fix planned later)
- **Source:** `tests/e2e/header.spec.ts:357`, `:1216` (100ms), `:1310` (500ms); IMP-86 (flaky under load).
- **Problem:** the review calls these flaky. They check that nothing changes (no scroll, the bar stays stuck, no layout shift), so they cannot poll for a state; but the 100ms waits stand for "the scroll handler has run", which is one animation frame.
- **What the code does:** no change.
- **Suggested solution:** lines 357 and 1216: wait two animation frames (the handler runs in `requestAnimationFrame`) instead of 100ms. Line 1310: keep the window for late layout shifts after hydration, or end it on a hydration marker. Check with `--repeat-each=10`.

### IMP-97 URL format, home and article

- **Found:** URL format thread, 25 Oct 2026; rules changed 28 Oct 2026 · **Severity:** Medium · **Status:** Open: built on `page/url-format`, closes when the PR merges (28 Oct 2026)
- **Task:** `docs/tasks/url-format.md` gives every rule, the checkpoints and the test files. The paths are in `spacing-layout-system.md` Section 7C.
- **Problem:** articles use `/story/<slug>` with no id; the content model has `explainer` and a `bangladesh` category; the article end links to `/tag/`; the menu links বিশ্লেষণ and মতামত to a homepage anchor; the Eyebrow has one mode.
- **Not in it:** the category page formats (IMP-118) and the hub, region and topic pages.
- **Built:** `/story/<slug>-<id>` with a 301 from a wrong or old slug and a 404 for an unknown id or bare `/story`; formats news, analysis, opinion; South Asia in P-2 and the nav; 8 regions; topics at `/topic/<slug>`; C-08 `format` and `two-part`; missing translation (DR-401). Decisions on the way (tajmin, 28 Oct 2026): `--space-eyebrow-separator` 8px (UF-04); mock data adds the `reserve-indicators` article and region tags so each shown region has 3 stories.

### IMP-100 Move the hand-drawn 1px rules to Divider.rule

- **Found:** category page final checkpoint, 27 Oct 2026 · **Severity:** Medium · **Status:** Open: to do (tajmin, 27 Oct 2026)
- **Source:** C-22 Divider.rule (`component-system.md`, `src/components/layout/Divider.tsx`). tajmin: Divider.rule is the shared part wherever one plain 1px horizontal rule is needed.
- **To do: swap (same look):**
  - [ ] Article page: the rule above the Tags, `.rd-after` `border-top: 1px solid var(--border)` (`src/styles/reader.css:891`, C-34 area).
- **To do: tajmin decides, then swap or keep (each differs a little or belongs to another component's sheet; tajmin, 27 Oct 2026):**
  - [ ] Article page: the line above the byline, `.rd-meta` `border-top: 1px solid var(--border-soft)` (`reader.css:249`). Uses the softer border color.
  - [ ] Article page: the dock's top edge, `.rd-dock` `border-top: 1px solid var(--border-soft)` (`reader.css:991`). Uses the softer border color; the edge of a fixed surface.
  - [ ] NavBar bottom line, `border-b border-border` (`NavBar.tsx:107`; C-18, DR-349).
  - [ ] Drawer row lines, `border-b border-border` (`Drawer.tsx:243`; C-19 Drawer.item).
  - [ ] TopBar stuck line (`TopBar.tsx:29`; C-17).
- **Not a candidate:** the key points line is dotted (`reader.css:616`), so it matches Divider.item.
- **Suggested solution:** swap the article rule on the next article branch; decide each candidate with its sheet.

