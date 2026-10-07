# Fact Lens Typography System

Version 2.3.1 · 7 October 2026 · Approved for the first prototype

This document is the single source for Fact Lens typography. It is for designers, developers and AI agents. Other documents link to the role table in Section 3. They do not copy values.

Fact Lens publishes in Bangla and English. Each language has its own fonts and metrics, but both languages use the same role names.

The values are approved for the first prototype. Section 9 lists what to check in the prototype. Some values can change after that check.

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
- Follow the **rules** (Section 6). Each rule has a stable ID, for example `TYP-04`. Use the ID in reviews, prompts and the decision register.
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
| 400 | Article body, deck, summary, caption, input values, links in article text (paragraph weight) |
| 500 | Interface text, metadata, pull quotes, Bangla blockquotes |
| 600 | Headlines, titles, buttons, Bangla `<em>` |
| 700 | Section titles, English eyebrow, `<strong>` |

Load italic for Source Serif 4 only. Bangla fonts have no italic.

## 3. Role table

There are 23 roles. Fluid sizes grow from a 360px viewport to a 1280px viewport, then stop. The page shell also stops at 1280px. Section 8.2 gives the `clamp()` values.

Tracking for Bangla is 0 in every role.

| Role | Family | English size | Weight | Line height | Tracking | Bangla size | Weight | Line height | Use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `type-display` | Serif | 44–64px | 600 | 1.02 | -0.03em | 40–56px | 600 | 1.16 | Brand moments, special pages |
| `type-page-title` | Serif | 34–48px | 600 | 1.06 | -0.025em | 32–44px | 600 | 1.18 | Section and category page titles |
| `type-article-title` | Serif | 40–60px | 600 | 1.06 | -0.025em | 38–56px | 600 | 1.18 | The article headline (h1) |
| `type-story-lead` | Serif | 30–42px | 600 | 1.08 | -0.02em | 28–40px | 600 | 1.2 | Lead story on the homepage |
| `type-story-title-lg` | Serif | 26–34px | 600 | 1.12 | -0.015em | 26–32px | 600 | 1.22 | Second-level story in a lead group |
| `type-story-title` | Serif | 22–26px | 600 | 1.16 | -0.01em | 22–26px | 600 | 1.26 | Standard story card |
| `type-story-title-sm` | Serif | 18–20px | 600 | 1.2 | -0.005em | 18–20px | 600 | 1.3 | Compact cards and lists |
| `type-deck` | Serif | 18–22px | 400 | 1.45 | 0 | 18–21px | 400 | 1.55 | Standfirst under the article title |
| `type-summary` | Serif | 16px | 400 | 1.5 | 0 | 17px | 400 | 1.6 | Short summary on story cards |
| `type-article-body` | Serif | 17–18px | 400 | 1.68 | 0 | 18–19px | 400 | 1.76 | Article paragraphs and lists |
| `type-article-h2` | Serif | 28–36px | 600 | 1.15 | -0.015em | 26–34px | 600 | 1.28 | Subheading in the article |
| `type-article-h3` | Serif | 22–28px | 600 | 1.22 | -0.01em | 22–26px | 600 | 1.34 | Minor subheading in the article |
| `type-blockquote` | Serif | 18–22px | 400 | 1.6 | 0 | 19–22px | 500 | 1.68 | Quoted text in the article |
| `type-pullquote` | Serif | 28–36px | 500 | 1.2 | -0.015em | 26–34px | 500 | 1.32 | Pulled quote in the article |
| `type-section-title` | Sans | 20–24px | 700 | 1.2 | -0.01em | 20–24px | 700 | 1.3 | Homepage section heading |
| `type-eyebrow` | Sans | 14px | 700 | 1.2 | 0.06em | 15px | 600 | 1.35 | Category and label above a headline |
| `type-metadata` | Sans | 14px | 500 | 1.4 | 0.01em | 15px | 500 | 1.5 | Byline, date, reading time |
| `type-caption` | Sans | 14px | 400 | 1.5 | 0 | 15px | 400 | 1.6 | Image and figure captions |
| `type-ui` | Sans | 16px | 500 | 1.4 | 0 | 16px | 500 | 1.5 | Standard interface text |
| `type-ui-sm` | Sans | 14px | 500 | 1.4 | 0 | 15px | 500 | 1.5 | Navigation, tabs, menus, tooltips |
| `type-button` | Sans | 14px | 600 | 1.2 | 0 | 15px | 600 | 1.35 | Buttons |
| `type-input` | Sans | 16px | 400 | 1.4 | 0 | 16px | 400 | 1.5 | Form input values |
| `type-rank` | Serif | 40px; 48px from 1024 | 600 | 1 | 0 | 40px; 48px from 1024 | 600 | 1 | Most read rank numeral (Section 7.1) |

Notes:

- `type-eyebrow` is uppercase in English. Bangla has no case.
- `type-blockquote` is italic in English. In Bangla it uses weight 500.

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

The scale does not change the article title, deck, metadata, navigation, buttons, header, footer or ads.

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

Use the weight in the role table. Do not use 800 or 900.

### TYP-07 Do not make fake styles

Set `font-synthesis: none`. Do not make Bangla italic. In Bangla, use weight 600 for `<em>` and 700 for `<strong>`.

### TYP-08 Use the default font width

Do not change the width axis to make text fit. Change the layout.

### TYP-09 Do not make text smaller to make it fit

If a headline is too long, change the layout or use a line clamp. Clamp compact cards to 2 or 3 lines and standard cards to 3 lines. Do not clamp article titles or article text.

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

Use `Intl.DateTimeFormat` and `Intl.NumberFormat` with `en-GB` or `bn-BD`. Keep identifiers as written, for example F-35, G7, 5G. Use `tabular-nums` for times, live updates, scores and tables.

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

## 7. Role mapping

### 7.1 Homepage

| Element | Role |
| --- | --- |
| Lead story headline | `type-story-lead` |
| Second-level story in a lead group | `type-story-title-lg` |
| Standard story card | `type-story-title` |
| Compact card or list | `type-story-title-sm` |
| Card summary | `type-summary` |
| Section heading | `type-section-title` |
| Category label | `type-eyebrow` |
| Time, author | `type-metadata` |
| Most read numeral | `type-rank` |
| Opinion title | `type-story-title-sm` |
| Opinion author and time | `type-metadata`, author in 600 |
| Region chip | `type-ui-sm` |
| "আরও দেখুন" link | `type-ui-sm` in `text-interactive` |
| Opinion column chip | `type-eyebrow` on `accent-subtle`, `text-ink`. Not a link. The analysis column has no chip |
| Ad label | `type-eyebrow` in `text-ink-muted` |
| Newsletter and poll heading | `type-story-title-sm` |
| Newsletter text | `type-summary` |
| Email field | `type-input` |
| Newsletter and vote buttons | `type-button` |
| Poll options | `type-ui` |
| Poll results | `type-ui-sm`, tabular digits in the page language |

Every homepage text uses a role in this table. Phones use the low end of each fluid role, so the hierarchy is the same at every width.

**Most read numerals (`type-rank`).**

| Width | Items per row | Numeral size | Numeral column | Gap to title |
| --- | --- | --- | --- | --- |
| Phone | 1 | 40px | 50px | 12px |
| 600–1023 | 2 | 40px | 50px | 12px |
| From 1024 | 4 | 48px | 60px | 16px |

- The list is an `<ol>`. A CSS counter draws the numeral: `bengali` on Bangla pages, `decimal` on English pages. No leading zero.
- The numeral column has a fixed width, so every title starts at the same position.
- The top of the numeral aligns with the top of the title's first line.
- Color: `text-interactive` (light 7.06:1, dark 6.59:1 on `background`). Do not use `brand`: it is 2.37:1 on the dark background (`COL-04`).
- The numeral is `aria-hidden`; the list order gives the rank to screen readers.

```css
.rank-list { list-style: none; counter-reset: rank; }
.rank-list > li { counter-increment: rank; display: grid; grid-template-columns: 3.125rem minmax(0, 1fr); column-gap: 0.75rem; align-items: start; }
.rank-list > li::before { content: counter(rank, decimal); font: 600 2.5rem/1 var(--font-editorial-active); color: var(--interactive); font-variant-numeric: tabular-nums; }
.rank-list:lang(bn) > li::before { content: counter(rank, bengali); }
@media (min-width: 64rem) { .rank-list > li { grid-template-columns: 3.75rem minmax(0, 1fr); column-gap: 1rem; } .rank-list > li::before { font-size: 3rem; } }
```

**Other homepage rules.**

- The opinion quote mark is a decorative SVG icon with `aria-hidden="true"`. It is not a text glyph.
- Metadata order on every card: time, then reading time. Draw the separator with CSS, not a character. Put the time in `<time datetime>` and format it per `TYP-17`.
- Each "আরও দেখুন" link has the section name for screen readers, for example "আরও দেখুন: বাংলাদেশ". The visible text stays the same.
- Interface text is in the page language. Take every interface string from one string file per language (`bn.json`, `en.json`). A Bangla page has no English interface words.
- The language switch shows the other language in its own script ("English" on Bangla pages, "বাংলা" on English pages), with a matching `lang` attribute.
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

Use `type-ui-sm` with weight 600 for the nav row (from 1280px). Use `type-ui` with weight 600 for the drawer (all widths). Use `type-ui-sm` with weight 500 for drawer sub-items. Do not use serif in navigation.

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

Put this in `src/styles/typography.css`. Import it after `colors.css` and `layout.css`. It defines the line length caps (Section 5.1). It works with Tailwind 4.

```css
@theme inline {
  --font-editorial: var(--font-editorial-active);
  --font-ui: var(--font-ui-active);
}

:root {
  --font-editorial-active: var(--font-source-serif), Georgia, "Times New Roman", serif;
  --font-ui-active: var(--font-plus-jakarta), system-ui, -apple-system, "Segoe UI", Arial, sans-serif;

  --reader-scale: 1;
  --type-body-min: 1.0625rem;
  --type-eyebrow-case: uppercase;
  --type-blockquote-style: italic;

  /* Line length caps (Section 5.1). Typography owns these tokens. */
  --measure-article-title: 56rem;
  --measure-deck: 36rem;

  --type-display-size: clamp(2.75rem, 2.261rem + 2.174vw, 4rem);
  --type-display-weight: 600;
  --type-display-line: 1.02;
  --type-display-tracking: -0.03em;
  --type-page-title-size: clamp(2.125rem, 1.783rem + 1.522vw, 3rem);
  --type-page-title-weight: 600;
  --type-page-title-line: 1.06;
  --type-page-title-tracking: -0.025em;
  --type-article-title-size: clamp(2.5rem, 2.011rem + 2.174vw, 3.75rem);
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
  --type-summary-weight: 400;
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
  --type-section-title-size: clamp(1.25rem, 1.152rem + 0.435vw, 1.5rem);
  --type-section-title-weight: 700;
  --type-section-title-line: 1.2;
  --type-section-title-tracking: -0.01em;
  --type-eyebrow-size: 0.875rem;
  --type-eyebrow-weight: 700;
  --type-eyebrow-line: 1.2;
  --type-eyebrow-tracking: 0.06em;
  --type-metadata-size: 0.875rem;
  --type-metadata-weight: 500;
  --type-metadata-line: 1.4;
  --type-metadata-tracking: 0.01em;
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
  --type-button-size: 0.875rem;
  --type-button-weight: 600;
  --type-button-line: 1.2;
  --type-button-tracking: 0;
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
  --type-article-title-size: clamp(2.375rem, 1.935rem + 1.957vw, 3.5rem);
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
  --type-summary-weight: 400;
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
  --type-section-title-size: clamp(1.25rem, 1.152rem + 0.435vw, 1.5rem);
  --type-section-title-weight: 700;
  --type-section-title-line: 1.3;
  --type-section-title-tracking: 0;
  --type-eyebrow-size: 0.9375rem;
  --type-eyebrow-weight: 600;
  --type-eyebrow-line: 1.35;
  --type-eyebrow-tracking: 0;
  --type-metadata-size: 0.9375rem;
  --type-metadata-weight: 500;
  --type-metadata-line: 1.5;
  --type-metadata-tracking: 0;
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
  --type-button-size: 0.9375rem;
  --type-button-weight: 600;
  --type-button-line: 1.35;
  --type-button-tracking: 0;
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
  font-optical-sizing: auto;
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
  font-family: var(--font-ui-active);
  font-size: var(--type-section-title-size);
  font-weight: var(--type-section-title-weight);
  line-height: var(--type-section-title-line);
  letter-spacing: var(--type-section-title-tracking);
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
| 2.3.1 | 2026-10-07 | Weight table and usage example follow DR-25: links in article text keep the paragraph weight and have an underline. |
| 2.3 | 2026-10-06 | Links in article text are underlined, in the paragraph weight (DR-25). |
| 2.2 | 2026-10-06 | New role `type-rank` with fixed sizes per width. Homepage role map covers every homepage text (T-23 to T-31). Opinion chip is a plain label. Interface text in the page language. |
| 2.1 | 2026-10-06 | Section 5 follows the width model in `LAY-04`: typography owns the line length caps `measure-article-title` and `measure-deck`; layout owns container widths. Hero widths use the fixed 304px rail and the 24px gap (no 2xl tier). Navigation roles name the nav row and the drawer. |
| 2.0 | 2026-10-05 | Source Serif 4 replaces Newsreader. Noto Sans Bengali (Google Fonts) replaces Noto Sans Bengali UI. Fluid sizes stop at 1280px. Eyebrow, metadata and caption are 14px English and 15px Bangla. New role `type-summary`. `type-story-title-lg` is 26–34px English, 26–32px Bangla. Reader sizes are A, A+ (1.2) and A++ (1.4); A− is removed. All article text scales with the reader size. Body floor 17px / 18px. Deck and summary measure 36rem. Article title uses `measure-article-title` from the layout document. Bangla `<em>` is weight 600. Bangla stacks include the English fonts for Latin text. Links in article text are weight 600 with no underline. Text color uses `ink-*` tokens. Number and date formatting rule added. Rewritten in ASD-STE100 style with rule IDs. |
| 1.0 | Before 2026-10-05 | First version. |
