# Fact Lens Spacing and Layout System

Version 2.3.1 · 7 October 2026 · Homepage approved for the first prototype

This document is the single source for Fact Lens page layout and spacing. It is for designers, developers and AI agents. Other documents link to the tables in this document. They do not copy values.

This version covers the homepage and the layout rules that all pages share. Article pages and other templates are not yet revised. For those templates, Section 14 lists the open items and the parts of version 1.1.1 that still apply.

The wireframes show placement only. They do not give measurements. Use the values in this document.

## Contents

1. [How to use this document](#1-how-to-use-this-document)
2. [Layout model](#2-layout-model)
3. [Breakpoints and grid](#3-breakpoints-and-grid)
4. [Widths](#4-widths)
5. [Spacing tokens](#5-spacing-tokens)
6. [Header](#6-header)
7. [Homepage](#7-homepage)
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
- Follow the **rules** (Section 11). Each rule has a stable ID, for example `LAY-04`. Use the ID in reviews, prompts and the decision register.
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
| Reading column | `measure-reading-en`, `measure-reading-bn` | Article text (article pass, not yet revised) |

A section with a rail has two parts inside the shell:

- The **wrapper** is fluid. It holds the main content.
- The **rail** has a fixed width of 304px. It holds supporting content.

From 1024px, the rail is beside the wrapper. Below 1024px, the rail goes below the wrapper.

## 3. Breakpoints and grid

### 3.1 Breakpoints

| Tier | From | Columns | Page gutter | Column gap | Row gap |
| --- | --- | --- | --- | --- | --- |
| Phone | 0 | 4 | 16px | 16px | 16px |
| `sm` | 600px | 4 | 24px | 16px | 16px |
| `md` | 768px | 8 | 24px | 20px | 20px |
| `lg` | 1024px | 12 | 24px | 24px | 24px |
| `xl` | 1280px | 12 | 24px | 24px | 24px |

There is no `2xl` tier. From 1366px, no value changes. On a 1920px screen, the shell is 1280px, a column is approximately 84.7px, and four columns are 411px.

The row gap (`--grid-row-gap`) is always equal to the column gap.

### 3.2 Shell width per tier

The shell is `min(100% − 2 × gutter, 1280px)`.

| Viewport | Shell | Wrapper (shell − 304 − 24) |
| --- | --- | --- |
| 360 | 328 | – (rail stacks) |
| 768 | 720 | – (rail stacks) |
| 1024 | 976 | 648 |
| 1280 | 1232 | 904 |
| 1366 and wider | 1280 | 952 |

### 3.3 Cards per row

| Viewport | Homepage peer rows | Other pages |
| --- | --- | --- |
| Below 600px | 1 | 1 |
| From 600px | 2 | 2 |
| From 1024px | 2 | 3 |

The homepage has no 4-up and no 3-up card row. Most read is a numbered list, not a card row: it keeps 4 columns (DR-51). The hero has two top-story cards.

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
| `space-module` | 24 / 32 / 40 | Between modules in a section. Between a section and its ad row. Between newsletter and poll |
| `space-section-title-after` | 20 / 24 / 24 | Section heading row to the first content |
| `--grid-row-gap` | 16 / 20 / 24 | Between card rows. Lead story to top stories |

The space between a section and an ad row belongs to the section, not to the ad row (`LAY-12`).

### 5.2 Component rhythm

These values are the same at all widths.

| Token | Value | Use |
| --- | --- | --- |
| `space-section-rule-title` | 12px | Section rule to section heading |
| `space-eyebrow-title` | 4px | Eyebrow to story title |
| `space-story-media-text` | 16px | Story image to story text |
| `space-story-title-summary` | 8px | Story title to summary |
| `space-story-summary-meta` | 12px | Summary to metadata |
| `space-story-title-meta` | 8px | Story title to metadata, when there is no summary |
| `space-media-caption` | 8px | Image to caption |
| `space-list-item` | 16px | List item to rule, on each side of the rule |
| `space-more-link` | 16px | Last item to the "more" link |

## 6. Header

| Part | Width | Behavior |
| --- | --- | --- |
| Top bar | Full viewport | Sticky at all widths |
| Nav row | Shell | From 1280px only. Scrolls away |
| Drawer | From the left, full viewport height | Opens from the menu button at all widths |

- The menu button is on the left at all widths.
- Phones (below 768px): menu button on the left, logo in the center, theme and language on the right.
- From 768px (tablets, laptops, desktops): menu and search buttons on the left, logo in the center, language, theme and "Subscribe" on the right.
- The bar is a 3-column grid (`1fr auto 1fr`), so the logo stays in the center.
- "Subscribe" is on the right of the bar from 768px. On phones it is in the drawer.
- There is no sub-navigation row. Its items are in the drawer.
- The theme switch has three states: system, light, dark. It starts at system. Set `data-theme` before the first paint.
- The nav row shows only the items that fit in the shell. There is no "More" item. All items are in the drawer.
- The top ad row is above the header. When the top ad scrolls away, the top bar sticks to the top of the viewport.

| Token | Value | Use |
| --- | --- | --- |
| `--bar-height` | 56px; 64px from 1024 | Top bar height |
| `--nav-row-height` | 48px | Nav row height (from 1280) |
| `--scroll-offset` | `--bar-height` + 16px | `scroll-padding-top` on `html`, so anchors stop below the sticky bar |
| `--drawer-width` | 320px, or the viewport width minus 48px if smaller | Drawer width |

Check the bar and nav row heights in the prototype.

Drawer behavior:

- The drawer is a modal dialog. The page behind it is `inert`.
- When the drawer opens, focus moves to its first item.
- Escape, the close button and a click on the scrim close the drawer.
- When the drawer closes, focus returns to the menu button.
- With reduced motion, the drawer opens with no slide.

Search:

- From 768px (tablets, laptops, desktops), the search icon button is next to the menu button on the left. It opens a modal search dialog with the search field. Focus moves to the field. Escape and the close button close the dialog. Focus then returns to the search button.
- Below 768px (phones), the bar has no search icon. Search is in the drawer (two steps: menu, then search).
- The logo is in the center at every width.

## 7. Homepage

### 7.1 Page order

| # | Row | Container |
| --- | --- | --- |
| 1 | Top ad | Ad |
| 2 | Header | Full / shell |
| 3 | P-1 Hero | Shell |
| 4 | Ad band | Ad |
| 5 | P-4 বিশ্লেষণ ও মতামত (analysis and opinion) | Shell, with its own background inside the shell |
| 6 | Ad band | Ad |
| 7 | P-2 Featured category (বাংলাদেশ) | Shell |
| 8 | Ad band | Ad |
| 9 | P-2 Featured category (ভূরাজনীতি) | Shell |
| 10 | Ad band | Ad |
| 11 | P-3 Grouped categories | Shell |
| 12 | P-5 Most read | Shell |
| 13 | Ad band | Ad |
| 14 | P-3b Regions | Shell |
| 15 | Footer | Ad container (full-width row) with content in the shell |

### 7.2 Patterns

The section heading row is a component. It is not a pattern.

| Pattern | Structure | From 1024px | 600–1023px | Phone |
| --- | --- | --- | --- | --- |
| P-1 Hero | Wrapper: lead story, then two top stories as a peer pair. Rail: Latest, 5 to 6 items and a "more" link | Wrapper + rail | Lead full width. Latest in 2 columns below | Lead, top stories, Latest, stacked |
| P-2 Featured category | Wrapper: lead image and text. Rail: one image story and two stories | Wrapper + rail. Text under the image to 1279px. Text beside the image from 1280px | Rail below the wrapper | Lead image, text, rail image, stories |
| P-3 Grouped categories | One section. Rows of two categories. Inset ad between rows, at wrapper width. Rail: newsletter, then daily poll | Wrapper + rail | Two categories per row. Rail below the block | A, B, ad, C, D, then newsletter and poll |
| P-3b Regions | All regions in one row of columns. Previous and next buttons. Subtle animation | 4 regions in view | 2 regions in view | Region tabs. One region in view |
| P-4 বিশ্লেষণ ও মতামত | Shell width. Two equal columns: analysis (image-led list) and opinion (quote list). No rail | Two columns | Two columns from 768px. Stacked at 600–767px | Stacked: analysis, then opinion |
| P-5 Most read | Top 5, full shell | 4 per row. Item 5 on row 2 | 2 per row | 1 per row |

The hero, featured category and grouped category sections use the same wrapper + rail layout. The rail is always 304px.

Every width shows the same sections in the same order. CSS changes only the layout. Hide nothing per device except the nav row and the slider buttons.

### 7.3 Sparse content

| Pattern | When content is missing |
| --- | --- |
| P-1 | One top story spans the wrapper. Latest shows the items that exist |
| P-2 | No rail stories: the wrapper spans the shell |
| P-3 | Odd number of categories: the last category keeps its size. The other half of the row stays empty |
| P-3b | 4 regions or fewer: no buttons. A region with no stories is not shown |
| P-4 | One column is empty: the other column spans the shell |
| P-5 | Show the items that exist |

A section with no content is not shown. Its ad row is also not shown. Two ad rows are never next to each other.

### 7.4 Pattern details

**P-1 lead panel.** From 768px, the lead text panel overlaps the bottom of the lead image by 64px. The panel uses the `surface` color, so text never sits on the photo. The panel grows down, never up. Below 768px, the panel is under the image. A lead with no image has no overlap. The cut corner on top-story images comes from the text block, not from a clip on the image.

**P-4 বিশ্লেষণ ও মতামত.** The section has the shell width (1280px on FHD), like every other section. It is not a full-width row. Its background is `surface-elevated`, inside the shell only. This color differs from the page background and from the ad rows (`surface-alt`). Only the opinion column has a label chip ("মতামত", plain, not a link). The analysis column has no chip. Each column has its own "আরও দেখুন" link below its last item (`LAY-18`). Both columns align to the top and end where their content ends. Analysis is the left column. The section name is "বিশ্লেষণ ও মতামত", so the name follows the column order.

**P-3b Regions slider.** From 600px:

- The row is a scroll container with CSS scroll snap.
- A button press moves one region (column width + gap). At each end, the button for that direction is disabled. No loop and no autoplay. Swipe works.
- All regions are in the HTML, so the keyboard reaches every link.
- The buttons have the names "আগের অঞ্চল" and "পরের অঞ্চল".
- Animation is 200–300ms. With reduced motion there is no animation.
- With 4 regions or fewer, there are no buttons.

Below 600px, the regions are tabs (`tablist`, arrow keys, `aria-selected`). A chip is as wide as its label and 44px tall or more. The selected chip scrolls into view. One region panel shows.

**P-3 rail: newsletter and daily poll.** Newsletter: heading, one line of text, email field, button, consent line with a privacy link, and error, sending and done states. Daily poll: one question, 2 to 4 options, a vote button, then result bars. One vote per browser. A quiz can come later. Both use mock data. They never use the ad label or ad colors. Width: the 304px rail from 1024px, full width below.

**Footer.** Until the footer design is ready, use a minimum footer. It is a full-width row with the logo and social links. Each social link has a text name for screen readers. The row also has links to About, Contact, Corrections, Privacy and Terms. All labels are in the page language.

## 8. Peer rows

A peer row is a row of cards with equal rank.

- Use one card variant per peer row.
- Align the card parts across the row with `grid-template-rows: subgrid`.
- When a card has no part (for example, no summary), that row of the subgrid stays empty.
- The component pass defines the card variants (with or without image, with or without eyebrow).
- In P-5, item 5 is alone on row 2 on purpose.

## 9. Ads

The full ad system is in `audit/fact-lens-ad-system-proposal.html`. This section gives the layout parts.

| Slot | Where | Phone and 600 | 768 | From 1024 | Reserved height |
| --- | --- | --- | --- | --- | --- |
| `ad-band-top` | First row, above the header | 320×100 or 320×50 | 728×90 | 970×250, 970×90 or 728×90 | 100 / 90 / 250 |
| `ad-band` | After the hero, Opinion, each featured category and Most read | 336×280, 300×250 or 320×100 | 728×90 or 300×250 | 970×250, 970×90 or 728×90 | 280 / 250 / 250 |
| `ad-inset` | Between category rows in P-3, at wrapper width. No full-width row | 300×250 | 300×250 | 300×250; 728×90 from 1280 | 250; 90 from 1280 |
| `ad-rail` | Article pages only | – | – | Later | – |
| `ad-inline` | Article pages only | Later | Later | Later | – |

- Ad rows and the `ad-inset` box use the `surface-alt` background. The label is `ink-muted`. The color is only behind the creative and the label; there is no padding.
- An ad row is the reserved creative height plus a 24px label line ("Advertisement" or "বিজ্ঞাপন"). The label uses `type-eyebrow`, which needs about 20px in Bangla.
- Ad rows have no padding, margin or gutter at any width.
- No ad is sticky or fixed at any width.
- The homepage has 3 `ad-inset` slots or fewer. Rows after the third inset have no ad between them.
- On phones, put 600px of editorial content or more between two ads. Skip an inset when the rows between are shorter.
- The homepage has no rail ad.
- Ad space is 30% of the page height or less. The phone estimate is approximately 20%.
- Phase 1: static images from direct-sold networks, no timed refresh. Phase 2: programmatic fill (Google Ad Manager) in the same slots.

## 10. Layers

| Token | Value | Use |
| --- | --- | --- |
| `--z-content` | 0 | Content and ads |
| `--z-bar` | 30 | Sticky top bar |
| `--z-scrim` | 40 | Drawer scrim |
| `--z-drawer` | 50 | Drawer |

## 11. Rules

### LAY-01 Use only the tokens in this document

Do not type a width, gap or space value in a component. If a value is missing, add a token here first.

### LAY-02 Keep content inside its container

Do not break out of a container. Do not use `vw` units for layout. A full-width background is a full-width row.

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

Homepage peer rows: 1 below 600px, 2 from 600px. The homepage has no 4-up rows. Other pages use 3 from 1024px.

### LAY-08 Use one card variant per peer row

Align card parts with subgrid. A missing part leaves an empty subgrid row. Do not stretch other parts to fill it.

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

### LAY-15 Make only the top bar sticky

The top bar is sticky. The nav row scrolls away. Use the layer tokens in Section 10.

### LAY-16 Use the same geometry in both languages and both themes

Bangla and English use the same containers and spacing. Dark mode changes color only.

### LAY-17 Do not set a fixed height on text containers

Text containers grow with the text. This is necessary for Bangla, zoom and the reader sizes A+ and A++.

### LAY-18 Put the "see more" link below its block

Put each "আরও দেখুন" link below the last item of its section, column or rail. Align it to the start. Put `space-more-link` above it. Do not put it in the section heading row.

## 12. Implementation

### 12.1 Breakpoints (Tailwind 4)

```css
@theme {
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
  --grid-row-gap: var(--grid-column-gap);

  --space-page-start: 1.5rem;
  --space-section: 3rem;
  --space-section-compact: 2rem;
  --space-module: 1.5rem;
  --space-section-title-after: 1.25rem;

  --space-section-rule-title: 0.75rem;
  --space-eyebrow-title: 0.25rem;
  --space-story-media-text: 1rem;
  --space-story-title-summary: 0.5rem;
  --space-story-summary-meta: 0.75rem;
  --space-story-title-meta: 0.5rem;
  --space-media-caption: 0.5rem;
  --space-list-item: 1rem;
  --space-more-link: 1rem;

  --ad-label: 1.5rem;

  --bar-height: 3.5rem;
  --nav-row-height: 3rem;
  --scroll-offset: calc(var(--bar-height) + 1rem);
  --drawer-width: min(20rem, 100% - 3rem);

  --z-content: 0;
  --z-bar: 30;
  --z-scrim: 40;
  --z-drawer: 50;
}

@media (min-width: 37.5rem) {
  :root { --gutter-page: 1.5rem; }
}

@media (min-width: 48rem) {
  :root {
    --grid-columns: 8;
    --grid-column-gap: 1.25rem;
    --space-page-start: 2rem;
    --space-section: 4rem;
    --space-section-compact: 2.5rem;
    --space-module: 2rem;
    --space-section-title-after: 1.5rem;
  }
}

@media (min-width: 64rem) {
  :root {
    --grid-columns: 12;
    --grid-column-gap: 1.5rem;
    --space-page-start: 2.5rem;
    --space-section: 5rem;
    --space-section-compact: 3rem;
    --space-module: 2.5rem;
    --bar-height: 4rem;
  }
}
```

### 12.3 Containers

```css
.shell {
  width: min(100% - 2 * var(--gutter-page), var(--measure-shell));
  margin-inline: auto;
}

.ad-row {
  width: 100%;
  display: grid;
  justify-items: center;
  /* Height = reserved creative height + var(--ad-label). No padding. */
}

.editorial-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
  column-gap: var(--grid-column-gap);
  row-gap: var(--grid-row-gap);
}

.with-rail {
  display: grid;
  gap: var(--space-module) var(--grid-column-gap);
}

@media (min-width: 64rem) {
  .with-rail {
    grid-template-columns: minmax(0, 1fr) var(--measure-rail);
  }
}

.peer-card {
  display: grid;
  grid-row: span var(--card-parts, 4);  /* one row per card part: media, eyebrow, title, (summary), meta */
  grid-template-rows: subgrid;
}

html {
  scroll-padding-top: var(--scroll-offset);
}

.top-bar {
  block-size: var(--bar-height);
  position: sticky;
  top: 0;
  z-index: var(--z-bar);
}
```

Set `--card-parts` on each card variant: it equals the number of card parts (4 without a summary, 5 with one).

Always use `minmax(0, 1fr)`. It stops long words from making a track wider.

## 13. Validation

Test every homepage section at these widths: 320, 360, 600, 768, 834, 1024, 1180, 1280, 1366, 1440 and 1920. Test each width with reader size A++.

Test these content cases:

- Long Bangla headlines
- Stories with no image
- Sparse sections (Section 7.3)
- Two top-story cards at 1024px and 1280px
- The first screen at 1366×768. The browser UI takes about 118px, so about 650px of viewport shows. The top ad (274), bar (64) and nav row (48) leave about 264px for the hero
- The Bangla nav row at 1280px

## 14. Open items

### 14.1 Homepage

No open items. Check the bar and nav row heights in the prototype (Section 6).

### 14.2 Article and other pages (not yet revised)

L-01, L-02, L-03, L-13, L-15 to L-20 and L-22 are open. Until the article pass, use version 1.1.1 as the reference for article layout, media widths, the context module and category pages. See `source/spacing-layout-system.md`, Sections 17 to 19. Its `measure-shell-wide`, `measure-content`, `measure-article-header`, `measure-media-wide` and `measure-context` tokens are not yet revised.

## 15. Changelog

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

**1.1.1** Source version. See `source/spacing-layout-system.md`.
