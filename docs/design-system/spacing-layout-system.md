# Fact Lens Spacing and Layout System

Version 2.34 · 4 November 2026 · Analysis hub sync review (DR-440, DR-447): Section 9 ad density, a hard 30% limit under 768 only, measured against the main content; 7F.3 an empty hub shows a no-content message (U-61). Before: 2.33 · 4 November 2026 · Analysis hub (spec log analysis AN-01, AN-02, AN-04, AN-08, AN-10): Section 7F (new), the analysis hub page order, content and sparse cases; 7C.2 Analysis hub row names 7F. Then, approved by tajmin (4 Nov 2026: "Add the spec changes"; after the third PR 23 review: "make this ad behavior available for any page at whatever breakpoint the rail is displayed from"): `ad-rail` shows whenever the rail is a column, from 1024, on every page, the homepage P-3 included (amends DR-245), with `--ad-rail-w` and `--ad-rail-h` in the 64rem block (Sections 7.2, 9, 12.2) (AN-11); 7F.1 the description (AN-12) and the Analysis nav item (AN-16). Before: 2.32 · 30 October 2026 · XC fixes (spec log xc-fixes XF-04 to XF-08): 7B.1 and 7B.3 fixed halves in `CategoryFormatsSection` (DR-436); 7B.2 `main` starts with the title band (as 7D.2); 7E.2 noindex, follow below 3 stories, no `?page` (DR-432); DR citations in 7.1, 7B.1, 7C, Section 10 (DR-420, DR-419, DR-418, DR-393). Before: 2.31 · 30 October 2026 · Topic page (IMP-18, Topic spec log TP-01 to TP-03): new Section 7E; the 7C.2 Topic row names it. Before: 2.30 · 29 October 2026 · Docs cleanup (`task/docs-cleanup`): the spec text names a spec log by its page and item IDs, not by its file path (7A, 7B, 7D). No rule changes. Before: 2.29 · 28 October 2026 · Latest page (spec log `latest.md` LT-01 to LT-04): new Section 7D; 7B.1 and 7D name `MoreStoriesSection`; 7B.2 Load more adds the motion of the added rows and their story time. Before: 2.28 · 28 October 2026 · Category formats (DR-415, spec log `category-formats.md` CF-01, CF-02, CF-06, CF-07): 7B.1 the analysis and opinion row above Most read and the PageTitle band; 7B.2 Formats; 7B.3 sparse. Before: URL format (IMP-97): new Section 7C URLs; article URL `/story/<slug>-<id>`; South Asia replaces Bangladesh on the homepage (7.1). Before: Homepage most read (IMP-99): P-5 uses the RankedList layout of the category page (7.2, Sections 4 and 8). Before: Category review: LAY-07 and Section 7B, 1 card per row on the category page (amends DR-44); 7B rows name their parts; Section 14.2

This document is the single source for Fact Lens page layout and spacing. It is for designers, developers and AI agents. Other documents link to the tables in this document. They do not copy values.

This version covers the homepage, the article page (Section 7A) and the layout rules that all pages share. Other templates are not yet revised. For those templates, Section 14 lists the open items.

The wireframes show placement only. They do not give measurements. Use the values in this document. Component looks, parts and sizes are in `component-system.md`.

## Contents

1. [How to use this document](#1-how-to-use-this-document)
2. [Layout model](#2-layout-model)
3. [Breakpoints and grid](#3-breakpoints-and-grid)
4. [Widths](#4-widths)
5. [Spacing tokens](#5-spacing-tokens)
6. [Header](#6-header)
7. [Homepage](#7-homepage)
7A. [Article page](#7a-article-page)
7B. [Category page](#7b-category-page)
7C. [URLs](#7c-urls)
8. [Peer rows](#8-peer-rows)
9. [Ads](#9-ads)
10. [Layers](#10-layers)
11. [Rules](#11-rules)
12. [Implementation](#12-implementation)
13. [Validation](#13-validation)
14. [Open items](#14-open-items)
15. [Changelog](#15-changelog)

## 1. How to use this document

- Find the width, gap or spacing for an element in the **token tables** (Sections 3 to 5).
- Find the structure of a homepage section in the **pattern table** (Section 7).
- Follow the **rules** (Section 11). Each rule has a stable ID, for example `LAY-04`. Use the ID in reviews, prompts and commit messages.
- Copy the **CSS** in Section 12 into the app. Do not type values by hand.

Layout sets container widths, grid columns, gaps and vertical spacing. It does not set font, size or line length. For line length, see `typography-system.md`, Section 5. For color, see `color-system.md`.

## 2. Layout model

The page is a vertical stack of **rows**. Each row has one **container**. Content stays inside its container. No content breaks out of its container, and no layout uses `vw` units.

There are two kinds of container:

| Container | Width | Use |
| --- | --- | --- |
| Editorial container | A fixed maximum width, centered, with the page gutter on each side | Journalism and site interface |
| Ad container | Full viewport width. No padding, margin or gutter | One ad slot. The creative is centered |

There can be more than one editorial container width. Each width has one purpose:

| Editorial container | Token | Use |
| --- | --- | --- |
| Shell | `measure-shell` | Header nav row, every homepage section, footer |
| Reading column | `measure-reading-en`, `measure-reading-bn` | Article text (Section 7A) |

A section with a rail has two parts inside the shell:

- The **wrapper** is fluid. It holds the main content.
- The **rail** has a fixed width of 304px. It holds supporting content.

From 1024px, the rail is beside the wrapper. Below 1024px, the rail goes below the wrapper.

## 3. Breakpoints and grid

### 3.1 Breakpoints

| Tier | From | Columns | Page gutter | Column gap | Row gap |
| --- | --- | --- | --- | --- | --- |
| Phone | 0 | 4 | 16px | 16px | 20px |
| `sm` | 600px | 4 | 24px | 16px | 24px |
| `md` | 768px | 8 | 24px | 24px | 24px |
| `lg` | 1024px | 12 | 24px | 24px | 24px |
| `xl` | 1280px | 12 | 24px | 32px | 24px |

There is no `2xl` tier. From 1366px, no value changes. On a 1920px screen, the shell is 1280px, a column is approximately 84.7px, and four columns are 411px.

The column gap (`--grid-column-gap`) is the space between any two blocks that sit side by side: wrapper and rail, the two top stories, analysis and opinion, category blocks, region panels, Most read items, the poll columns, and the text and image of a card in a row (feature split, row third) or a quote mark and its text. The row gap (`--grid-row-gap`) is the space between two rows of a grid that have no rule between them. They are separate tokens. Every grid uses them; no component sets its own gap (DR-300). One exception: the gap between analysis and opinion (P-4) is `--space-analysis-gap`, 32px at 768 to 1023, 48px at 1024 to 1279, 64px from 1280 (DR-356). Keep it as an exception. A rule between rows uses `space-list-item` on each side instead (C-22).

### 3.2 Shell width per tier

The shell is `min(100% − 2 × gutter, 1280px)`.

| Viewport | Shell | Wrapper (shell − 304 − column gap) |
| --- | --- | --- |
| 360 | 328 | – (rail stacks) |
| 768 | 720 | – (rail stacks) |
| 1024 | 976 | 648 |
| 1280 | 1232 | 896 |
| 1366 and wider | 1280 | 944 |

### 3.3 Cards per row

| Viewport | Homepage peer rows | Other pages |
| --- | --- | --- |
| Below 600px | 1 | 1 |
| From 600px | 2 | 2 |
| From 1024px | 2 | 3 |

The homepage has no 4-up and no 3-up card row. Two parts are not card rows: Most read is a numbered list in two list columns: from 1024px in the middle and end of three columns, the start column empty (C-07; amends DR-51, DR-145), and the regions slider shows 4 region panels from 1280px (DR-140). The hero has two top-story cards.

## 4. Widths

Two kinds of width exist. Each kind has one owner.

| Kind | Owner | Property | Unit |
| --- | --- | --- | --- |
| Container width | This document | `width`, grid tracks | rem |
| Line length cap | `typography-system.md` | `max-inline-size` | rem |

When a text block has both, the smaller value applies.

### 4.1 Container widths

| Token | Value | Use |
| --- | --- | --- |
| `measure-shell` | 80rem (1280px) | Maximum editorial container |
| `measure-rail` | 19rem (304px) | Rail in every section that has a rail |
| `measure-reading-en` | 44rem (704px) | English article text |
| `measure-reading-bn` | 42rem (672px) | Bangla article text |

Homepage sections always use the full shell. They do not use `measure-content` (72rem).

### 4.2 Line length caps (from typography)

`typography-system.md`, Section 5, sets these caps and their values: `measure-article-title` (article title) and `measure-deck` (deck and summary).

## 5. Spacing tokens

### 5.1 Section rhythm

Values are for phone / from 768px / from 1024px.

| Token | Value | Use |
| --- | --- | --- |
| `space-page-start` | 24 / 32 / 40 | Header to first section |
| `space-section` | 48 / 64 / 80 | Between two editorial sections |
| `space-section-compact` | 32 / 40 / 48 | Between two related editorial sections |
| `space-module` | 24 / 32 / 40 | Between modules in a section. Between a section and its ad row |
| `space-rail-modules` | 48 / 48 / 64 | Between the newsletter and the poll in the P-3 rail: 64 when the rail is beside the wrapper, 48 when it stacks (DR-150). Prototype run 2 does not use it: the rail has the poll only (DR-239) |
| `space-section-title-after` | 20 / 24 / 24 | Section heading row to the first content |
| `--grid-row-gap` | 20 / 24 / 24 | Between grid rows with no rule between them. Lead story to top stories (DR-300) |

The space between a section and an ad row belongs to the section, not to the ad row (`LAY-12`).

Section 12.2 also gives these tokens to Tailwind as spacing names: `p-module`, `py-section`, `gap-section-title-after` (DR-235).

### 5.2 Component rhythm

These values are the same at all widths.

| Token | Value | Use |
| --- | --- | --- |
| `space-section-rule-title` | 12px | Section rule to section heading |
| `space-story-media-text` | 16px | Story image to story text |
| `space-story-title-summary` | 8px | Story title to summary |
| `space-story-title-meta` | 8px | Story title to metadata, when there is no summary |
| `space-media-caption` | 8px | Image to caption |
| `space-list-item` | 16px | List item to rule, on each side of the rule |
| `space-more-link` | 16px | Last item to the "more" link |

### 5.3 Panel inset

A colored panel (`Footer`, the বিশ্লেষণ ও মতামত background, and `NewsletterSignup` after prototype run 2) uses the `panel-inset` utility (`LAY-20`, DR-224). The value depends on the container width (`CPT-04`), not on the viewport.

**Panel band.** `AnalysisSection` (P-4) and `Footer` are panel bands (DR-264). The `surface-elevated` background spans the full viewport width. The content sits in the shell, so it aligns with the page gutter. A panel band takes only the block values of `panel-inset` (40px under 600px, 48px from 600px). It has no inline inset (`py-10` / `py-12`, no `px-*`).

| Container | Block | Inline | Classes |
| --- | --- | --- | --- |
| Under 600px (phones, the 304px rail) | 40px | 32px | `py-10 px-8` |
| 600px and more | 48px | 40px | `py-12 px-10` |

### 5.4 Ad sizes

Ad sizes are px tokens, because a creative image does not grow with the text size (`LAY-19`, DR-233). Section 9 gives the sizes per slot; Section 12.2 gives the tokens. Use them as `w-(--ad-inset-w) h-(--ad-inset-h)`.

## 6. Header

The component looks are in `component-system.md`: `TopBar` (C-17), `NavBar` (C-18), `Drawer` (C-19) and `SearchDialog` (C-20).

| Part | Width | Behavior |
| --- | --- | --- |
| Top bar | Full viewport, with the page gutter on each side | Sticky at all widths, with the nav row (DR-349) |
| Nav row | Shell | From 1280px only. Sticky with the top bar; past the nav row it slides up under the top bar and hides (DR-349, DR-357) |
| Drawer | From the left, full viewport height | Opens from the menu button at all widths |

- The top bar has three groups. The start group and the end group have the same flexible width, so the logo stays in the center at every width.
- Phones (below 768px): menu button at the start, logo in the center, language ("En") and the theme button at the end.
- From 768px (tablets, laptops, desktops): menu and search buttons at the start, logo in the center, language ("English") and the theme button at the end.
- The page chrome has no subscribe button (DR-170, DR-188). Prototype run 2 has no sign-up point. The newsletter section is the sign-up point in a phase after run 2 (DR-239).
- There is no sub-navigation row. Its items are in the drawer.
- The theme control has two states: light and dark. Light is the first state on every device; the system setting is not used (DR-201). After the reader selects a theme, keep the choice in local storage: key `fl-theme`, value `light` or `dark`. If storage is blocked, use light and keep the choice for this page only. An inline script in the head reads the key and sets the `.dark` class before the first paint. Open tabs follow a change (the storage event) (DR-340). The control is the theme button (ThemeButton) at every width (DR-349).
- The nav row shows only the items that fit in the shell. There is no "More" item. All items are in the drawer (DR-255).
- Edge icons: the 20px icon sits on the page gutter at every width. Inside the Drawer it sits on the 20px Drawer inset (DR-214).
- There is no rule between the top bar and the nav row. The nav row has a 1px rule at its bottom. When the top bar sticks alone, it shows its own 1px bottom rule, in both themes and at every width (DR-173, DR-295). When the page scrolls past the nav row (under 1280: once the page scrolls, DR-348), `<html>` gets `data-bar-stuck`; the top bar reads it through the `bar-stuck` variant (DR-287). Then the nav row slides up under the top bar and hides, and the logo scales down, both `--duration-slide` `ease-slide`; the nav row shows again only at the page top; no motion with reduced motion (DR-349, DR-357).
- A focus on a control in the stuck header does not scroll the page: the focusable elements of the site header get `scroll-margin-top: calc(-1 * var(--scroll-offset))` (DR-357, IMP-84).
- The top ad row is below the header: below the nav row from 1280, below the top bar under 1280, and above the hero (DR-295). The top bar is at the top of the viewport from the first paint and sticks there.
- At the page top the logo is 32px from 1024, 28px at 768 and 20px on phones. When the bar is stuck the logo is 24px (20px on phones). The bar height does not change; only the logo scales, so the page does not move (DR-295).
- The gap between the menu and search buttons is the same as the gap between the language link and the theme control (DR-295). Every top bar icon is 20px (DR-295).

| Token | Value | Use |
| --- | --- | --- |
| `--bar-height` | 56px; 64px from 1024 | Top bar height |
| `--nav-row-height` | 44px (45 with the 1px rule, DR-349) | Nav row height (from 1280) |
| `--scroll-offset` | rendered top bar height + 16px | `scroll-padding-top` on `html`, so anchors stop below the sticky bar. At 200% text the bar wraps to 2 lines; the offset follows the real bar height, not `--bar-height` (DR-265) |
| `--drawer-width` | 320px, or the viewport width minus 48px if smaller | Drawer width |

Drawer behavior:

- The drawer is the shadcn `Sheet` with `side="left"`, restyled (`CPT-16`, DR-228). It is a modal dialog. The page behind it is `inert` and does not scroll. `aria-hidden` on the page plus the focus trap of the shadcn primitive counts as `inert` (DR-348).
- When the drawer opens, focus moves to the drawer panel itself (`tabindex="-1"`), not to an item. The screen reader reads the drawer name, and no on-screen keyboard opens on phones (DR-249).
- Escape, the close button and a press on the backdrop close the drawer. The backdrop uses the `overlay` color.
- When the drawer closes, focus returns to the menu button.
- The drawer opens and closes with a slide from the start edge: `--duration-slide` (450ms), `ease-slide`, the one motion duration of the site (DR-280, DR-346, DR-357). With reduced motion, the drawer opens with no slide.
- A category with child items is an accordion (shadcn `Collapsible`). It opens and closes with a height animation, `--duration-slide` `ease-slide`; no motion with reduced motion (DR-349). All accordions are closed when the drawer opens, except the current category (DR-181).
- The current page has `aria-current="page"` and `interactive` text, like the nav row (DR-226).
- The social links are on a band pinned to the bottom of the drawer. The list above it scrolls (DR-182).

Search:

- From 768px (tablets, laptops, desktops), the search icon button is next to the menu button at the start. It opens a modal search panel (shadcn `Drawer` from the top, restyled, DR-280; focus goes to the panel itself, DR-249) with the search field and a Trending row. It opens and closes with a slide from the top: `--duration-slide`, `ease-slide` (DR-280, DR-346; replaces the no-animation rule of DR-227). One Tab from the panel reaches the field: the close button comes after the field group in the source (DR-348). Escape, the close button and a press on the backdrop close the dialog. Focus then returns to the search button.
- Below 768px (phones), the bar has no search icon. Search is the first item in the drawer (two steps: menu, then search).

## 7. Homepage

### 7.1 Page order

Decisions: DR-420.

| # | Row | Container |
| --- | --- | --- |
| 1 | Header | Full / shell |
| 2 | Top ad (DR-295) | Ad |
| 3 | P-1 Hero | Shell |
| 4 | Ad band | Ad |
| 5 | P-4 বিশ্লেষণ ও মতামত (analysis and opinion) | Panel band: full-width background, content in the shell (DR-264) |
| 6 | Ad band | Ad |
| 7 | P-2 Featured region (দক্ষিণ এশিয়া, DR-412) | Shell |
| 8 | Ad band | Ad |
| 9 | P-2 Featured category (ভূরাজনীতি) | Shell |
| 10 | Ad band | Ad |
| 11 | P-3 Grouped categories | Shell |
| 12 | P-5 Most read | Shell |
| 13 | Ad band | Ad |
| 14 | P-3b Regions | Shell |
| 15 | Footer | Full-width row (`surface-elevated`) with content in the shell |

### 7.2 Patterns

The section heading row is a component. It is not a pattern.

| Pattern | Structure | From 1024px | 600–1023px | Phone |
| --- | --- | --- | --- | --- |
| P-1 Hero | Wrapper: lead story, then two top stories. Rail: Latest, 5 items, one "more" link to the Latest page (DR-350) | Wrapper + rail | Lead and top stories full width. Latest below: 1 column at 600–767px, 2 columns column-first at 768–1023px (DR-125) | Lead, top stories, Latest, stacked |
| P-2 Featured category | Wrapper: feature story, text beside the image. Rail: one image story and two text stories | Wrapper + rail. Feature story: text at the start, 3:2 image at the end, 60% of the free width, 420 to 557px (DR-118). Rail image story: image on top (DR-121) | Rail below the wrapper. From 768px the feature story keeps text beside the image, image 50% of the free width (DR-119). At 600–767px the image is on top. Rail image story: text at the start, image at the end, 2 : 1 (DR-121) | Feature image, text, rail image story as a row, text stories |
| P-3 Grouped categories | One section. Rows of two categories. Inset ad between rows, at wrapper width. Rail: daily poll (DR-239) | Wrapper + rail | Two categories per row. Below the blocks: the poll as a full row (DR-134, DR-239) | A, B, ad, C, D, then the poll |
| P-3b Regions | All regions in one row of columns. Previous and next buttons in the heading row. One "আরও দেখুন" link at the section end | 4 regions in view from 1280px, 3 at 1024–1279px | 2 regions in view (DR-141) | Region tabs. One region in view |
| P-4 বিশ্লেষণ ও মতামত | Shell width. Two equal columns: analysis (image-led list) and opinion (quote list), gap `--space-analysis-gap` (32 / 48 / 64px, DR-356). No rail | Two columns | Two columns from 768px. Stacked at 600–767px | Stacked: analysis, then opinion |
| P-5 Most read | Top 5, full shell. RankedList (C-07): column-first, items 1 to 3 then 4 and 5, the column tops level; no rule, `--rank-list-gap` between items | Three equal columns from 1024px: the start column empty, the list in the middle and end columns | 2 list columns across the shell (from 600px) | 1 column |

The hero, featured category and grouped category sections use the same wrapper + rail layout. The rail is always 304px.

Every width shows the same sections in the same order. CSS changes only the layout. Hide nothing per device except the nav row, the slider buttons and the `ad-rail` slot under 1024, where the rail is not a column (DR-244; Analysis spec log AN-11; tajmin, 4 Nov 2026)

### 7.3 Sparse content

| Pattern | When content is missing |
| --- | --- |
| P-1 | One top story spans the wrapper. Latest shows the items that exist |
| P-2 | No rail stories: the wrapper spans the shell |
| P-3 | P-3 always has two category rows, so the `ad-rail` always shows from 1024, when the rail is a column (DR-243; Analysis spec log AN-11; tajmin, 4 Nov 2026). Odd number of categories: the last category keeps its size. The other half of the row stays empty |
| P-3b | All regions fit in view: no buttons (DR-140). A region with no stories is not shown |
| P-4 | One column is empty: the other column spans the shell |
| P-5 | Show the items that exist |

A section with no content is not shown. Its ad row is also not shown. Two ad rows are never next to each other.

### 7.4 Pattern details

The component sheets in `component-system.md` give the looks and sizes. This section gives the layout behavior.

**P-1 lead story.** The lead text panel overlaps the bottom of the lead image at every width (`LeadStory`, C-01). The panel uses the page color (`background`), so text never sits on the photo. The panel grows down, never up. Every hero story has an image (DR-91). The two top stories are `OverlapCard`s: the text block covers the image bottom and leaves a notch of image at the end side (DR-105, DR-109).

**P-4 বিশ্লেষণ ও মতামত.** The section is a panel band (Section 5.3, DR-264): the `surface-elevated` background spans the full viewport width; the content stays in the shell (page gutter at the sides, 1280px maximum). This color differs from the page background and from the ad rows (`surface-alt`). Only the opinion column has a label chip ("মতামত", brand fill, not a link, DR-112). The analysis column has no chip. Each column has its own "আরও দেখুন" link below its last item (`LAY-18`). Both columns align to the top and end where their content ends. Analysis is the left column. The section name is "বিশ্লেষণ ও মতামত", so the name follows the column order. Put `space-module` before and after the section, outside the background, as margin (`LAY-12`, DR-205). The background uses the panel inset (Section 5.3, `LAY-20`, DR-224). From 768 a 1px column rule (Divider.column-inset, 16px from the top and the bottom) sits in the middle of the existing column gap between analysis and opinion; the gap does not change (DR-351).

**P-3b Regions slider.** From 600px:

- The region panels are in one scroll-snap row (`@utility region-row`, Section 12.3). A button press scrolls the row one region (column width + gap): the scroll position animates over `--duration-slide` (450ms) with `--ease-slide` (DR-227, DR-284). Do not use a transform: native scrolling keeps swipe and keyboard focus working.
- The previous and next buttons are in the heading row, at the end. They show when more regions exist than are in view (DR-140). At each end, the button for that direction is disabled (`aria-disabled`, so focus stays). No loop and no autoplay. Swipe works. The scrollbar is hidden.
- The button colors change over 200ms. With reduced motion there is no transition and no animated scroll (DR-151).
- All regions are in the HTML, so the keyboard reaches every link.
- The buttons have the names "আগের অঞ্চল" and "পরের অঞ্চল".
- One "আরও দেখুন" link to the regions page is at the section end (DR-142, DR-160). The region panels have no link of their own.

Below 600px, the regions are tabs (`tablist`, arrow keys, `aria-selected`). The tabs are outline chips; the selected chip has the interactive fill (DR-140). A chip is as wide as its label and 44px tall or more. The selected chip scrolls into view. One region panel shows. A chip press fades the current panel out, then fades the new panel in, each over `--duration-slide`, `ease-slide`; opacity only, nothing moves (DR-346: one motion duration). With reduced motion the panel changes at once (DR-284).

**P-3 rail: daily poll.** In prototype run 2 the rail holds the daily poll only (`DailyPoll`, C-26, DR-239): heading, one question, 2 to 4 options, a vote button, then the results as one bar per option. One vote per browser. Mock data. No section divider (DR-128). It never uses the ad label or ad colors. It has no panel: it sits on `background` with no inset, like every section (DR-273). From 1024px the poll is at the top of the 304px rail. From 1024px the `ad-rail` slot is `space-module` below it (Section 9, DR-240, DR-242; Analysis spec log AN-11; tajmin, 4 Nov 2026). Below 1024px it takes the full row below the blocks, with the question at the start and the options at the end. From 1024 a 1px column rule (Divider.column-inset) sits in the middle of the column gap between the wrapper and the rail; there is no rule between category blocks (DR-351).

**Newsletter (after prototype run 2).** `NewsletterSignup` (C-14) is paused for run 2 and comes in a later phase (DR-239). Its spec stays: heading, one line of text, email field with an attached button, privacy link, and error, sending and done states (DR-129 to DR-137, DR-229). In that phase it is at the top of the rail with `space-rail-modules` between it and the poll; at 600–1023px it is a full row with the heading on top, then the text line and the form side by side (DR-135).

**Footer.** The footer is provisional (`Footer`, C-21, DR-193). It is a full-width `surface-elevated` row with the panel inset (Section 5.3) and the content centered in the shell: logo, social links, and links to About, Contact, Corrections, Privacy and Terms. Each social link has a text name for screen readers. All labels are in the page language.

## 7A. Article page

The article page (`/story/<slug>-<id>`, `ReaderPage`; Section 7C) is defined from the accepted article page spec log, checkpoint 1 (DR-385). The code on the article branch is the reference. The page tokens are in `src/styles/reader.css`, scoped under `.rd`. Component looks are in `component-system.md` (C-27 to C-42).

### 7A.1 Page order

| Row | Container | Content |
| --- | --- | --- |
| Site header | As on the homepage | `TopBar`, `NavBar` (C-17, C-18), unchanged. Section links point to `/#…` or `/en#…` (DR-331) |
| `ad-top` | Ad container | As on the homepage (Section 9) |
| Heading | `--rd-wrap`; text in the reading column, centered | `ArticleHeader` (C-27) |
| Lead image | `--rd-wide` | `LeadMedia` (C-29); the caption is in the reading column |
| Byline | `--rd-wrap`; reading column | `Byline` (C-28), then `PreferredSourceAlert` (C-32) |
| Body | `--rd-wrap`; reading column, rail beside it from 1280 | `KeyPoints` (C-30), `ArticleBody` (C-33) with `ContextCard` (C-31), figures and `ad-inline`; a 1px rule, then `Tags` (C-34) |
| `ad-band` | Ad container | One band after the article (`LAY-09`) |
| Read next | `Shell` (`measure-shell`) | `ReadNext`: `SectionHeading` (C-13) and `StoryCard` (C-24), 3 per row from 1024 (Section 3.3) |
| Footer | As on the homepage | `Footer` (C-21) |

`ReadingTools` (C-35) is the rail from 1280 and the dock below 1280 (Section 7A.6). `SelectionShare` (C-41) and `Toaster` (C-42) are page-level.

### 7A.2 Widths

The article page has its own gutter and two containers (DR-386, a stated exception to `LAY-01`, `LAY-02` and `LAY-03`).

| Token | Value | Use |
| --- | --- | --- |
| `--rd-gutter` | `clamp(16px, 4.5vw, 44px)` | Page gutter of the article page, and the dock's side padding |
| `--rd-wrap` | `min(1240px, 100% - 2 * var(--rd-gutter))` | Heading, byline and body rows |
| `--rd-wide` | `min(1400px, 100% - 2 * var(--rd-gutter))` | Lead image row |
| Reading column | `measure-reading-en` 44rem, `measure-reading-bn` 42rem | Heading text, caption, byline, body. Centered (`LAY-04`, `TYP-12`) |
| Rail | `min(12.5rem, 100%)` | Contents and reading tools, from 1280 |

From 1280, the body row is a grid of three tracks: `minmax(0, 1fr)`, the reading column, `minmax(0, 1fr)`, with `--grid-column-gap`. The rail is at the start of the first track. The body is in the middle track, in the same place as without the rail. The source order is rail, then body (`LAY-14`). Below 1280, there is no rail.

Every block in the body takes the full reading column width.

### 7A.3 Spacing

| Between | Value |
| --- | --- |
| `ad-top` and the heading | `space-page-start` (on the heading, `LAY-12`) |
| Category row and title | `--rd-head-eyebrow-title`: `--space-lead-eyebrow-title` + 4px = 12px, every width (DR-386) |
| Title and deck | `--rd-head-title-deck`: `--space-story-title-summary` + 4px = 12px, every width (DR-386) |
| Deck and metadata line | `space-list-item` |
| Heading and lead image | `--rd-head-deck-media` = `space-module` (DR-386) |
| Lead image and caption | `space-media-caption` |
| Caption and the byline rule | `space-module` |
| Byline rule and byline | `space-list-item` |
| Byline, `PreferredSourceAlert`, `KeyPoints`, body | `space-module` |
| Before an `h2` in the body | `space-module`; after it `space-section-title-after` |
| Around a figure and around `ContextCard` | `space-module` |
| Panel heading and panel content (`KeyPoints`, `ContextCard`) | `space-section-title-after` |
| Around an `ad-inline` slot | `space-module` on the paragraphs before and after it. The ad row has none (`LAY-09`, `LAY-12`) |
| Body and the end rule; end rule and `Tags` | `space-module` on each side of the rule (as `Divider`, C-22) |
| Article and `ad-band` | `space-section` on the article (`LAY-12`) |
| `ad-band` and Read next | `space-module` on Read next (`LAY-12`) |
| Read next and the footer | `space-section` (as the last homepage section) |
| Paragraphs | 1.1em (`typography-system.md` Section 7.2) |

Other one-component values are 4px scale steps in `reader.css` (`calc(var(--spacing) * n)`, half steps allowed, `LAY-21`).

### 7A.4 Panel inset in the reading column

`PreferredSourceAlert`, `KeyPoints` and `ContextCard` use `--rd-panel-inset`: 1.5rem (24px) on every side, at every width. It replaces the `panel-inset` utility for panels in the reading column, which is sized for page bands (DR-386, a stated exception to `LAY-20`). The panels have no border (`CPT-06`).

### 7A.5 Lead image and body images

- Editors upload a landscape lead image of any ratio. The lead image is required.
- The lead image keeps its own ratio. It is centered in `--rd-wide` and as tall as it can be up to `--rd-lead-media-max` (32rem). Its width follows from its height. It is never cropped, stretched or wider than its container (`LAY-02`).
- A body image takes the full reading column width at its own ratio. It is never cropped. Its placeholder background is `surface-alt`.
- Do not use viewport height units (`dvh`, `svh`) for media (DR-386).

### 7A.6 Reading tools, sticky and fixed parts

These parts are the stated exceptions to `LAY-15` (DR-386). Their layers are in Section 10.

| Part | Position | When |
| --- | --- | --- |
| Reading rail (`ReadingTools` layout `rail`, with `Toc`) | Sticky, `top`: bar height + 36px | From 1280 |
| Reading dock (`ReadingTools` layout `dock`) | Fixed to the bottom edge, full width, `surface-elevated`, 1px `border-soft` top rule. Bottom padding adds `env(safe-area-inset-bottom)` | Below 1280, after the reader starts reading |
| `SelectionShare` bar | Fixed, above the selected text | While text in the article is selected |
| `Toaster` | Fixed, bottom center | For a short time after an action |

No ad is sticky or fixed (`LAY-11`).

### 7A.7 Motion

- One duration for slides and fades: `--duration-slide` with `--ease-slide` (DR-357). Color changes use `--default-transition-duration` (200ms).
- On load, the heading parts, the lead image and the byline rise 18px and fade in (DR-386).
- A popover rises 6px and scales from 0.97. The selection bar fades in. The toast fades in and rises 16px. The dock slides in from the bottom edge. The contents marker glides between items.
- A reader size change eases the body text to its new size (`typography-system.md` Section 4).
- With reduced motion, nothing animates and no transition runs.

### 7A.8 Print

Print hides the dock, the rail, the `PreferredSourceAlert` row, Read next and the toast (DR-386).

## 7B. Category page

The category page (`/category/<id>`, `/en/category/<id>`, `CategoryPageView`) is defined from the green items of the category page spec log (CL-01 to CL-08, CL-19, CL-20). One template serves the 5 categories (Section 7C); the 10 pages are built at build time and an unknown id is a 404 page. The most read `columns` layout is in the C-07 sheet (CL-10 to CL-12, CL-18, CL-21, CL-22; tajmin, 27 Oct 2026). The page title is C-43 `PageTitle`; the More stories item is StoryCard `dated` (C-24). Every item of that log is decided (tajmin, 27 Oct 2026).

### 7B.1 Page order

Decisions: DR-419, DR-436.

| Row | Container | Content |
| --- | --- | --- |
| Site header | As on the homepage | `TopBar`, `NavBar` (C-17, C-18), unchanged. The category items link to the category pages; the open category is the current item (C-18, C-19) |
| `ad-top` | Ad container | As on the homepage (Section 9) |
| Page title | `Shell` | `PageTitle` (C-43): the category name, the page `h1`, in the `surface` band (full width, the content in the shell, first row of `main` under `ad-top`); space-module below |
| `CategoryFeatureSection` | `Shell`, `WithRail` | A hidden `h2` names the section. Wrapper: the feature story as an `OverlapCard` (C-02, `feature`, no eyebrow), then 3 card rows (`CategoryCardList`). Rail: `SectionHeading` and the 5 newest stories after the feature story as a `StoryList` (C-03 of C-25) |
| `ad-band` | Ad container | After `CategoryFeatureSection` |
| `CategoryFormatsSection` | `Shell`, `WithRail`: the wrapper column; the rail stays empty | The analysis and opinion row (DR-415): one row of two CategoryBlocks (C-23), Analysis always at the start, Opinion always at the end, fixed halves (DR-436); 1 per row on phones, 2 from 600 (`LAY-07`). Up to 5 stories per block. `space-module` above (after the ad band, `LAY-12`), `space-section` to Most read |
| Most read | `Shell` | The top 5 of the category: `MostReadSection` with RankedList (C-07), as on the homepage |
| `ad-band` | Ad container | After most read |
| `MoreStoriesSection` | `Shell`, `WithRail`: the wrapper column; the rail stays empty | `MoreStoriesList`: the older stories as StoryCard `dated` (C-24), Divider.item between them, 10 at a time; Divider.rule (C-22) and the load more `Button` |
| Footer | As on the homepage | `Footer` (C-21) |

### 7B.2 Patterns

- **CategoryFeatureSection.** Laid out as HeroSection: from 1024 the rail is beside the wrapper; below 1024 it goes under the whole wrapper (`LAY-05`). With no rail stories the wrapper spans the shell (Section 7.3, DR-271).
- **Card rows.** `StoryCard` (C-24) row, 16:9 image at the end, text : image = 2 : 1, with the summary; `Divider.item` between the rows, measured to the image top (DR-268, DR-350). One per row at every width (`LAY-07`, DR-409).
- **Formats.** The main stream is news only: the feature story, the rail and the card rows. Analysis and opinion have their own row, `CategoryFormatsSection`, directly above Most read, up to 5 of each, newest first. More stories lists the news and analysis that no section above shows, never opinion, newest first. No story shows twice on the page (DR-415, replaces DR-408).
- **No Eyebrow.** No card on the page shows the Eyebrow: the page title names the category (DR-153). One exception: an analysis row in More stories shows the C-08 `format` Eyebrow above the title at every width (DR-415, category formats spec log CF-07).
- **Spacing.** `main` starts with the title band (in place of `space-page-start`, as 7D.2) and ends with `space-section`. The space before an ad band belongs to the section above it (`space-module`), and the section after an ad band starts with `space-module` (`LAY-12`).
- **Load more.** A list shows 10 stories. Each press of the C-12 primary `Button` adds the next 10 and moves focus to the title link of the first added story. The button goes when no stories are left (`COL-13`). The added rows fade in (opacity, `--duration-slide`, `ease-slide`, no stagger; nothing moves), and the story image of an added row fades in when it has loaded; lazy loading stays. The first rows do not animate. No motion with reduced motion (DR-227). The added rows show the reader story time at once (`TYP-17`). Component CSS: `component-system.md` Section 6 (Latest spec log LT-03, LT-04; tajmin, 28 Oct 2026).

### 7B.3 Sparse content

A section with no stories is removed with its ad band (Section 7.3, `LAY-13`). In `CategoryFormatsSection` the halves are fixed: an empty block is not shown and leaves its own half empty; the other block keeps its size and its place (Analysis at the start, Opinion at the end). On phones, one block per row, the empty half takes no row. With both empty the row is removed (DR-436). The blocks show what the category has: no fill-in.

## 7C. URLs

These rules apply to every page (DR-397, DR-399, DR-401, DR-410 to DR-414, DR-418). Bangla is at the root; English adds `/en` in front of every path (`AGENTS.md` Section 7).

### 7C.1 Path rules

- Use lowercase Latin letters, digits and hyphens. Do not add a trailing slash, a date or a category to an article path.
- One slug serves both languages. The Bangla page uses the English slug. The backend makes the slugs.
- A bare root (`/story`, `/topic`) gives a 404.

### 7C.2 Paths

| Page | Path | Notes |
| --- | --- | --- |
| Article | `/story/<slug>-<id>` | Every format (news, analysis, opinion). `<id>`: 6 to 8 base36 characters, fixed, shared by both languages. The page finds the article by `<id>`. A wrong or old slug gets a 301 to the current URL. An unknown `<id>` gives a 404 |
| Category | `/category/<slug>` | `geopolitics`, `security`, `history`, `economy`, `technology`. Sub-category: `/category/<parent>/<slug>`, two levels at most. Bangladesh is not a category (DR-412) |
| Region hub | `/regions` | All regions |
| Region | `/regions/<slug>` | The backend owns the list and the order. Working list: `americas`, `europe`, `russia`, `middle-east`, `south-asia`, `china`, `asia`, `oceania`. Code works with any number of regions (DR-411) |
| Topic | `/topic/<slug>` | Flat. One key, one Latin slug, a bn and an en label. Do not use the word "tag" (DR-410). The page: Section 7E |
| News hub | `/latest` | News only |
| Analysis hub | `/analysis` | বিশ্লেষণ / Analysis. Flat, no sub-hubs. Analysis only. The page: Section 7F |
| Opinion hub | `/opinion` | মতামত / Opinion. Flat |

There is no `/opinion/<slug>-<id>`, `/insight`, `/voices` or `/op-ed` path (DR-302, DR-413, DR-414). A path whose page is not built yet gives a 404 until its page branch (IMP-18).

### 7C.3 Formats

The formats are news, analysis and opinion (DR-414). There is no explainer or op-ed format. The format is in the content model and the page presentation, not in the URL.

### 7C.4 Missing translation

When an article is missing in the other language, do not emit an hreflang to that language. The language switch goes to the article's category page in the other language, with a short note ("This story is in Bangla only"). The note text is in `bn.ts` and `en.ts` (DR-401).

## 7D. Latest page

The Latest page (`/latest`, `/en/latest`, `LatestPageView`) is the news hub of Section 7C.2 (row News hub: news only). Defined from the Latest spec log LT-01 (tajmin, 28 Oct 2026). The page is built at build time for bn and en.

### 7D.1 Page order

| Row | Container | Content |
| --- | --- | --- |
| Site header | As on the homepage | `TopBar`, `NavBar` (C-17, C-18), unchanged. Latest is not a nav item, so no item is current |
| `ad-top` | Ad container | As on the homepage (Section 9). The page has no `ad-band` |
| Page title | `Shell` | `PageTitle` (C-43): সর্বশেষ / Latest, the page `h1`, in the `surface` band, as on the category page; `space-module` below |
| `MoreStoriesSection` | `Shell`, `WithRail`: the wrapper column; the rail stays empty | The More stories list of 7B, `MoreStoriesList` (StoryCard `dated`, C-24; Divider.item; Divider.rule and the load more `Button`), with the C-08 `category` Eyebrow on every row: the page mixes categories (DR-153 does not apply). The page `h1` names the list; it has no heading of its own, so the titles are `h2` |
| Footer | As on the homepage | `Footer` (C-21) |

### 7D.2 Content and load more

- Every news story of every category, newest first. No analysis, no opinion, no region-only news (tajmin, 28 Oct 2026).
- 10 stories first, then 10 per press, as 7B.2 Load more, with its motion and story time.
- `main` starts with the title band (in place of `space-page-start`) and ends with `space-section`.

### 7D.3 Sparse content

With no news the list is not shown (Section 7.3). With 10 stories or fewer there is no Button.

## 7E. Topic page

The topic page (`/topic/<slug>`, `/en/topic/<slug>`, `TopicPageView`) is the Topic row of Section 7C.2. Defined from the Topic spec log TP-01 to TP-03 (tajmin, 29 and 30 Oct 2026). The pages are built at build time for every topic in bn and en; an unknown slug gives a 404 page (7C.1).

### 7E.1 Page order

As the Latest page (7D.1), with these differences:

| Row | Container | Content |
| --- | --- | --- |
| Site header | As on the homepage | `TopBar`, `NavBar` (C-17, C-18), unchanged. No item is current. The language link keeps the topic |
| `ad-top` | Ad container | As on the homepage (Section 9). The page has no `ad-band` |
| Page title | `Shell` | `PageTitle` (C-43): the topic label, the page `h1`, in the `surface` band. No label above it (tajmin, 30 Oct 2026); `space-module` below |
| `MoreStoriesSection` | `Shell`, `WithRail`: the wrapper column; the rail stays empty | `MoreStoriesList` (StoryCard `dated`, C-24; Divider.item; Divider.rule and the load more `Button`), named by the `h1`, `h2` titles. The C-08 Eyebrow in `format` mode on every row: a news row shows its category, an analysis row বিশ্লেষণ / Analysis (DR-417; tajmin, 30 Oct 2026). DR-153 does not apply: the page mixes categories |
| Footer | As on the homepage | `Footer` (C-21) |

### 7E.2 Content and load more

- The news and analysis stories of the topic, newest first, no repeats. No opinion (tajmin, 29 Oct 2026). A story carries its topics; the article Topics (C-34) show the same topics (DR-410).
- 10 stories first, then 10 per press, as 7B.2 Load more, with its motion and story time.
- `main` starts with the title band and ends with `space-section`, as 7D.2.
- A topic page with fewer than 3 stories is `noindex, follow` (robots meta); from 3 stories it sets no robots rule (DR-432).
- The list pages (category More stories, Latest, topic) use load more, not `?page=` URLs (DR-432).

### 7E.3 Sparse content

As 7D.3: with no news or analysis the list is not shown; with 10 stories or fewer there is no Button.

## 7F. Analysis hub

The analysis hub (`/analysis`, `/en/analysis`, `AnalysisPageView`) is the Analysis hub row of Section 7C.2. Defined from the Analysis spec log AN-01, AN-02, AN-04, AN-08, AN-10 (tajmin, 2 to 4 Nov 2026). The page is built at build time for bn and en. It should stand out from the news hub (7D).

### 7F.1 Page order

| Row | Container | Content |
| --- | --- | --- |
| Site header | As on the homepage | `TopBar`, `NavBar` (C-17, C-18). বিশ্লেষণ / Analysis is the current item in the NavBar and the Drawer (C-18, C-19) |
| `ad-top` | Ad container | As on the homepage (Section 9) |
| Page title | `Shell` | `PageTitle` (C-43): বিশ্লেষণ / Analysis, the page `h1`, in the `surface` band, with `PageTitle.description` below the title (C-43; ফ্যাক্ট লেন্স টিমের বিশ্লেষণ, ব্যাখ্যামূলক প্রতিবেদন ও বিস্তারিত ফিচার / In-depth analysis, explanatory journalism and long-form narratives by Fact Lens Team); `space-module` below |
| `AnalysisHeroSection` | `Shell`, no rail | The newest analysis story: StoryCard (C-24) `row-from-md`, 3:2, `feature` split with `story-split-lead` (text : image = 1 : 2, no image cap), size `lead`, the C-08 `category` Eyebrow (DR-417), summary, meta, eager image (DR-325). Image first under 768; from 768 the text at the start and the image at the end. A hidden `h2`, the title an `h3` |
| Rule | `Shell` | Divider.rule (C-22), `space-module` on each side. Only when the mosaic follows the hero |
| `AnalysisTopSection` | `Shell`, `WithRail` | Wrapper: the next 4 stories as OverlapCard (C-02, the C-08 `category` Eyebrow) in a PeerRow, 1 per row below 600, 2 from 600 (LAY-07), each card flows on its own (DR-99); `--space-analysis-top-row-gap` between the rows. A hidden `h2`. Rail: AdSlot `rail`, from 1024 as on every page (Section 9); below 1024 the Rail is not drawn. Divider.column-full between the wrapper and the rail from 1024 (C-22). `space-module` before the `ad-band` (LAY-12) |
| `ad-band` | Ad container | As on the homepage (Section 9) |
| `MoreStoriesSection` | `Shell`, `WithRail`: the wrapper column; the rail stays empty | As on the category page (7B): its SectionHeading আরও পড়ুন / More stories, `MoreStoriesList` (StoryCard `dated`, C-24, `h3` titles), the C-08 `category` Eyebrow on every row (DR-417; DR-153 does not apply). `space-module` above, after the ad row (LAY-12) |
| Footer | As on the homepage | `Footer` (C-21) |

### 7F.2 Content and load more

- Every analysis story, newest first, no repeats. No news, no opinion. The hero is the newest, the mosaic the next 4, More stories the rest. Whether the hero and the mosaic are editor picks or the newest is not decided; the newest stands in (tajmin, 2 Nov 2026).
- More stories: 10 first, then 10 per press, as 7B.2 Load more, with its motion and story time.
- `main` starts with the title band and ends with `space-section`, as 7D.2. No robots rule.

### 7F.3 Sparse content

- 0 stories: the title band, then a no-content message (DR-440). Its part and strings are not defined yet (U-61).
- 1 story: the hero only; as the last row it adds no space.
- 2 to 5 stories: the mosaic shows what there is (1 to 4 cards); no `ad-band`, no More stories (Section 7.3, LAY-13).
- No mosaic stories but list stories: the `ad-band` follows the hero (`space-module` before it); no rule.
- With 10 list stories or fewer there is no Button.

## 8. Peer rows

A peer row is a row of cards with equal rank.

- Use one card variant per peer row.
- Align the card parts across the row with `grid-template-rows: subgrid`.
- When a card has no part (for example, no summary), that row of the subgrid stays empty.
- The card variants are in `component-system.md` (`OverlapCard`, `StoryCard`, `StoryListItem`).
- The two top stories in the hero are not a peer row. Each `OverlapCard` flows on its own: no subgrid. The cards align to the top and can end at different heights (DR-99).
- In P-5, item 5 is alone on row 2 on purpose.

## 9. Ads

This section is the full ad system: slots, sizes, loading and serving. Sizes follow the IAB fixed-size portfolio. Density follows the Better Ads Standards.

| Slot | Where | Phone and 600 | 768 | From 1024 | Reserved height |
| --- | --- | --- | --- | --- | --- |
| `ad-top` | Below the header (below the nav row from 1280), above the hero (DR-295) | 320×100 or 320×50 | 728×90 | 970×250, 970×90 or 728×90 | 100 / 90 / 250 |
| `ad-band` | After the hero, Opinion, each featured category and Most read | 336×280 (from 336px), 300×250 below 336px | 728×90 (DR-315) | 970×250, 970×90 or 728×90 | 280 / 90 / 250 |
| `ad-inset` | Between category rows in P-3, at wrapper width. No full-width row. Full screen width under 332px | 300×250 | 300×250 | 300×250; 728×90 from 1280 | 250; 90 from 1280 |
| `ad-rail` | Any rail: the homepage P-3 rail, below the poll (DR-240); the analysis hub mosaic rail (7F). Article pages later | – | – | Whenever the rail is a column beside the wrapper: from 1024 (`WithRail`, LAY-05), on every page (Analysis spec log AN-11; tajmin, 4 Nov 2026). 300×600 or 300×250 (DR-241) | 600 from 1024 |
| `ad-inline` | Article body, between two paragraphs (`LAY-22`) | 300×250 | 300×250 | 300×250 | 250 |

- The slot names follow the `AdSlot` variants: `ad-top` is `variant="top"`, `ad-band` is `variant="band"`, `ad-inset` is `variant="inset"`, `ad-inline` is `variant="inline"` (DR-162, DR-197, DR-387).
- The article page has one `ad-top`, the `ad-inline` slots in the body and one `ad-band` after the article. The `ad-inline` box is 300×250 at every width, centered in the reading column, `max-width: 100%`. In Phase 1 mock data, it uses the `ad-inset` creative (DR-387).
- Serve the 336×280 creative only when the viewport is 336px or wider. Below 336px, serve 300×250 only (DR-206, DR-256). The reserved height stays 280, because the reserved height changes only at the breakpoints (`LAY-10`, DR-206).
- When the viewport is narrower than 332px, the `ad-inset` box uses the full screen width, like an ad band. 332px is the 300px creative plus two 16px gutters (DR-207).
- Ad rows and the `ad-inset` box use the `surface-alt` background. The label is `ink-muted`. The color is only behind the creative and the label; there is no padding.
- An ad row is the reserved creative height plus a 24px label line ("Advertisement" or "বিজ্ঞাপন"). The label uses `type-eyebrow`, which needs about 20px in Bangla.
- Ad rows have no padding, margin or gutter at any width.
- No ad is sticky or fixed at any width.
- The homepage has 3 `ad-inset` slots or fewer. Rows after the third inset have no ad between them.
- Place one `ad-inset` between rows of category blocks: after every row but the last, 3 or fewer (DR-348; on phones one block is a row, so A, B, ad, C, D). Do not place one after a row that has only text stories. The server sets the count; there is no run-time height check (DR-276).
- The homepage has one rail ad: `ad-rail` in the P-3 rail, below the poll, from 1024, when the rail is a column (DR-240; Analysis spec log AN-11; tajmin, 4 Nov 2026). Under 1024 there is no rail ad. It is `space-module` below the poll (DR-242). The 300×250 creative sits at the top of the 600 reserve (DR-241).
- Under 768, ad space is 30% of the main content height or less: the total ad height divided by the main content height (Better Ads Standards, mobile ad density; DR-447). The phone estimate is approximately 20%.
- From 768 there is no hard ad density limit. Ads above the first screen must not push the first content of the page (the first story or the article title) below the first screen (DR-447).
- Phase 1: static images from direct-sold networks, no timed refresh. Phase 2: programmatic fill (Google Ad Manager) in the same slots.

### 9.1 Loading and empty slots

- Reserve the creative height in CSS (`min-height`) for each tier. Do not set the height in JavaScript.
- Request every size listed for the slot and the tier.
- Load `ad-top` first. Never lazy-load `ad-top`. Lazy-load all other slots.
- The `ad-rail` slot is in the HTML at every width and hidden under 1024. Lazy-load does not request a hidden slot (DR-244; Analysis spec log AN-11; tajmin, 4 Nov 2026)
- Phase 1: when no campaign is booked for `ad-top`, the server leaves the band out of the page. The server knows the bookings before it builds the page, so nothing moves after load (DR-250). When a campaign is booked, `ad-top` never collapses.
- Phase 2: what `ad-top` shows when Ad Manager has no fill (house ad) is decided with Phase 2 (ADS-09).
- When another slot has no ad before it nears the viewport, collapse the whole row, label included.
- Do not put an ad inside a peer row, a story list or an article block. In the article body, `ad-inline` goes between two paragraphs only (`LAY-22`).
- Ads never look like story cards. Editorial boxes (newsletter, poll) never look like ads.
- Do not use pop-ups, prestitials, countdown postitials, scrollovers, flashing creatives or video that plays sound on its own.

### 9.2 Phase 1: static ads

- The advertiser supplies one image per tier: 970×250 or 728×90 from 1024, 728×90 at 768, 320×100 (`ad-top`) or 300×250 (`ad-band`) on phones. An `ad-inset` booking needs 728×90 and 300×250. Ask for 2× files.
- Use one `<picture>` with a `<source>` per tier. Give the image `width` and `height`. The browser loads only the file for the current tier.
- Use WebP or AVIF with a JPEG or PNG fallback. Keep the IAB weight limits: 150 kB for 300×250 and 728×90, 250 kB for 970×250, 50 kB for 320×50.
- Link the image to the advertiser with `rel="sponsored noopener"` and `target="_blank"`. Give it alt text that names the advertiser.
- When a slot has more than one booking, pick one per page load. Do not refresh.
- Count an impression when 50% of the ad is in view for 1 second (MRC viewability standard). Count clicks.
- In the prototype, ads come from mock JSON, like the stories. Each entry has slot, advertiser, link, dates and one image per tier.

### 9.3 Phase 2: Google Ad Manager

- Use Google Ad Manager with Google Publisher Tag in the same slots. Direct-sold campaigns use the same slots.
- Map the tiers to the breakpoints with GPT size mapping. Use Single Request Architecture.
- Lazy load: fetch at 5 viewports, render at 2, double both on phones.
- Refresh only a viewable slot, once every 30 seconds or less often. Declare the refresh in Ad Manager.
- Deferred until after launch: native units in story lists, takeovers, page skins, header bidding.

## 10. Layers

Decisions: DR-393.

| Token | Value | Use |
| --- | --- | --- |
| `--z-content` | 0 | Content and ads |
| `--z-bar` | 30 | Sticky top bar |
| `--z-overlay` | 50 | Drawer, search dialog and their backdrop (DR-228) |
| `--z-dock` | 55 | Article reading dock (DR-386) |
| `--z-popover` | 70 | Article popovers (text size, more tools) (DR-386) |
| `--z-selection` | 80 | Article selection bar (DR-386) |
| `--z-toast` | 90 | Toast messages (DR-386) |

Inside one component, a local `z-index: 1` may lift a part over its sibling (the contents marker, the selection bar buttons).

## 11. Rules

### LAY-01 Use only the tokens in this document

Use the tokens in this document or a Tailwind spacing scale class (`LAY-21`). Do not type a raw value (`p-[22px]`). Add a token here only when two or more components share a value, or when the value is not a scale step.

Exception: the article page widths in Section 7A.2 replace `--gutter-page` and `measure-shell` for the heading, lead image and body rows (DR-386).

### LAY-02 Keep content inside its container

Do not break out of a container. Do not use `vw` units for layout. A full-width background is a full-width row.

Exception: the article page gutter and containers (Section 7A.2, DR-386).

### LAY-03 Use the full shell for homepage sections

Every homepage section uses `measure-shell`. Do not use `measure-content` on the homepage.

### LAY-04 Separate container width and line length

Layout sets container widths. Typography sets line length caps with `max-inline-size` in rem. Do not use `ch`.

### LAY-05 Use the fixed rail

A section with a rail uses `measure-rail` (304px). The wrapper takes the remaining width. The rail goes below the wrapper under 1024px.


The first prototype uses only the fixed 304px rail. If the rail looks too tight, a later prototype can test the 8+4 split (DR-35).

### LAY-06 Do not add a 2xl tier

Values stop changing at `lg` (spacing) and `xl` (layout). From 1366px, nothing changes.

### LAY-07 Use the agreed cards per row

Homepage peer rows: 1 below 600px, 2 from 600px. The homepage has no 4-up rows. Other pages use 3 from 1024px, except the category page: its card rows and More stories show 1 per row at every width (Section 7B; DR-409 amends DR-44).

Two homepage parts are not peer rows and have their own counts: Most read (`RankedList`, C-07) has two list columns from 600px, in the middle and end of three columns from 1024px (amends DR-51, DR-145). The regions slider (`RegionSlider`) shows 4 region panels from 1280px (DR-140).

### LAY-08 Use one card variant per peer row

Align card parts with subgrid. A missing part leaves an empty subgrid row. Do not stretch other parts to fill it. The hero top-story pair is the exception: each card flows on its own (DR-99).

### LAY-09 Make ad rows full width with no spacing

Ad rows use the ad container. Center the creative. Do not add padding, margin or gutter.

### LAY-10 Reserve the ad height

Reserve the slot height for the current breakpoint before the ad loads. The layout must not shift (CLS).

### LAY-11 Do not make ads sticky

No ad is sticky or fixed at any width.

### LAY-12 Put section-to-ad space on the section

The section owns `space-module` before and after an ad row. The ad row has no spacing of its own.

### LAY-13 Do not show two ad rows together

When a section is hidden, hide its ad row. Two ad rows are never next to each other.

### LAY-14 Keep the source order equal to the reading order

The DOM order is the phone order. Do not use CSS `order` to change the reading order.

### LAY-15 Make only the site header sticky

The site header is sticky: the top bar and, from 1280, the nav row. Past the nav row, the nav row hides under the top bar; it shows again at the page top (DR-349). Use the layer tokens in Section 10.

Exceptions on the article page (Section 7A.6, DR-386): the reading rail is sticky from 1280; the reading dock, the selection bar and the toast are fixed.

### LAY-16 Use the same geometry in both languages and both themes

Bangla and English use the same containers and spacing. Dark mode changes color only.

### LAY-17 Do not set a fixed height on text containers

Text containers grow with the text. This is necessary for Bangla, zoom and the reader sizes A+ and A++.

Exception: the NavBar item list is one row tall (`max-height: var(--nav-row-height)`, overflow hidden). Items that do not fit are hidden whole, never cut (DR-255, DR-359). The row height is in rem, so it grows with the reader text size.

### LAY-18 Put the "see more" link below its block

Put one "আরও দেখুন" link at the end of each section, below the wrapper and the rail (`CPT-14`). In বিশ্লেষণ ও মতামত, each column has its own link. Align the link to the end edge (`CPT-15`). Put `space-more-link` above it. Do not put it in the section heading row. Most read has no link. Latest has one link to the Latest page (DR-350).

### LAY-19 Write ad sizes in px tokens

Give ad slots their width and reserved height from the `--ad-*` tokens in Section 12.2 (`w-(--ad-inset-w)`). Do not write ad sizes in rem or as scale classes. A creative image does not grow with the text size (DR-233).

### LAY-20 Use the panel inset in a colored panel

Give every colored panel the `panel-inset` utility (Section 5.3). Do not type a panel padding in a component (DR-224). A panel band uses the block values only; its content is in the shell (DR-264).

Exception: a panel in the article reading column uses `--rd-panel-inset` (Section 7A.4, DR-386).

### LAY-21 Use the 4px scale for one-component values

Spacing and sizes use the Tailwind scale: one step is 4px (`--spacing: 0.25rem`), with 2px half steps (`px-3.5`, `py-0.5`, `size-6.5`). Write a value that one component uses as the scale class in that component, for example `gap-7` or `min-h-13`. Use a named token only when two or more components share the value, or when the value is not a scale step (`clamp()`, `cqi`). Do not use arbitrary values (`p-[22px]`). Border widths use the border classes (`border-b-3`) (DR-223).

In plain CSS (`reader.css`), write a scale step as `calc(var(--spacing) * n)` (DR-386).

### LAY-22 Put an inline ad between two paragraphs

Put an `ad-inline` slot only between two paragraphs of the article body. Never put it next to a heading, an image, a list, `KeyPoints` or `ContextCard`. Place the slots after paragraphs 3 and 10. When the next block is not a paragraph, move the slot to the next paragraph that a paragraph follows. Put no slot after the second-to-last paragraph, so a short article gets fewer slots (DR-387).

## 12. Implementation

### 12.1 Breakpoints (Tailwind 4)

Section 12.1 also removes the Tailwind defaults that the rules do not allow, and sets the container sizes and the motion tokens (DR-227, DR-235). Color Section 5 and typography Section 8.2 remove the default colors, font sizes and weights.

```css
@theme {
  /* No rounded corners, no shadows (DR-202). These classes then give no CSS. */
  --radius-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
  --text-shadow-*: initial;

  /* Container sizes (CPT-04): @medium: from 600px, @wide: from 880px */
  --container-*: initial;
  --container-medium: 37.5rem;
  --container-wide: 55rem;

  /* Motion (DR-227, DR-357): color changes 200ms; every slide, fade and height change uses
     --duration-slide with ease-slide */
  --default-transition-duration: 200ms;
  --duration-slide: 450ms;
  --ease-slide: cubic-bezier(0.22, 1, 0.36, 1);

  --breakpoint-sm: 37.5rem;  /* 600px */
  --breakpoint-md: 48rem;    /* 768px */
  --breakpoint-lg: 64rem;    /* 1024px */
  --breakpoint-xl: 80rem;    /* 1280px */
  --breakpoint-2xl: initial; /* no 2xl tier */
}
```

### 12.2 Tokens

```css
:root {
  --measure-shell: 80rem;
  --measure-rail: 19rem;
  --measure-reading-en: 44rem;
  --measure-reading-bn: 42rem;

  --gutter-page: 1rem;
  --grid-columns: 4;
  --grid-column-gap: 1rem;
  --grid-row-gap: 1.25rem;

  --space-page-start: 1.5rem;
  --space-section: 3rem;
  --space-section-compact: 2rem;
  --space-module: 1.5rem;
  --space-rail-modules: 3rem;
  --space-section-title-after: 1.25rem;

  --space-section-rule-title: 0.75rem;
  --space-story-media-text: 1rem;
  --space-story-title-summary: 0.5rem;
  --space-story-title-meta: 0.5rem;
  --space-media-caption: 0.5rem;
  --space-list-item: 1rem;
  --space-more-link: 1rem;

  --ad-label: 1.5rem;

  /* Ad sizes in px (LAY-19, Section 9). Height = reserved creative height. */
  --ad-top-w: 320px;
  --ad-top-h: 100px;
  --ad-band-h: 280px;
  --ad-inset-w: 300px;
  --ad-inset-h: 250px;

  --bar-height: 3.5rem;
  --nav-row-height: 2.75rem;
  --scroll-offset: calc(var(--bar-height) + 1rem);
  --drawer-width: min(20rem, 100% - 3rem);

  --z-content: 0;
  --z-bar: 30;
  --z-overlay: 50;
  --z-dock: 55;
  --z-popover: 70;
  --z-selection: 80;
  --z-toast: 90;
}

@media (min-width: 37.5rem) {
  :root { --gutter-page: 1.5rem; --grid-row-gap: 1.5rem; }
}

@media (min-width: 48rem) {
  :root {
    --grid-columns: 8;
    --grid-column-gap: 1.5rem;
    --space-analysis-gap: 2rem;
    --space-page-start: 2rem;
    --space-section: 4rem;
    --space-section-compact: 2.5rem;
    --space-module: 2rem;
    --space-section-title-after: 1.5rem;
    --ad-top-w: 728px;
    --ad-top-h: 90px;
    --ad-band-h: 90px;
  }
}

@media (min-width: 64rem) {
  :root {
    --grid-columns: 12;
    --space-analysis-gap: 3rem;
    --space-page-start: 2.5rem;
    --space-section: 5rem;
    --space-section-compact: 3rem;
    --space-module: 2.5rem;
    --space-rail-modules: 4rem;
    --bar-height: 4rem;
    --ad-top-w: 970px;
    --ad-top-h: 250px;
    --ad-band-h: 250px;
    --ad-rail-w: 300px;
    --ad-rail-h: 600px;
  }
}

@media (min-width: 80rem) {
  :root {
    --grid-column-gap: 2rem;
    --space-analysis-gap: 4rem;
    --ad-inset-w: 728px;
    --ad-inset-h: 90px;
  }
}

/* Spacing tokens as Tailwind spacing names: p-module, py-section (DR-235).
   The media queries above still change the values. */
@theme inline {
  --spacing-page-start: var(--space-page-start);
  --spacing-section: var(--space-section);
  --spacing-section-compact: var(--space-section-compact);
  --spacing-module: var(--space-module);
  --spacing-rail-modules: var(--space-rail-modules);
  --spacing-section-title-after: var(--space-section-title-after);
  --spacing-section-rule-title: var(--space-section-rule-title);
  --spacing-story-media-text: var(--space-story-media-text);
  --spacing-story-title-summary: var(--space-story-title-summary);
  --spacing-story-title-meta: var(--space-story-title-meta);
  --spacing-media-caption: var(--space-media-caption);
  --spacing-list-item: var(--space-list-item);
  --spacing-more-link: var(--space-more-link);
}
```

### 12.3 Containers

Write the container classes as Tailwind `@utility` rules, not as plain CSS. Tailwind then puts them in the utilities layer, and a utility on the same element can change them (DR-204). Typography Section 8.2 uses the same method.

```css
@utility shell {
  width: min(100% - 2 * var(--gutter-page), var(--measure-shell));
  margin-inline: auto;
}

@utility ad-row {
  width: 100%;
  display: grid;
  justify-items: center;
  /* Height = reserved creative height + var(--ad-label). No padding. */
}

@utility ad-inset {
  display: grid;
  justify-items: center;
  /* Under 332px: full screen width, like an ad band (DR-207). */
  @media (width < 20.75rem) {
    margin-inline: calc(-1 * var(--gutter-page));
  }
}

@utility editorial-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
  column-gap: var(--grid-column-gap);
  row-gap: var(--grid-row-gap);
}

@utility with-rail {
  display: grid;
  gap: var(--space-module) var(--grid-column-gap);
  @media (width >= 64rem) {
    grid-template-columns: minmax(0, 1fr) var(--measure-rail);
  }
}

@utility peer-card {
  display: grid;
  grid-row: span var(--card-parts, 4);  /* one row per card part: media, eyebrow, title, (summary), meta */
  grid-template-rows: subgrid;
}

/* LAY-20: 40 / 32 in a container under 600px, 48 / 40 from 600px (DR-224) */
@utility panel-inset {
  padding: --spacing(10) --spacing(8);
  @container (width >= 37.5rem) {
    padding: --spacing(12) --spacing(10);
  }
}

html {
  scroll-padding-top: var(--scroll-offset);
}

/* P-3b region slider, from 600px (below 600px the regions are tabs). DR-284, DR-291 */
@utility region-row {
  --region-in-view: 1; /* phones: one panel; the regions are tabs (DR-348) */
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc(
    (100% - (var(--region-in-view) - 1) * var(--grid-column-gap)) / var(--region-in-view)
  );
  column-gap: var(--grid-column-gap);
  scrollbar-width: none;
  & > * { scroll-snap-align: start; }
  &::-webkit-scrollbar { display: none; }
  @media (width >= 37.5rem) {
    --region-in-view: 2;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    /* 4px of room for the focus ring; the columns stay in line with the shell */
    margin: -0.25rem;
    padding: 0.25rem;
    scroll-padding: 0.25rem;
  }
  @media (width >= 64rem) { --region-in-view: 3; }
  @media (width >= 80rem) { --region-in-view: 4; }
}
```

The buttons animate `scrollLeft` (`--duration-slide`, `--ease-slide`), not a transform (DR-284). Copy this block into `components.css`; if the built utility differs, the code follows this block.

The top bar has no own CSS class. `TopBar` sets `sticky top-0 z-(--z-bar) min-h-(--bar-height)` in its classes (DR-234, DR-265). At 200% text the bar wraps to 2 lines: row 1 menu and logo, row 2 the controls at the end. It stays sticky.

### 12.4 Base rules

Put these rules in `app/globals.css`, after the imports (Section 12.5). Color Section 5 gives the base rules for the page colors, borders, focus and placeholders.

```css
@layer base {
  /* Pointer on enabled buttons (Tailwind 4 uses the browser default) (DR-235) */
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
  /* Icons: square line ends and miter joins (BRD-03, DR-235) */
  svg.lucide {
    stroke-linecap: square;
    stroke-linejoin: miter;
  }
  /* Reduced motion: no transitions and no animations (DR-227) */
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      transition-duration: 0s !important;
      animation-duration: 0s !important;
    }
  }
}
```

Set `--card-parts` on each card variant: it equals the number of card parts (4 without a summary, 5 with one).

Always use `minmax(0, 1fr)`. It stops long words from making a track wider.

### 12.5 globals.css imports

This is the one list of the `app/globals.css` imports (DR-339). Other documents link here; they do not state their own order. Import the files in this order, then write the base rules (Section 12.4):

```css
@import "tailwindcss";
@import "shadcn/tailwind.css";
@import "../styles/colors.css";      /* color-system.md Section 5 */
@import "../styles/layout.css";      /* this document, Sections 12.1 to 12.3 */
@import "../styles/typography.css";  /* typography-system.md Section 8 */
@import "../styles/components.css";  /* component-system.md Section 6 */
```

Do not add other imports. Do not import `tw-animate-css` (DR-236). Do not load fonts with a CSS `@import` (typography Section 8.1).

## 13. Validation

Test every homepage section at these widths: 320, 360, 600, 768, 834, 1024, 1180, 1280, 1366, 1440 and 1920. Test each width with reader size A++.

Test these content cases:

- Long Bangla headlines
- Stories with no image
- Sparse sections (Section 7.3)
- Two top-story cards at 1024px and 1280px
- The first screen at 1366×768. The browser UI takes about 118px, so about 650px of viewport shows. The bar (64), nav row (45 with its rule, DR-349) and top ad (274, now below the nav row, DR-295) leave about 267px for the hero. The lead headline can show only after the reader scrolls (DR-257)
- The Bangla nav row at 1280px
- 200% browser text size: no row scrolls sideways. Most read and the AnalysisSection rows stack, and the TopBar can wrap (DR-81)

## 14. Open items

### 14.1 Homepage

- None. Bar and nav row heights: DR-295. Gaps: DR-300 (L-62 closed).

### 14.2 Article and other pages

The article page is in Section 7A (DR-385 to DR-387). L-01, L-02, L-03, L-13 and L-15 to L-18 were about the archived article draft (version 1.1.1); Section 7A replaces that draft, so they are closed (DR-392). L-19 (page patterns) stays open for the other pages. The category page is in Section 7B: every item of its spec log is green or decided by tajmin. The Latest page is in Section 7D and the topic page in Section 7E. Other pages are not defined yet. They are defined per page in the browser: the page brief (`docs/briefs/<page>.md`) names the open items it covers, and the page spec log records the result (DR-370, DR-372, DR-379). After `/accept` the blueprint project writes the result into this document and closes the items.

## 15. Changelog

**2.32 (30 October 2026)**

- XC fixes (spec log xc-fixes): 7B.1 and 7B.3 the `CategoryFormatsSection` halves are fixed, an empty block leaves its half empty (DR-436, XC-11); 7B.2 Spacing: `main` starts with the title band, as 7D.2 (XC-03); 7E.2 noindex, follow below 3 stories and load more, no `?page` (DR-432, XC-02); decision citations DR-420 (7.1), DR-419 (7B.1), DR-418 (7C), DR-393 (Section 10) (XC-05).

**2.31 (30 October 2026)**

- Topic page (IMP-18, Topic spec log TP-01 to TP-03): new Section 7E (page order, content, sparse); the 7C.2 Topic row names it.

**2.30 (29 October 2026)**

- Docs cleanup (`task/docs-cleanup`): the spec text names a spec log by its page and item IDs, not by its file path: 7A (article page), 7B intro and 7B.2 (category page), 7D (Latest page). No rule or value changes.

**2.29 (28 October 2026)**

- Latest page (IMP-18, spec log `latest.md` LT-01 to LT-04): new Section 7D (page order, content, sparse); 7B.2 Load more: the added rows and their images fade in, and the added rows show the reader story time at once. LT-02: the reused More stories parts are `MoreStoriesSection` and `MoreStoriesList` (were `CategoryMoreStoriesSection`, `CategoryMoreStoriesList`; tajmin, 28 Oct 2026).

**2.28 (28 October 2026)**

- Category formats (DR-415, IMP-118, spec log `category-formats.md`): 7B.1 adds `CategoryFormatsSection` above Most read; 7B.2 Formats replaces DR-408 (news-only main stream, More stories without opinion and repeats) and the No Eyebrow rule names the analysis row exception; 7B.3 names the sparse rows. 7B.1 Page title: the C-43 PageTitle band (CF-06, U-50 approved by tajmin, 28 Oct 2026).

**2.27 (28 October 2026)**

- URL format (IMP-97, `docs/tasks/url-format.md`): new Section 7C URLs (paths, formats, missing translation). 7A: the article URL is `/story/<slug>-<id>`. 7.1: P-2 row 7 is the South Asia featured region (DR-412). 7B: 5 categories. 7B.2 Formats is unchanged until the category formats run (DR-415).

**2.26 (27 October 2026)**

- Homepage most read (IMP-99, spec log `home-most-read.md` HM-01): P-5 in 7.2, Section 4 and Section 8 use the RankedList layout of the category page (C-07): two list columns from 600px, from 1024px the middle and end of three columns with the start column empty. Amends DR-51, DR-145 and the DR-370 homepage lock for P-5 only. Section 13 (200% text size, "Most read stacks") is unchanged: open flag HM-04.

**2.25 (27 October 2026)**

- Category review (tajmin): `LAY-07` and 7B.2, the category page shows 1 card per row at every width (amends DR-44). 7B.2 Formats: opinion and op-ed are listed on the category page (amends DR-398). 7B.1 names the feature story part (OverlapCard `feature`), the hidden heading, `CategoryCardList` and the empty rail of More stories. Section 14.2: no open flags for the category page.

**2.24 (27 October 2026)**

- New Section 7B, category page, from the green items of `docs/spec-log/category.md` (CL-01 to CL-08, CL-19, CL-20) and the most read `columns` layout tajmin approved (C-07): page order, CategoryFeatureSection as HeroSection (`LAY-05`), card rows, no Eyebrow (DR-153), spacing (`LAY-12`), the load more pattern, sparse content (`LAY-13`).
- Section 14.2: the category page is defined in Section 7B; its red items are open flags.
- Section 7B: `PageTitle` (C-43), Divider.rule (C-22) above load more, and StoryCard `dated` (C-24) for More stories (tajmin, 27 Oct 2026).

**2.23 (24 October 2026)**

- New Section 7A, article page, from the accepted spec log checkpoint 1 (DR-385): page order, widths with the article gutter and containers (exception to LAY-01 to LAY-03), spacing with the heading gaps 12px and 12px, panel inset `--rd-panel-inset` 24px (exception to LAY-20), lead image cap 32rem, reading rail and dock, motion, print (DR-386).
- LAY-15: the reading rail is sticky and the dock, selection bar and toast are fixed on the article page (DR-386). Section 10: `--z-dock` 55, `--z-popover` 70, `--z-selection` 80, `--z-toast` 90.
- Section 9: `ad-inline` is 300×250 at every width, reserve 250. New rule LAY-22: inline ads between two paragraphs only, after paragraphs 3 and 10 (DR-387).
- Section 14.2: the article page is defined; category and other pages are defined per page.

**2.22.1 (19 October 2026)**

- Section 14.2: article and other pages are defined per page through the brief and the spec log, not a separate layout pass (DR-370). No rule or value changed.

**2.22 (17 October 2026)**

- §3.1 and P-4: the analysis and opinion gap is `--space-analysis-gap` (32 / 48 / 64px), a stated exception to the one column gap (DR-356).
- §12: new token `--duration-slide: 450ms`; every slide, fade and height change uses it (DR-357).
- §6: the nav row hides past the nav row (DR-357, DOC-46). A focus in the stuck header does not scroll the page (`scroll-margin-top`, DR-357). LAY-17: the NavBar item list is one row tall; items that do not fit are hidden whole (DR-359).
- P-1 and LAY-18: Latest has one "more" link to the Latest page (DR-350, DR-359).

**2.21 (16 October 2026)**

- Wording only, no rule change (audit run). §6: the theme control is the ThemeButton at every width; the nav row hides past the nav row, not past the page top (DR-349). LAY-15 says the same.

**2.20 (16 October 2026)**

- Site header: the top bar and the nav row are sticky together; past the page top the nav row slides up and hides and the logo scales down, 450ms `ease-slide` (LAY-15, §6, DR-349).
- `--nav-row-height` 44px (45 with the rule); drawer accordion animates 450ms (DR-349).
- Column rules: P-4 between analysis and opinion from 768, P-3 between wrapper and rail from 1024, in the existing gap (DR-351).

**2.19 (16 October 2026)**

- One motion duration: the drawer, the search panel and the phone region tabs use 450ms `ease-slide` (§6, P-3b, DR-346). Button color changes stay 200ms.
- Search: one Tab from the panel reaches the field; close button after the field in source; §11 names the shadcn `Drawer` (DR-348).
- `aria-hidden` plus focus trap counts as `inert` (§6, DR-348).
- `ad-inset` between rows of blocks, after every row but the last, 3 or fewer (§9, DR-348; amends DR-276 wording).
- `region-row` block uses `--region-in-view` 1 / 2 / 3 / 4; scroll and snap from 600px (§12.3, DR-348).

**2.18 (15 October 2026)**

- Section 14.1: the run 2 height and spacing checks are closed (DR-295, DR-300; L-62 closed).

**2.17 (15 October 2026)**

- New Section 12.5: the one `globals.css` import list and order (DR-339).
- Section 6: the theme choice is kept in local storage, key `fl-theme` (DR-340).

**2.16 (15 October 2026)**

- `ad-band` at 768–1023: 728×90 only, reserve 90 (DR-315).
- Search panel: shadcn slide, not 'no animation' (DR-280).

**2.15 (15 October 2026)**

- Column gap 16px (phones and 600), 24px from 768, 32px from 1280; it applies wherever blocks sit side by side, also image and text in a card and the quote mark. Row gap is its own token: 20px on phones, 24px from 600. Wrapper 896 at 1280, 944 from 1366 (DR-300).

**2.14 (14 October 2026)**

- Region slider: scroll-snap row moved by its scroll position, no transform; phone tab panels fade 200ms out and in; `region-row` block in §12.3 (DR-284, DR-291).
- Top ad moves below the header (below the nav row from 1280), above the hero; amends DR-197. Logo 32 / 28 / 20px at the top, 24px when stuck; sticky rule at every width; equal icon-pair gaps (DR-295). `data-bar-stuck` contract (DR-287).

**2.13 (13 October 2026)**

- Search is a shadcn `Drawer` from the top; the menu Sheet and the search Drawer use the shadcn default slide; search focus goes to the panel (§6, DR-280). Amends DR-227, DR-228, DR-249.
- Ad insets: one after every 2nd category row, 3 or fewer, none after a text-only row; no 600px check (§9, DR-276).
- `DailyPoll` has no panel and no panel inset; it sits on `background` (§5.3, P-3, DR-273). Amends DR-224 for the poll.

**2.12 (13 October 2026)**

- P-4 and the footer are panel bands: full-width `surface-elevated`, content in the shell, block inset only (§5.3, §7.1, §7.4, LAY-20, DR-264). Amends DR-76.
- Top bar: `min-h-(--bar-height)`; it wraps to 2 lines at 200% text; `--scroll-offset` follows the real bar height (§6, §12.3, DR-265).

**2.11 (10 October 2026)**

- Section 14.2: article and category layout is not defined; do not build it. Version 1.1.1 is no longer in the repository (DR-259).

**2.10 (10 October 2026)**

- `ad-rail` size: 300×600 or 300×250, reserve 600 + label (DR-241). Gap to the poll: `space-module` (DR-242).
- P-3 always has two category rows; the `ad-rail` always shows (DR-243). `ad-rail` under 1280 joins the hide-per-device list in §7.2 (DR-244).
- `ad-rail` from 1280 only, not 1024 (DR-245). Tokens `--ad-rail-w` 300px, `--ad-rail-h` 600px in the 80rem block (§12.2, LAY-19). Amended Analysis spec log AN-11; tajmin, 4 Nov 2026: from 1024 on every page, whenever the rail is a column; the tokens are in the 64rem block.

**2.9 (10 October 2026)**

- `ad-rail` on the homepage: P-3 rail, below the poll, from 1024 only; size and loading open (DR-240).

**2.8 (10 October 2026)**

- NewsletterSignup is paused for prototype run 2; the P-3 rail holds the daily poll only; no sign-up point in run 2 (DR-239).

**2.7 (10 October 2026)**

- New rules `LAY-19` ad sizes in px tokens (DR-233), `LAY-20` panel inset (DR-224) and `LAY-21` 4px scale (DR-223). `LAY-01` allows scale classes.
- Drawer is the shadcn `Sheet`, search is the shadcn `Drawer` from the top (DR-280, DR-348); both close on a backdrop press; one layer `--z-overlay` (DR-228). Drawer marks the current page (DR-226).
- Theme removes radius, shadow and container defaults; container sizes, motion tokens and spacing names in the theme; base rules for cursor, icons and reduced motion (DR-227, DR-235). The `.top-bar` class is removed (DR-234).

**2.6 (10 October 2026)**

- Tokens `space-eyebrow-title` and `space-story-summary-meta` removed; no component used them (DR-213).

**2.5 (9 October 2026)**

- The top ad slot is `ad-top`, the same name as the `AdSlot` variant (DR-197). 336×280 from 336px only (DR-206). The inset ad uses the full screen width under 332px (DR-207). Space outside the বিশ্লেষণ ও মতামত background (DR-205). Container classes are `@utility` rules (DR-204).

**2.4 (9 October 2026)**

- Layout follows the approved components (`component-system.md`): header without Subscribe and with a two-state theme control, Latest 5 items and 2 columns at 768–1023px, featured category text beside the image from 768px, grouped rail full rows below 1024px, regions 4 / 3 / 2 in view and a 450ms slide, Most read 3 per row at 1024–1279px, `space-rail-modules`, the "আরও দেখুন" link at the end edge, and a provisional footer (DR-99 to DR-193).

**2.3.1 (7 October 2026)**

- Text edits for ASD-STE100: long sentences split, passive voice removed, typography values linked, not copied. No layout values changed.

**2.3 (6 October 2026)**

- Homepage peer rows stop at 2 per row; no 4-up rows (DR-44).
- বিশ্লেষণ ও মতামত uses the shell width with a `surface-elevated` background inside the shell (DR-76, DR-52).
- The 8+4 hero (411px rail) stays an option for a later prototype (DR-35).

**2.2 (6 October 2026)**

- Search: icon beside the menu button and a dialog from 768px; in the drawer on phones (L-31, S-16).
- Ad rows use `surface-alt`. Analysis and opinion: own section background, chip on opinion only, see-more links below each block (`LAY-18`).
- Top bar at every width, inset ad slot and limits, Opinion breakpoint, regions slider, lead panel overlap, newsletter and poll, minimum footer (L-31, L-33, L-34, L-37 to L-42).

**2.1 (6 October 2026)**

- Ad label line 24px. Header height, scroll offset and drawer tokens. Drawer behavior rules.
- Peer card row span per card variant. `measure-deck` covers deck and summary only.

**2.0 (6 October 2026)**

- Breakpoints: phone, 600, 768, 1024, 1280. No 2xl tier. Gutter 16, then 24 from 600.
- Fixed rail 304px with a fluid wrapper.
- Editorial containers and a separate full-width ad container. No breakouts.
- New spacing tokens for the section rule, eyebrow, title-to-meta, caption, "more" link and row gap.
- Homepage page order, patterns P-1 to P-5 and sparse rules from wireframe V2.
- Ads: top ad above the header, no sticky ads, no padding, no homepage rail ad.
- Header: sticky top bar, nav row from 1280, left drawer at all widths.

**1.1.1** Source version, kept in the blueprint archive.
