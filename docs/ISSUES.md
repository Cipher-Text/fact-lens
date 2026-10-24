# Fact Lens: Issues

Version 1.0 · 24 October 2026

The one place for every open item, flag and decision on an issue. Read it instead of the git history. Items from `prototype-findings.md` and `PROGRESS.md` (removed 24 October 2026) are copied here with their full text.

## How to use this file

- Add a row for each new finding with the next free ID of its prefix (U-42, IMP-97, DOC-55, KIT-xx). Add a detail entry below when one line is not enough.
- Do not delete a row. Change its status: Open, Open (flag), Later, Decided, Fixed or Closed, with the date, who decided and the commit or PR when there is one.
- A flag is an item that needs tajmin's decision (`AGENTS.md` Section 8). Its status is "Open (flag)" until tajmin decides.
- Article page spec items stay in `docs/spec-log/article.md`; a finding that needs a decision goes here too.

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
| U-07 | FL-04 | Region list under অঞ্চল | Medium | Later: IA label table; 7 working regions (DR-342) |
| U-08 | FL-05 | Logo asset and its role. The dark text logo fails axe contrast until the SVG exists | Medium | Later: logo SVG from the design owner; text stand-in stays (DR-304) |
| IMP-12 | FL-04 | Category and region labels are interface strings | Low | Later: backend integration; labels stay in `src/i18n/` (DR-263) |
| IMP-14 | FL-05 | Nav, region and Subscribe links go to homepage anchors | Low | Later: backend integration; homepage anchors stay |
| IMP-18 | FL-06 | Story and Latest links lead to 404 pages | Low | Later: section pages; URL patterns are set, 404s stay |
| IMP-25 | FL-09 | Mock newsletter: own email check, 0.8s sending state, no email sent | Low | Later: newsletter phase (DR-343) |
| IMP-33 | R2-03 | Newsletter strings and components stay until the newsletter phase | Low | Later: newsletter phase (DR-343) |
| IMP-35 | R2-04 | The Eyebrow is a link to `/category/<id>`, which is a 404 page | Low | Later: covered by the URL patterns, 404 stays (DR-311) |
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
| DOC-54 | PR #9 hotfix | `reader.css` `.rd-dock` (C-35, DR-228, DR-386): layout §10 puts `--z-dock` (55) above `--z-overlay` (50), so the dock covered the drawer, search and share dialog. While an overlay is open the dock drops to `--z-bar` | Medium | Decided: keep the CSS rule, no spec change (tajmin, 24 Oct 2026) |
| IMP-96 | PR #7 review | The run 5 report says "A11Y-24 closed" with IMP-92 open, and "every WebKit failure is a test fault" without per-test evidence | Low | Closed: the run 5 report is removed (tajmin, 24 Oct 2026) |
| DOC-52 | R5-01 | The R5-01 sprint check says the first NavBar item edge equals the shell edge; C-18 centers the items (DR-170) | Low | Closed: the sprint file is removed (tajmin, 24 Oct 2026) |

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

### IMP-96 Run 5 report wording on A11Y-24 and the WebKit failures

- **Found:** PR #7 review (claude-review), 18 Oct 2026 · **Severity:** Low · **Status:** Open (fix planned later)
- **Source:** `docs/run-5-report.md:12`; `docs/webkit-failures.md` "Real Safari (A11Y-24)"; IMP-92.
- **Problem:** the report says "A11Y-24 closed" while IMP-92 (a keyboard failure on the vote button) is open, and "every WebKit failure is a test fault" although the Safari check maps families to checklist items, not each of the 51 tests. The PR body says "except IMP-92".
- **Suggested solution:** "A11Y-24 closed with one open item (IMP-92)"; "every WebKit failure family maps to a checklist item that passes in real Safari". Fix the "( Tab" typo in the same line.

### DOC-52 R5-01 check: "first item edge equals the shell edge"

- **Found:** R5-01, 18 Oct 2026 · **Severity:** Low · **Status:** Open (test checks the list and rule edges)
- **Source:** `docs/SPRINT.md` R5-01 checkpoint 3 check 2; C-18 NavBar.item "centered in the shell (DR-170)".
- **Problem:** the items are centered, so the first item starts 25 to 49px inside the shell (1280 and 1440). The item list and the rule are on the shell edges.
- **What the code does:** follows C-18. The test checks that the band spans the viewport, the list and the rule are on the shell edges ±0.5px and every item is inside the shell.
- **Suggested solution:** word the check as "the item list and the rule edges equal the shell edges".
