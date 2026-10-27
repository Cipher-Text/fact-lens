# Fact Lens Typography System

Version 2.19 · 27 October 2026 · Homepage most read (IMP-99): `type-rank` retired; the RankedList rank is the chip (`component-system.md` C-07)

This document is the single source for Fact Lens typography. It is for designers, developers and AI agents. Other documents link to the role table in Section 3. They do not copy values.

Fact Lens publishes in Bangla and English. Each language has its own fonts and metrics, but both languages use the same role names.

The values are approved for prototype run 2. Section 9 lists what to check in the prototype. Some values can change after that check.

## Contents

1. [How to use this document](#1-how-to-use-this-document)
2. [Fonts](#2-fonts)
3. [Role table](#3-role-table)
4. [Reader sizes](#4-reader-sizes)
5. [Measures](#5-measures)
6. [Rules](#6-rules)
7. [Role mapping](#7-role-mapping)
8. [Implementation](#8-implementation)
9. [Prototype checks](#9-prototype-checks)
10. [Open items](#10-open-items)
11. [Changelog](#11-changelog)

## 1. How to use this document

- Find the role for a text element in the **role table** (Section 3). Each role has one name and one set of values per language.
- Follow the **rules** (Section 6). Each rule has a stable ID, for example `TYP-04`. Use the ID in reviews, prompts and commit messages.
- Copy the **CSS** in Section 8 into the app. Do not type values by hand.

The typography model has three layers:

| Layer | What it holds | Who uses it |
| --- | --- | --- |
| Font family | Four font files | `fonts.ts` only |
| Role token | Size, weight, line height and tracking per role and language, for example `--type-deck-size` | `typography.css` |
| Utility | A Tailwind class per role, for example `type-deck` | Components |

Components use utilities only.

Typography sets the font, size, weight, line height, tracking and line length caps. It does not set color, spacing or container width. For color, see `color-system.md`. For spacing and grid, see `spacing-layout-system.md`.

## 2. Fonts

### 2.1 Families

| Token | English | Bangla | Use |
| --- | --- | --- | --- |
| `font-editorial` | Source Serif 4 | Noto Serif Bengali | Journalism: headlines, decks, summaries, article text, quotes |
| `font-ui` | Plus Jakarta Sans | Noto Sans Bengali | Interface: navigation, buttons, labels, metadata, forms |

All four fonts are on Google Fonts. All four are variable fonts. Load them with `next/font/google` (Section 8.1).

Source Serif 4 has an optical-size axis (8–60). The browser uses it automatically (`TYP-10`).

### 2.2 Font stacks

The `lang` attribute selects the stack. Each Bangla stack includes the English font, so Latin letters and digits in Bangla text use the Fact Lens English font.

| Stack | Fonts, in order |
| --- | --- |
| Editorial, English | Source Serif 4, Georgia, "Times New Roman", serif |
| Interface, English | Plus Jakarta Sans, system-ui, -apple-system, "Segoe UI", Arial, sans-serif |
| Editorial, Bangla | Noto Serif Bengali, Source Serif 4, "Noto Serif", serif |
| Interface, Bangla | Noto Sans Bengali, Plus Jakarta Sans, "Nirmala UI", sans-serif |

### 2.3 Weights and styles

| Weight | Use |
| --- | --- |
| 400 | Article body, deck, caption, metadata, input values, links in article text (paragraph weight) |
| 500 | Interface text, story summaries, pull quotes, Bangla blockquotes |
| 600 | Headlines, titles, section headings, buttons, Bangla `<em>` |
| 700 | English eyebrow, Most read numerals, `<strong>` |

Load italic for Source Serif 4 only. Bangla fonts have no italic.

## 3. Role table

There are 24 roles. Fluid sizes grow from a 360px viewport to a 1280px viewport, then stop. The page shell also stops at 1280px. Section 8.2 gives the `clamp()` values.

Tracking for Bangla is 0 in every role.

| Role | Family | English size | Weight | Line height | Tracking | Bangla size | Weight | Line height | Use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `type-display` | Serif | 44–64px | 600 | 1.02 | -0.03em | 40–56px | 600 | 1.16 | Brand moments, special pages |
| `type-page-title` | Serif | 34–48px | 600 | 1.06 | -0.025em | 32–44px | 600 | 1.18 | Section and category page titles |
| `type-article-title` | Serif | 36–48px | 600 | 1.06 | -0.025em | 34–44px | 600 | 1.18 | The article headline (h1). Largest from 1280 (DR-388) |
| `type-story-lead` | Serif | 30–42px | 600 | 1.08 | -0.02em | 28–40px | 600 | 1.2 | Lead story on the homepage |
| `type-story-title-lg` | Serif | 26–34px | 600 | 1.12 | -0.015em | 26–32px | 600 | 1.22 | Second-level story in a lead group (not on the homepage) |
| `type-story-title` | Serif | 22–26px | 600 | 1.16 | -0.01em | 22–26px | 600 | 1.26 | Standard story card |
| `type-story-title-sm` | Serif | 18–20px | 600 | 1.2 | -0.005em | 18–20px | 600 | 1.3 | Compact cards and lists |
| `type-deck` | Serif | 18–22px | 400 | 1.45 | 0 | 18–21px | 400 | 1.55 | Standfirst under the article title |
| `type-summary` | Serif | 16px | 500 | 1.5 | 0 | 17px | 500 | 1.6 | Short summary on story cards and the lead story (DR-97) |
| `type-article-body` | Serif | 17–18px | 400 | 1.68 | 0 | 18–19px | 400 | 1.76 | Article paragraphs and lists |
| `type-article-h2` | Serif | 28–36px | 600 | 1.15 | -0.015em | 26–34px | 600 | 1.28 | Subheading in the article |
| `type-article-h3` | Serif | 22–28px | 600 | 1.22 | -0.01em | 22–26px | 600 | 1.34 | Minor subheading in the article |
| `type-blockquote` | Serif | 18–22px | 400 | 1.6 | 0 | 19–22px | 500 | 1.68 | Quoted text in the article |
| `type-pullquote` | Serif | 28–36px | 500 | 1.2 | -0.015em | 26–34px | 500 | 1.32 | Pulled quote in the article |
| `type-section-title` | Serif | 22px | 600 | 1.25 | -0.01em | 22px | 600 | 1.3 | Homepage section heading (`SectionHeading`, DR-163) |
| `type-logo` | Serif | 20px; 28px from 768; 32px from 1024. When the bar is stuck: drawn at 24px by a transform (C-17), not by font size | 700 | 1 | 0 | same | 700 | 1.1 | Logo text stand-in in the TopBar until the logo file exists (BRD-06, BRD-09, DR-295, DR-306). `type-logo-sm` = the same role at 24px for the Footer and `Drawer.head` |
| `type-eyebrow` | Sans | 14px | 700 | 1.2 | 0.06em | 15px | 600 | 1.35 | Category and label above a headline |
| `type-metadata` | Sans | 14px | 400 | 1.4 | 0.01em | 15px | 400 | 1.5 | Byline, date, reading time. One size per language on the page (DR-96, DR-101) |
| `type-caption` | Sans | 14px | 400 | 1.5 | 0 | 15px | 400 | 1.6 | Image and figure captions |
| `type-ui` | Sans | 16px | 500 | 1.4 | 0 | 16px | 500 | 1.5 | Standard interface text |
| `type-ui-sm` | Sans | 14px | 500 | 1.4 | 0 | 15px | 500 | 1.5 | Navigation, tabs, menus, tooltips |
| `type-nav` | Sans | 14px | 600 | 1.4 | 0 | 16px | 600 | 1.5 | NavBar items (DR-295, DR-346). The size changes by `:lang`; no language variant in the component |
| `type-button` | Sans | 14px | 600 | 1.2 | 0 | 15px | 600 | 1.35 | Button labels (`Button`, C-12). Same size at every width (DR-208) |
| `type-input` | Sans | 16px | 400 | 1.4 | 0 | 16px | 400 | 1.5 | Form input values |

Notes:

- In English, `type-eyebrow` is uppercase on `Eyebrow` and `Chip` only. Other uses add `normal-case` (DR-216). Bangla has no case.
- `type-blockquote` is italic in English. In Bangla it uses weight 500.

### 3.1 Ink inset

The space next to a `Divider.item` rule is measured to the text ink, not to the line box (C-22, DR-350). The ink inset is the blank space between the line box edge and the ink of a role, as a share of the role size. It was measured from the fonts. Only the roles that stand next to a rule have a value (DR-355).

| Token | English | Bangla | Use |
| --- | --- | --- | --- |
| `--type-story-title-sm-ink-start` | 0.2 | 0.03 | Above the first title line of a list item |
| `--type-story-title-sm-ink-end` | 0.12 | 0.25 | Below the last title line (RankedList) |
| `--type-metadata-ink-end` | 0.18 | 0.33 | Below the meta line of the item above a rule |
| `--rank-chip-ink-start` | 0.205em | 0.17em | Above the ink of the serif digits in the RankedList chip (C-07), so the chip centers the ink. Measured at both chip sizes and weights |
| `--rank-chip-ink-end` | 0.143em | 0.19em | Below the ink of the same digits |

Change these values with the fonts or the role sizes. Section 8.2 gives the CSS.

## 4. Reader sizes

The article page has a reader size control with three steps.

| Step | Scale | Body, English | Body, Bangla | H3, English | H3, Bangla |
| --- | --- | --- | --- | --- | --- |
| A (default) | 1 | 18px | 19px | 28px | 26px |
| A+ | 1.2 | 21.6px | 22.8px | 33.6px | 31.2px |
| A++ | 1.4 | 25.2px | 26.6px | 39.2px | 36.4px |

Values are at the 1280px shell. On a 360px screen the body starts at 17px English and 18px Bangla.

The scale changes all text inside the article body (`TYP-15`):

- `type-article-body` (paragraphs and lists)
- `type-article-h2`, `type-article-h3`
- `type-blockquote`, `type-pullquote`
- `type-caption` inside the article

On the article page the scale also changes the `KeyPoints` and `ContextCard` headings (`type-article-h3`), their text and the key point numbers (`type-article-body`) (DR-388).

The scale does not change the article title, deck, metadata, navigation, buttons, header, footer or ads.

A reader size change eases the text to its new size over `--duration-slide` with `--ease-slide`. With reduced motion the size changes at once (DR-388).

The body has a floor of 17px English and 18px Bangla at every step.

Keep the reader setting on the device (local storage). Default to A.

## 5. Measures

Two kinds of width exist (`LAY-04`). Each kind has one owner.

| Kind | Owner | Tokens |
| --- | --- | --- |
| Container width | `spacing-layout-system.md`, Section 4.1 | `measure-shell`, `measure-rail`, `measure-reading-en`, `measure-reading-bn` |
| Line length cap | This document | `measure-article-title`, `measure-deck` |

### 5.1 Line length caps

A cap is a maximum line length for one role. The `type-*` utility applies the cap as `max-inline-size` only. It does not set `width`, margin or padding. When the container is narrower than the cap, the container applies.

| Token | Value | Roles |
| --- | --- | --- |
| `measure-article-title` | 56rem (896px) | `type-article-title` |
| `measure-deck` | 36rem (576px) | `type-deck`, `type-summary` |

Use rem for caps. Do not use `ch`, because the `ch` width is different in Bangla and English fonts.

Article text uses the reading column from the layout document: `measure-reading-en` (44rem) or `measure-reading-bn` (42rem).

### 5.2 Homepage hero

The hero has a fluid wrapper and a fixed 304px rail with a 24px gap (`LAY-05`). Below 1024px, the rail goes below the wrapper.

| Viewport | Shell | Wrapper (lead) | Rail |
| --- | --- | --- | --- |
| 1024px | 976px | 648px | 304px |
| 1280px | 1232px | 904px | 304px |
| 1366px and wider, FHD included | 1280px | 952px | 304px |

The lead summary stops at 576px (`measure-deck`), so it keeps approximately 60–70 characters per line in every wrapper width.

## 6. Rules

### TYP-01 Use only the roles in Section 3

Do not add new sizes or roles. If no role fits, ask for a new role.

### TYP-02 Use the role to select serif or sans

Use `font-editorial` for journalism. Use `font-ui` for the interface. A heading in a dialog is interface, so it uses sans. A headline on a card is journalism, so it uses serif.

### TYP-03 Set `lang` on every page and every other-language block

Set `<html lang="en">` or `<html lang="bn">`. Set `lang` on a block or phrase in the other language, for example `<span lang="en">RS-24 Yars</span>`.

### TYP-04 Keep language differences in the tokens

Use `:lang(bn)` in `typography.css`. Do not check the language in a component to set a font or size.

### TYP-05 Do not copy English metrics to Bangla

Use the Bangla line height in the role table. Use tracking 0 for Bangla. Do not use uppercase or letter spacing on Bangla labels.

Reason: Bangla vowel signs go above and below the line. English line heights make them touch.

### TYP-06 Use weights 400 to 700 only

Use the weight in the role table. Do not use 100 to 300, 800 or 900. Section 8.2 removes those weights from Tailwind (DR-235).

### TYP-07 Do not make fake styles

Set `font-synthesis: none`. Do not make Bangla italic. In Bangla, use weight 600 for `<em>` and 700 for `<strong>`.

### TYP-08 Use the default font width

Do not change the width axis to make text fit. Change the layout.

### TYP-09 Do not make text smaller to make it fit

If a headline is too long, change the layout. Do not clamp titles: long titles wrap (`CPT-08`, DR-237).

### TYP-10 Let the browser set the optical size

Use `font-optical-sizing: auto`. Do not set optical-size values in components.

### TYP-11 Keep the minimum sizes

| Text | Minimum |
| --- | --- |
| English interface text, labels, metadata, captions | 14px |
| Bangla interface text, labels, metadata, captions | 15px |
| English article body | 17px |
| Bangla article body | 18px |

### TYP-12 Keep line length in the measures

Put article text in `measure-reading-en` or `measure-reading-bn`. Do not let the deck, summary or article title go wider than their measure (Section 5).

### TYP-13 Balance large headings only

Use `text-wrap: balance` on display, page title, article title, lead story, large story title and pull quote. Do not use it on body text, metadata, captions or interface text.

### TYP-14 Use the color tokens for text color

Use `text-ink` for headlines, `text-ink-secondary` for body text and `text-ink-muted` for metadata and captions. Do not use `text-primary`, `text-secondary` or `text-muted` for text.

Reason: in shadcn/ui, `primary` is the button color and `muted` is a surface color.

### TYP-15 Scale all article text with the reader size

Apply `--reader-scale` to every role in Section 4. Do not apply it to other roles.

### TYP-16 Underline links in article text

Use the article role, `text-interactive` and an underline. Keep the paragraph weight. Do not change the link to sans. See `COL-07`.

### TYP-17 Format numbers and dates for the page language

Use `Intl.DateTimeFormat` and `Intl.NumberFormat` with `en-GB` or `bn-BD-u-nu-beng`. Plain `bn-BD` gives Latin digits in WebKit (DR-348). Keep identifiers as written, for example F-35, G7, 5G. Use `tabular-nums` for times, live updates, scores and tables.

**Story time (DR-274).** Show a relative time for 24 hours, then the date and time in the reader's time zone.

| Age | Bangla | English |
| --- | --- | --- |
| Under 1 hour | এইমাত্র | Just in |
| 1 to 23 hours (round down) | ১ ঘণ্টা আগে, ২ ঘণ্টা আগে | 1 hour ago, 2 hours ago |
| 24 hours or more | ১২ অক্টোবর, ১৪:৩০ | 12 Oct, 14:30 |

- Hours only. No minutes and no days.
- 24 hours or more: date and 24-hour time in the browser time zone. Add the year only for an earlier year.
- Put the exact time in `<time datetime>`. The server renders the Dhaka time; a small script (1.5 KB or less, no library; DR-348) writes the reader text on load, every few minutes and when the tab gets focus. Give `<time>` `suppressHydrationWarning`.
- This applies to every metadata line (hero, Latest, cards).

### TYP-18 Use utilities, not raw values

Use `type-*` utilities. Do not write `text-[57px]` or `leading-[1.07]` in a component. If a raw value is necessary, write the reason in the component.

### TYP-19 Let Fact Lens roles override shadcn/ui

Give shadcn/ui components a role from Section 7.3. Editorial components set their roles explicitly.

### TYP-20 Fix a visual problem in the token

Find the role. Change its token in `typography.css`. Do not change one component.

### TYP-21 Keep the same metrics in dark mode

Do not change size, weight or family in dark mode. Color tokens handle dark mode.

### TYP-22 Do not use opacity for hierarchy

Use `text-ink-muted`. See `COL-08`.

### TYP-23 Support zoom and user text spacing

Use `rem`. Make sure text does not clip or overlap at 200% zoom or with larger user letter, word and line spacing.

### TYP-24 Show meaning with more than style

Do not show meaning with weight, italic, size or color alone. Add a word, an icon or a structure.

### TYP-25 Break a word only when it does not fit

Set `overflow-wrap: break-word` on `body`. A word breaks only when it alone is wider than its line (DR-217, T-35). Do not use `word-break: break-all` or `hyphens: auto`.

## 7. Role mapping

### 7.1 Homepage

The component names are in `component-system.md` Section 3.

| Element | Role |
| --- | --- |
| Lead story headline (`LeadStory`) | `type-story-lead` |
| Top story in the hero (`OverlapCard`) | `type-story-title` (T-37) |
| Feature story of a section or a `CategoryBlock` | `type-story-title` (DR-152) |
| `StoryCard` size `sm`, `StoryListItem`, every region panel story (DR-254) | `type-story-title-sm` |
| Card summary | `type-summary` |
| Section heading (`SectionHeading`) | `type-section-title` |
| Logo text stand-in: TopBar; Footer and `Drawer.head` | `type-logo`; `type-logo-sm` (DR-306) |
| Region name in a region panel | `type-story-title-sm` |
| Category label (`Eyebrow`) | `type-eyebrow` |
| Time, author (`MetaLine`) | `type-metadata` |
| Most read rank chip | The chip digits: `--rank-chip-*` (`component-system.md` C-07, Section 6) |
| Most read title | `type-story-title-sm` |
| Opinion title | `type-story-title-sm` |
| Opinion author and time | `type-metadata`, author in 600 |
| Opinion chip মতামত (`Chip` label) | `type-eyebrow` on `brand` (dark: `interactive`), `text-on-interactive`. Not a link. The analysis column has no chip |
| Region chip (`Chip` filter) | `type-ui-sm` |
| "আরও দেখুন" link (`MoreLink`) | `type-ui-sm` at weight 600, `text-interactive` (DR-216) |
| Ad label | `type-eyebrow` at weight 600, `normal-case`, `text-ink-muted` (DR-216) |
| Poll heading; newsletter heading after prototype run 2 (DR-239) | `type-section-title` (DR-215) |
| Newsletter text line (after prototype run 2, DR-239) | `type-ui` |
| Email field | `type-input` |
| Vote button ভোট দিন (`Button` primary) | `type-button` |
| Poll question (`legend`) | `type-story-title-sm` |
| Poll options and result labels (with the own-vote tag) | `type-ui` |
| Poll percent, vote total | `type-ui-sm`, tabular digits in the page language |
| Privacy link (after prototype run 2, DR-239) | `type-ui-sm` at weight 600 (DR-216) |
| Form error and done messages | `type-ui-sm` |
| Top bar language link | `type-ui-sm` at weight 600 |
| Search clear button মুছুন (`Button` text) | `type-button` |
| Trending label ট্রেন্ডিং | `type-ui-sm` at weight 600, `text-ink-muted` |
| Trending terms | `type-ui-sm` at weight 600, `text-interactive`, no underline (`COL-06`, DR-216) |
| Footer links | `type-ui-sm` at weight 600 (DR-216) |
| Footer copyright | `type-metadata` |

Every homepage text uses a role in this table. Phones use the low end of each fluid role, so the hierarchy is the same at every width.

**Most read rank.**

- The list is an `<ol>`. The rank comes from the data (the backend most-read query), not from a CSS counter. React writes it in a `<span aria-hidden="true">` at the start of each item: Bangla digits on Bangla pages (১), Latin digits on English pages (1). No leading zero (DR-290).
- The rank is a square chip with serif digits in both languages (Source Serif 4, Noto Serif Bengali): sizes, weights and colors in `component-system.md` C-07 and Section 6; the ink insets in Section 3.1. `type-rank` is retired (IMP-99; amends DR-144, DR-146, DR-147).
- The CSS is `@utility rank-list` in `component-system.md` Section 6. Put the class on the `<ol>`: `<ol class="rank-list">` (DR-217).

**Other homepage rules.**

- The opinion quote mark is a decorative SVG icon with `aria-hidden="true"`. It is not a text glyph.
- Metadata order on every card: time, then reading time. Reading time comes from the optional story field `readingMinutes`. A story with no reading time shows the time only, with no separator (DR-272). Draw the separator with CSS as a 4px square, not a character (`CPT-10`). Put the time in `<time datetime>` and format it per `TYP-17`.
- Homepage heading outline (DR-275): a hidden `h1` ফ্যাক্ট লেন্স: প্রথম পাতা (English string from `en.ts`); a hidden `h2` names the hero; each section has its `h2`; each story title is an `h3`. The logo is a link, not the `h1`.
- Each "আরও দেখুন" link has the section name for screen readers, for example "আরও দেখুন: বাংলাদেশ". The visible text stays the same.
- Interface text is in the page language. Take every interface string from one string file per language (`src/i18n/bn.ts`, `src/i18n/en.ts`). A Bangla page has no English interface words.
- The language switch shows the other language in its own script, with a matching `lang` attribute. Bangla pages: "En" on phones (under 768px), "English" from 768px. English pages: "বাংলা" at every width (DR-174).
- Language redirect: a remembered English choice (cookie `fl-lang=en`) redirects to `/en` only at `/`. Every other URL, including a shared link, opens in its own language. Never read the browser language (DR-17, DR-270). The proxy runs on every path except `api/` and `_next/`; the `fl-lang` cookie is `Secure` in production; the `?lang=` redirect sends `Cache-Control: no-store` (DR-328).
- Every icon-only button (menu, theme, slider) has an accessible name in the page language.
- Region chips are as wide as their label. Do not truncate or shrink them (`TYP-09`). They are 44px tall or more.

A category label that links to its category uses `text-interactive`. A label that does not link uses `text-ink-muted`. Do not use `text-brand` for labels (`COL-04`).

Story prominence comes from the role, layout, image size, position and white space. Do not give one card its own size.

### 7.2 Article page

| Element | Role |
| --- | --- |
| Category | `type-eyebrow` |
| Headline (`h1`) | `type-article-title` |
| Deck | `type-deck` |
| Byline, date, reading time | `type-metadata` |
| Paragraphs and lists | `type-article-body` |
| Subheadings (`h2`, `h3`) | `type-article-h2`, `type-article-h3` |
| Quotation | `type-blockquote` |
| Pull quote | `type-pullquote` |
| Image caption | `type-caption` |
| Category in the heading (`ArticleHeader`, a filled button) | `type-eyebrow` |
| Metadata line under the deck | `type-metadata`, `--color-meta` |
| Byline name; role | `type-ui`; `type-metadata` |
| Avatar initials, text size glyphs (A, A+, A++) | `type-button` |
| `KeyPoints` and `ContextCard` headings | `type-article-h3` |
| Key point text and numbers; `ContextCard` parts | `type-article-body` |
| `KeyPoints` note, `ContextCard` teaser | `type-metadata` |
| `ContextCard` part labels | `type-eyebrow`, no uppercase (DR-216) |
| Rail title, popover label | `type-eyebrow` |
| Contents links | `type-nav` |
| Minutes left (rail); progress percent, dock line, selection bar, toast | `type-metadata` with `type-ui-sm`; `type-ui-sm` |
| Read next heading | `type-section-title` |

Paragraph gap is 1.1em. Do not indent paragraphs. The spacing tokens in `spacing-layout-system.md` set the space around headings.

### 7.3 shadcn/ui components

| Component | Role |
| --- | --- |
| Button | `type-button` |
| Input, Textarea | `type-input` |
| Select trigger, Navigation menu | `type-ui` |
| Dropdown item, Tabs, Tooltip, Toast, Breadcrumb | `type-ui-sm` |
| Dialog title | `type-ui` with weight 600 |
| Dialog description | `type-ui-sm` |
| Badge | `type-eyebrow` |

### 7.4 Navigation

Use `type-nav` for the nav row (from 1280px): 16px on Bangla pages, 14px on English pages, weight 600 (DR-295, DR-346). Use `type-ui` with weight 600 for the drawer (all widths). Use `type-ui-sm` with weight 500 for drawer sub-items. Do not use serif in navigation.

## 8. Implementation

### 8.1 Font loading

Put this in `src/app/fonts.ts`. Add the four `variable` classes to `<html>`.

```ts
import {
  Source_Serif_4,
  Plus_Jakarta_Sans,
  Noto_Serif_Bengali,
  Noto_Sans_Bengali,
} from "next/font/google";

export const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  variable: "--font-noto-serif-bengali",
  display: "swap",
});

export const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-noto-sans-bengali",
  display: "swap",
});
```

Load only the families above. Do not load fonts from a CSS `@import` or another CDN.

### 8.2 Tokens and utilities

Put this in `src/styles/typography.css`. For the import order, see `spacing-layout-system.md` Section 12.5 (DR-339). It defines the line length caps (Section 5.1). It works with Tailwind 4.

```css
/* Remove the Tailwind default font families, text sizes and weights (TYP-01, TYP-06, DR-235).
   Only the Fact Lens roles and the weights 400 to 700 exist. */
@theme {
  --font-*: initial;
  --text-*: initial;
  --font-weight-*: initial;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --default-font-family: var(--font-ui-active);
}

@theme inline {
  --font-editorial: var(--font-editorial-active);
  --font-ui: var(--font-ui-active);
}

:root {
  --reader-scale: 1;

  /* Line length caps (Section 5.1). Typography owns these tokens. */
  --measure-article-title: 56rem;
  --measure-deck: 36rem;
}

/* English values. :lang(en) gives an English block on a Bangla page English type (TYP-03, DR-203).
   Language-free tokens stay on :root only: a :lang(en) copy of --reader-scale would reset the reader size. */
:root,
:lang(en) {
  --font-editorial-active: var(--font-source-serif), Georgia, "Times New Roman", serif;
  --font-ui-active: var(--font-plus-jakarta), system-ui, -apple-system, "Segoe UI", Arial, sans-serif;

  --type-body-min: 1.0625rem;
  --type-eyebrow-case: uppercase;
  --type-blockquote-style: italic;

  --type-display-size: clamp(2.75rem, 2.261rem + 2.174vw, 4rem);
  --type-display-weight: 600;
  --type-display-line: 1.02;
  --type-display-tracking: -0.03em;
  --type-page-title-size: clamp(2.125rem, 1.783rem + 1.522vw, 3rem);
  --type-page-title-weight: 600;
  --type-page-title-line: 1.06;
  --type-page-title-tracking: -0.025em;
  --type-article-title-size: clamp(2.25rem, 1.957rem + 1.304vw, 3rem);
  --type-article-title-weight: 600;
  --type-article-title-line: 1.06;
  --type-article-title-tracking: -0.025em;
  --type-story-lead-size: clamp(1.875rem, 1.582rem + 1.304vw, 2.625rem);
  --type-story-lead-weight: 600;
  --type-story-lead-line: 1.08;
  --type-story-lead-tracking: -0.02em;
  --type-story-title-lg-size: clamp(1.625rem, 1.429rem + 0.87vw, 2.125rem);
  --type-story-title-lg-weight: 600;
  --type-story-title-lg-line: 1.12;
  --type-story-title-lg-tracking: -0.015em;
  --type-story-title-size: clamp(1.375rem, 1.277rem + 0.435vw, 1.625rem);
  --type-story-title-weight: 600;
  --type-story-title-line: 1.16;
  --type-story-title-tracking: -0.01em;
  --type-story-title-sm-size: clamp(1.125rem, 1.076rem + 0.217vw, 1.25rem);
  --type-story-title-sm-weight: 600;
  --type-story-title-sm-line: 1.2;
  --type-story-title-sm-tracking: -0.005em;
  --type-deck-size: clamp(1.125rem, 1.027rem + 0.435vw, 1.375rem);
  --type-deck-weight: 400;
  --type-deck-line: 1.45;
  --type-deck-tracking: 0;
  --type-summary-size: 1rem;
  --type-summary-weight: 500;
  --type-summary-line: 1.5;
  --type-summary-tracking: 0;
  --type-article-body-size: clamp(1.062rem, 1.038rem + 0.109vw, 1.125rem);
  --type-article-body-weight: 400;
  --type-article-body-line: 1.68;
  --type-article-body-tracking: 0;
  --type-article-h2-size: clamp(1.75rem, 1.554rem + 0.87vw, 2.25rem);
  --type-article-h2-weight: 600;
  --type-article-h2-line: 1.15;
  --type-article-h2-tracking: -0.015em;
  --type-article-h3-size: clamp(1.375rem, 1.228rem + 0.652vw, 1.75rem);
  --type-article-h3-weight: 600;
  --type-article-h3-line: 1.22;
  --type-article-h3-tracking: -0.01em;
  --type-blockquote-size: clamp(1.125rem, 1.027rem + 0.435vw, 1.375rem);
  --type-blockquote-weight: 400;
  --type-blockquote-line: 1.6;
  --type-blockquote-tracking: 0;
  --type-pullquote-size: clamp(1.75rem, 1.554rem + 0.87vw, 2.25rem);
  --type-pullquote-weight: 500;
  --type-pullquote-line: 1.2;
  --type-pullquote-tracking: -0.015em;
  --type-section-title-size: 1.375rem;
  --type-section-title-weight: 600;
  --type-section-title-line: 1.25;
  --type-section-title-tracking: -0.01em;
  --type-eyebrow-size: 0.875rem;
  --type-eyebrow-weight: 700;
  --type-eyebrow-line: 1.2;
  --type-eyebrow-tracking: 0.06em;
  --type-metadata-size: 0.875rem;
  --type-metadata-weight: 400;
  --type-metadata-line: 1.4;
  --type-metadata-tracking: 0.01em;
  /* Ink inset (Section 3.1, DR-355) */
  --type-story-title-sm-ink-start: calc(var(--type-story-title-sm-size) * 0.2);
  --type-story-title-sm-ink-end: calc(var(--type-story-title-sm-size) * 0.12);
  --type-metadata-ink-end: calc(var(--type-metadata-size) * 0.18);
  /* RankedList chip digits, a share of the digit size (components.css) */
  --rank-chip-ink-start: 0.205em;
  --rank-chip-ink-end: 0.143em;
  --type-caption-size: 0.875rem;
  --type-caption-weight: 400;
  --type-caption-line: 1.5;
  --type-caption-tracking: 0;
  --type-ui-size: 1rem;
  --type-ui-weight: 500;
  --type-ui-line: 1.4;
  --type-ui-tracking: 0;
  --type-ui-sm-size: 0.875rem;
  --type-ui-sm-weight: 500;
  --type-ui-sm-line: 1.4;
  --type-ui-sm-tracking: 0;
  --type-nav-size: 0.875rem;
  --type-nav-weight: 600;
  --type-nav-line: 1.4;
  --type-button-size: 0.875rem;
  --type-button-weight: 600;
  --type-button-line: 1.2;
  --type-button-tracking: 0;
  --type-logo-size: 1.25rem;
  --type-logo-weight: 700;
  --type-logo-line: 1;
  --type-input-size: 1rem;
  --type-input-weight: 400;
  --type-input-line: 1.4;
  --type-input-tracking: 0;
}

:lang(bn) {
  --font-editorial-active: var(--font-noto-serif-bengali), var(--font-source-serif), "Noto Serif", serif;
  --font-ui-active: var(--font-noto-sans-bengali), var(--font-plus-jakarta), "Nirmala UI", sans-serif;

  --type-body-min: 1.125rem;
  --type-eyebrow-case: none;
  --type-blockquote-style: normal;

  --type-display-size: clamp(2.5rem, 2.109rem + 1.739vw, 3.5rem);
  --type-display-weight: 600;
  --type-display-line: 1.16;
  --type-display-tracking: 0;
  --type-page-title-size: clamp(2rem, 1.707rem + 1.304vw, 2.75rem);
  --type-page-title-weight: 600;
  --type-page-title-line: 1.18;
  --type-page-title-tracking: 0;
  --type-article-title-size: clamp(2.125rem, 1.88rem + 1.087vw, 2.75rem);
  --type-article-title-weight: 600;
  --type-article-title-line: 1.18;
  --type-article-title-tracking: 0;
  --type-story-lead-size: clamp(1.75rem, 1.457rem + 1.304vw, 2.5rem);
  --type-story-lead-weight: 600;
  --type-story-lead-line: 1.2;
  --type-story-lead-tracking: 0;
  --type-story-title-lg-size: clamp(1.625rem, 1.478rem + 0.652vw, 2rem);
  --type-story-title-lg-weight: 600;
  --type-story-title-lg-line: 1.22;
  --type-story-title-lg-tracking: 0;
  --type-story-title-size: clamp(1.375rem, 1.277rem + 0.435vw, 1.625rem);
  --type-story-title-weight: 600;
  --type-story-title-line: 1.26;
  --type-story-title-tracking: 0;
  --type-story-title-sm-size: clamp(1.125rem, 1.076rem + 0.217vw, 1.25rem);
  --type-story-title-sm-weight: 600;
  --type-story-title-sm-line: 1.3;
  --type-story-title-sm-tracking: 0;
  --type-deck-size: clamp(1.125rem, 1.052rem + 0.326vw, 1.312rem);
  --type-deck-weight: 400;
  --type-deck-line: 1.55;
  --type-deck-tracking: 0;
  --type-summary-size: 1.0625rem;
  --type-summary-weight: 500;
  --type-summary-line: 1.6;
  --type-summary-tracking: 0;
  --type-article-body-size: clamp(1.125rem, 1.101rem + 0.109vw, 1.188rem);
  --type-article-body-weight: 400;
  --type-article-body-line: 1.76;
  --type-article-body-tracking: 0;
  --type-article-h2-size: clamp(1.625rem, 1.429rem + 0.87vw, 2.125rem);
  --type-article-h2-weight: 600;
  --type-article-h2-line: 1.28;
  --type-article-h2-tracking: 0;
  --type-article-h3-size: clamp(1.375rem, 1.277rem + 0.435vw, 1.625rem);
  --type-article-h3-weight: 600;
  --type-article-h3-line: 1.34;
  --type-article-h3-tracking: 0;
  --type-blockquote-size: clamp(1.188rem, 1.114rem + 0.326vw, 1.375rem);
  --type-blockquote-weight: 500;
  --type-blockquote-line: 1.68;
  --type-blockquote-tracking: 0;
  --type-pullquote-size: clamp(1.625rem, 1.429rem + 0.87vw, 2.125rem);
  --type-pullquote-weight: 500;
  --type-pullquote-line: 1.32;
  --type-pullquote-tracking: 0;
  --type-section-title-size: 1.375rem;
  --type-section-title-weight: 600;
  --type-section-title-line: 1.3;
  --type-section-title-tracking: 0;
  --type-eyebrow-size: 0.9375rem;
  --type-eyebrow-weight: 600;
  --type-eyebrow-line: 1.35;
  --type-eyebrow-tracking: 0;
  --type-metadata-size: 0.9375rem;
  --type-metadata-weight: 400;
  --type-metadata-line: 1.5;
  --type-metadata-tracking: 0;
  /* Ink inset (Section 3.1, DR-355) */
  --type-story-title-sm-ink-start: calc(var(--type-story-title-sm-size) * 0.03);
  --type-story-title-sm-ink-end: calc(var(--type-story-title-sm-size) * 0.25);
  --type-metadata-ink-end: calc(var(--type-metadata-size) * 0.33);
  /* RankedList chip digits, a share of the digit size (components.css) */
  --rank-chip-ink-start: 0.17em;
  --rank-chip-ink-end: 0.19em;
  --type-caption-size: 0.9375rem;
  --type-caption-weight: 400;
  --type-caption-line: 1.6;
  --type-caption-tracking: 0;
  --type-ui-size: 1rem;
  --type-ui-weight: 500;
  --type-ui-line: 1.5;
  --type-ui-tracking: 0;
  --type-ui-sm-size: 0.9375rem;
  --type-ui-sm-weight: 500;
  --type-ui-sm-line: 1.5;
  --type-ui-sm-tracking: 0;
  --type-nav-size: 1rem;
  --type-nav-weight: 600;
  --type-nav-line: 1.5;
  --type-button-size: 0.9375rem;
  --type-button-weight: 600;
  --type-button-line: 1.35;
  --type-button-tracking: 0;
  --type-logo-line: 1.1;
  --type-input-size: 1rem;
  --type-input-weight: 400;
  --type-input-line: 1.5;
  --type-input-tracking: 0;
}

[data-reader-size="lg"] { --reader-scale: 1.2; }
[data-reader-size="xl"] { --reader-scale: 1.4; }

body {
  font-family: var(--font-ui-active);
  font-synthesis: none;
  overflow-wrap: break-word; /* TYP-25 */
  font-optical-sizing: auto;
}

@media (min-width: 48rem) {
  :root,
  :lang(en) { --type-logo-size: 1.75rem; }
}

@media (min-width: 64rem) {
  :root,
  :lang(en) { --type-logo-size: 2rem; }
}

:lang(bn) em { font-style: normal; font-weight: 600; }
:lang(bn) strong { font-weight: 700; }

@utility type-display {
  font-family: var(--font-editorial-active);
  font-size: var(--type-display-size);
  font-weight: var(--type-display-weight);
  line-height: var(--type-display-line);
  letter-spacing: var(--type-display-tracking);
  text-wrap: balance;
}

@utility type-page-title {
  font-family: var(--font-editorial-active);
  font-size: var(--type-page-title-size);
  font-weight: var(--type-page-title-weight);
  line-height: var(--type-page-title-line);
  letter-spacing: var(--type-page-title-tracking);
  text-wrap: balance;
}

@utility type-article-title {
  font-family: var(--font-editorial-active);
  font-size: var(--type-article-title-size);
  font-weight: var(--type-article-title-weight);
  line-height: var(--type-article-title-line);
  letter-spacing: var(--type-article-title-tracking);
  text-wrap: balance;
  max-inline-size: var(--measure-article-title);
}

@utility type-story-lead {
  font-family: var(--font-editorial-active);
  font-size: var(--type-story-lead-size);
  font-weight: var(--type-story-lead-weight);
  line-height: var(--type-story-lead-line);
  letter-spacing: var(--type-story-lead-tracking);
  text-wrap: balance;
}

@utility type-story-title-lg {
  font-family: var(--font-editorial-active);
  font-size: var(--type-story-title-lg-size);
  font-weight: var(--type-story-title-lg-weight);
  line-height: var(--type-story-title-lg-line);
  letter-spacing: var(--type-story-title-lg-tracking);
  text-wrap: balance;
}

@utility type-story-title {
  font-family: var(--font-editorial-active);
  font-size: var(--type-story-title-size);
  font-weight: var(--type-story-title-weight);
  line-height: var(--type-story-title-line);
  letter-spacing: var(--type-story-title-tracking);
}

@utility type-story-title-sm {
  font-family: var(--font-editorial-active);
  font-size: var(--type-story-title-sm-size);
  font-weight: var(--type-story-title-sm-weight);
  line-height: var(--type-story-title-sm-line);
  letter-spacing: var(--type-story-title-sm-tracking);
}

@utility type-deck {
  font-family: var(--font-editorial-active);
  font-size: var(--type-deck-size);
  font-weight: var(--type-deck-weight);
  line-height: var(--type-deck-line);
  letter-spacing: var(--type-deck-tracking);
  max-inline-size: var(--measure-deck);
}

@utility type-summary {
  font-family: var(--font-editorial-active);
  font-size: var(--type-summary-size);
  font-weight: var(--type-summary-weight);
  line-height: var(--type-summary-line);
  letter-spacing: var(--type-summary-tracking);
  max-inline-size: var(--measure-deck);
}

@utility type-article-body {
  font-family: var(--font-editorial-active);
  font-size: max(var(--type-body-min), calc(var(--type-article-body-size) * var(--reader-scale)));
  font-weight: var(--type-article-body-weight);
  line-height: var(--type-article-body-line);
  letter-spacing: var(--type-article-body-tracking);
}

@utility type-article-h2 {
  font-family: var(--font-editorial-active);
  font-size: calc(var(--type-article-h2-size) * var(--reader-scale));
  font-weight: var(--type-article-h2-weight);
  line-height: var(--type-article-h2-line);
  letter-spacing: var(--type-article-h2-tracking);
}

@utility type-article-h3 {
  font-family: var(--font-editorial-active);
  font-size: calc(var(--type-article-h3-size) * var(--reader-scale));
  font-weight: var(--type-article-h3-weight);
  line-height: var(--type-article-h3-line);
  letter-spacing: var(--type-article-h3-tracking);
}

@utility type-blockquote {
  font-family: var(--font-editorial-active);
  font-size: calc(var(--type-blockquote-size) * var(--reader-scale));
  font-weight: var(--type-blockquote-weight);
  line-height: var(--type-blockquote-line);
  letter-spacing: var(--type-blockquote-tracking);
  font-style: var(--type-blockquote-style);
}

@utility type-pullquote {
  font-family: var(--font-editorial-active);
  font-size: calc(var(--type-pullquote-size) * var(--reader-scale));
  font-weight: var(--type-pullquote-weight);
  line-height: var(--type-pullquote-line);
  letter-spacing: var(--type-pullquote-tracking);
  text-wrap: balance;
}

@utility type-section-title {
  font-family: var(--font-editorial-active);
  font-size: var(--type-section-title-size);
  font-weight: var(--type-section-title-weight);
  line-height: var(--type-section-title-line);
  letter-spacing: var(--type-section-title-tracking);
}

@utility type-logo {
  font-family: var(--font-editorial-active);
  font-size: var(--type-logo-size);
  font-weight: var(--type-logo-weight);
  line-height: var(--type-logo-line);
  /* Stuck bar: the logo scales to 24px with a transform (C-17, DR-349, DR-355), not here. */
}

@utility type-logo-sm {
  font-family: var(--font-editorial-active);
  font-size: 1.5rem;
  font-weight: var(--type-logo-weight);
  line-height: var(--type-logo-line);
}

@utility type-eyebrow {
  font-family: var(--font-ui-active);
  font-size: var(--type-eyebrow-size);
  font-weight: var(--type-eyebrow-weight);
  line-height: var(--type-eyebrow-line);
  letter-spacing: var(--type-eyebrow-tracking);
  text-transform: var(--type-eyebrow-case);
}

@utility type-metadata {
  font-family: var(--font-ui-active);
  font-size: var(--type-metadata-size);
  font-weight: var(--type-metadata-weight);
  line-height: var(--type-metadata-line);
  letter-spacing: var(--type-metadata-tracking);
}

@utility type-caption {
  font-family: var(--font-ui-active);
  font-size: calc(var(--type-caption-size) * var(--reader-scale));
  font-weight: var(--type-caption-weight);
  line-height: var(--type-caption-line);
  letter-spacing: var(--type-caption-tracking);
}

@utility type-ui {
  font-family: var(--font-ui-active);
  font-size: var(--type-ui-size);
  font-weight: var(--type-ui-weight);
  line-height: var(--type-ui-line);
  letter-spacing: var(--type-ui-tracking);
}

@utility type-ui-sm {
  font-family: var(--font-ui-active);
  font-size: var(--type-ui-sm-size);
  font-weight: var(--type-ui-sm-weight);
  line-height: var(--type-ui-sm-line);
  letter-spacing: var(--type-ui-sm-tracking);
}

@utility type-nav {
  font-family: var(--font-ui-active);
  font-size: var(--type-nav-size);
  font-weight: var(--type-nav-weight);
  line-height: var(--type-nav-line);
}

@utility type-button {
  font-family: var(--font-ui-active);
  font-size: var(--type-button-size);
  font-weight: var(--type-button-weight);
  line-height: var(--type-button-line);
  letter-spacing: var(--type-button-tracking);
}

@utility type-input {
  font-family: var(--font-ui-active);
  font-size: var(--type-input-size);
  font-weight: var(--type-input-weight);
  line-height: var(--type-input-line);
  letter-spacing: var(--type-input-tracking);
}
```

Put `data-reader-size` on the article element, not on `<html>`. Then only the article text scales.

### 8.3 Usage

```tsx
<article lang="bn" data-reader-size="lg">
  {/* Layout sets the column: measure-reading-bn */}
  <span className="type-eyebrow text-interactive">বিশ্লেষণ</span>
  <h1 className="type-article-title text-ink">…</h1>
  <p className="type-deck text-ink-secondary">…</p>
  <p className="type-metadata text-ink-muted">…</p>
  <p className="type-article-body text-ink-secondary">
    … <a className="text-interactive underline underline-offset-[0.2em]" href="…">…</a> …
  </p>
</article>
```

### 8.4 Files

| File | Holds |
| --- | --- |
| `src/app/fonts.ts` | Font loading (Section 8.1) |
| `src/styles/colors.css` | Color tokens (`color-system.md`) |
| `src/styles/typography.css` | Typography tokens and utilities (Section 8.2) |
| `src/app/globals.css` | The imports and base rules (`spacing-layout-system.md` Sections 12.4 and 12.5) |
| `src/components/ui/` | shadcn/ui components |
| `src/components/editorial/` | Story and article components |

## 9. Prototype checks

Check these items in the first prototype, in English and Bangla, on desktop and mobile. Change the token, not the component (`TYP-20`).

| Item | What to check | Start value |
| --- | --- | --- |
| Hero | Lead looks dominant at 1024px (648px wrapper). Bangla rail titles fit at 304px | Fluid wrapper + 304px rail (Section 5.2) |
| Article title | Line height and tracking look tight in both languages | EN 1.06 / −0.025em, BN 1.18. Test EN 1.12 / −0.015em. Width: `measure-article-title` 56rem. |
| Article headings at A++ | H2 at A++ (50px EN, 48px BN) comes close to the article title (60px, 56px) | Reader scale 1.4 |
| Bangla article body | Line height can be too loose | 1.76. Test 1.70. |
| Bangla small text | Eyebrow, metadata and caption are easy to see | 15px |
| Source Serif 4 | Source Serif 4 has a larger x-height than Newsreader, so text looks larger at the same size. Check body 18px and the headline sizes. | Role table |
| Rail titles | Bangla rail titles and summaries in the 304px rail | `type-story-title-sm` 18–20px, `type-summary` |
| Hero titles | The two top stories use `type-story-title`, so the lead title leads at 1024px (T-37, DR-85) | `type-story-title` 22–26px |
| Reader sizes | A+ and A++ are clearly different and the layout does not break | 1, 1.2, 1.4 |
| Colors | Some colors can change after prototype rounds. See `color-system.md` Section 6. | `color-system.md` v2.1 |

## 10. Open items

| Item | When |
| --- | --- |
| Load only the fonts for the page language (for example no Bangla fonts on English pages) | After a performance measurement |
| Typography for charts and data | When the Data/Visual format starts |
| Print styles | Before release v1 |

## 11. Changelog

| Version | Date | Change |
| --- | --- | --- |
| 2.19 | 2026-10-27 | Homepage most read (IMP-99, spec log `home-most-read.md` HM-03, HM-05): `type-rank` and the `--type-rank-*` tokens retired, with the numeral rules of `rank-list`; the rank is the chip of `component-system.md` C-07, whose `@utility rank-list` is in that file's Section 6 (amends DR-144, DR-146, DR-147). Section 7.1 role map and the most read notes follow. |
| 2.18 | 2026-10-27 | Category page (tajmin, U-44): Section 3.1 and 8.2 add `--rank-chip-ink-start` and `--rank-chip-ink-end` per language, the ink insets of the RankedList `columns` chip digits (C-07). |
| 2.17 | 2026-10-24 | Article page, checkpoint 1 (DR-385, DR-388): `type-article-title` 36–48px English, 34–44px Bangla, largest from 1280 (was 40–60 and 38–56). Section 4: the reader size also scales `KeyPoints` and `ContextCard`; a size change eases over `--duration-slide`. Section 7.2: article page role map for the new parts. |
| 2.16 | 2026-10-17 | New Section 3.1 ink inset: `--type-story-title-sm-ink-start`, `--type-story-title-sm-ink-end`, `--type-metadata-ink-end` per language, for the Divider.item space measured to the ink (DR-350, DR-355). `type-logo`: the stuck 24px is a transform (C-17); the stuck font-size rule is removed from Section 8.2 (DR-355). |
| 2.15 | 2026-10-16 | New role `type-nav` (14px English, 16px Bangla, weight 600) for the NavBar items; no `lang-bn` variant (DR-346). TYP-17: locale `bn-BD-u-nu-beng`; story time script 1.5 KB or less (DR-348). |
| 2.14 | 2026-10-15 | Section 8.2 links to the one `globals.css` import list (layout Section 12.5, DR-339); Section 8.4 lists `globals.css`. |
| 2.13 | 2026-10-15 | New role `type-logo` (20 / 28 / 32px, 24px when the bar is stuck) and `type-logo-sm` (24px) for the logo text stand-in (DR-306). Proxy and cookie rules in the language rules (DR-328). |
| 2.12 | 2026-10-14 | Most read rank from the data in an `aria-hidden` span, digits in the page language; `rank-list` has no counter (DR-290). Nav row: Bangla `type-ui` 16px, English unchanged (DR-295). |
| 2.11 | 2026-10-13 | Story time: relative for 24 hours (এইমাত্র, hours ago), then date and time in the reader's time zone (TYP-17, DR-274). Homepage heading outline (DR-275). |
| 2.10 | 2026-10-13 | Poll result labels and the own-vote tag use `type-ui`; the percent and the total use `type-ui-sm` (C-26, DR-273). |
| 2.9 | 2026-10-13 | Reading time is optional (`readingMinutes`); no reading time shows the time only (DR-272). Language redirect only at `/` (DR-270). |
| 2.8 | 2026-10-10 | Newsletter rows apply after prototype run 2: NewsletterSignup is paused for run 2 (DR-239). |
| 2.7 | 2026-10-10 | `TYP-09` has no line clamp; long titles wrap (DR-237). Section 8.2 removes the Tailwind default fonts, text sizes and weights outside 400 to 700, and sets the default font to the UI stack (DR-235). |
| 2.6 | 2026-10-10 | `type-module-title` removed (DR-196); newsletter and poll headings use `type-section-title` (DR-215). UI links use `type-ui-sm` 600, Drawer rows `type-ui` 600; English uppercase only on Eyebrow and Chip (DR-216). Rank CSS is `@utility rank-list` in §8.2; new rule `TYP-25` (DR-217). |
| 2.5 | 2026-10-09 | English role values apply on `:root` and `:lang(en)`, so an English block on a Bangla page gets English type; `--reader-scale` and the measures stay on `:root` only (DR-203). |
| 2.4 | 2026-10-09 | Homepage roles follow the component pass: `type-summary` 500 (DR-97), `type-metadata` 400 (DR-96), `type-section-title` serif 22px 600 (DR-163), new role `type-module-title` (DR-131, DR-139), `type-button` 14px English, 15px Bangla (C-12, DR-208), `type-rank` 700, 44px and 56px, Bangla in Noto Sans Bengali (DR-146, DR-147), Most read 3 per row at 1024–1279 (DR-145), hero top stories `type-story-title` (DR-85). Role map names the components. |
| 2.3.1 | 2026-10-07 | Weight table and usage example follow DR-25: links in article text keep the paragraph weight and have an underline. |
| 2.3 | 2026-10-06 | Links in article text are underlined, in the paragraph weight (DR-25). |
| 2.2 | 2026-10-06 | New role `type-rank` with fixed sizes per width. Homepage role map covers every homepage text (T-23 to T-31). Opinion chip is a plain label. Interface text in the page language. |
| 2.1 | 2026-10-06 | Section 5 follows the width model in `LAY-04`: typography owns the line length caps `measure-article-title` and `measure-deck`; layout owns container widths. Hero widths use the fixed 304px rail and the 24px gap (no 2xl tier). Navigation roles name the nav row and the drawer. |
| 2.0 | 2026-10-05 | Source Serif 4 replaces Newsreader. Noto Sans Bengali (Google Fonts) replaces Noto Sans Bengali UI. Fluid sizes stop at 1280px. Eyebrow, metadata and caption are 14px English and 15px Bangla. New role `type-summary`. `type-story-title-lg` is 26–34px English, 26–32px Bangla. Reader sizes are A, A+ (1.2) and A++ (1.4); A− is removed. All article text scales with the reader size. Body floor 17px / 18px. Deck and summary measure 36rem. Article title uses `measure-article-title` from the layout document. Bangla `<em>` is weight 600. Bangla stacks include the English fonts for Latin text. Links in article text are weight 600 with no underline. Text color uses `ink-*` tokens. Number and date formatting rule added. Rewritten in ASD-STE100 style with rule IDs. |
| 1.0 | Before 2026-10-05 | First version. |
