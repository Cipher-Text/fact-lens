# Fact Lens Typography System

Version 2.23 · 4 November 2026 · Type scale (DR-454, DR-455, DR-456): one size scale with Tailwind names, `text-xs` to `text-7xl` and `text-section`, replaces the 25 `type-*` role utilities (Section 3). A role is a set of classes (Section 3.2). Before: 2.22 · 4 November 2026 · Analysis hub (spec log analysis AN-07, AN-12 to AN-14)

This document is the single source for Fact Lens typography. It is for designers, developers and AI agents. Other documents link to the role table in Section 3. They do not copy values.

Fact Lens publishes in Bangla and English. Each language has its own fonts and metrics, but both languages use the same scale steps and role names.

The values are approved for prototype run 2. Section 9 lists what to check in the prototype. Some values can change after that check.

## Contents

1. [How to use this document](#1-how-to-use-this-document)
2. [Fonts](#2-fonts)
3. [Type scale and roles](#3-type-scale-and-roles)
4. [Reader sizes](#4-reader-sizes)
5. [Measures](#5-measures)
6. [Rules](#6-rules)
7. [Role mapping](#7-role-mapping)
8. [Implementation](#8-implementation)
9. [Prototype checks](#9-prototype-checks)
10. [Open items](#10-open-items)
11. [Changelog](#11-changelog)

## 1. How to use this document

- Find the role for a text element in the **role map** (Section 3.2). Each role has one name and one set of classes. The classes take the values of the **scale** (Section 3.1) for the page language.
- Follow the **rules** (Section 6). Each rule has a stable ID, for example `TYP-04`. Use the ID in reviews, prompts and commit messages.
- Copy the **CSS** in Section 8 into the app. Do not type values by hand.

The typography model has three layers:

| Layer | What it holds | Who uses it |
| --- | --- | --- |
| Font family | Four font files | `fonts.ts` only |
| Step token | Size, line height and tracking per scale step and language, for example `--text-lg-size` | `typography.css` |
| Class | The scale classes (`text-lg`) with the family and weight classes (`font-editorial`, `font-semibold`). A role is a set of classes (Section 3.2) | Components |

Components use the classes only.

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

## 3. Type scale and roles

### 3.1 Scale

The scale has 12 size steps. Each step is a Tailwind 4 text class: it sets the font size, the line height and the tracking. Family and weight come from other classes (Section 3.2).

- The sizes are the same in English and Bangla, except `text-xs` and `text-7xl`.
- Fluid sizes grow from a 360px viewport to a 1280px viewport, then stop. The page shell also stops at 1280px. Section 8.2 gives the `clamp()` values.
- Tracking for Bangla is 0 at every step.

| Class | Size, English | Size, Bangla | Line height, EN / BN | Tracking, EN | Roles |
| --- | --- | --- | --- | --- | --- |
| `text-xs` | 14px | 15px | 1.4 / 1.5 | 0 | Metadata, caption, ui-sm, eyebrow, button, nav (English) |
| `text-sm` | 16px | 16px | 1.4 / 1.5 | 0 | ui, input, summary, nav (Bangla) |
| `text-base` | 17–18px | 17–18px | 1.68 / 1.76 | 0 | Article body |
| `text-lg` | 16–20px | 16–20px | 1.2 / 1.3 | -0.005em | List title, poll question, deck |
| `text-xl` | 18–22px | 18–22px | 1.22 / 1.34 | -0.01em | Article h3, `KeyPoints` and `ContextCard` headings, blockquote |
| `text-2xl` | 20–24px | 20–24px | 1.16 / 1.26 | -0.01em | Card title |
| `text-3xl` | 22–30px | 22–30px | 1.15 / 1.28 | -0.015em | Article h2, pull quote |
| `text-4xl` | 24–36px | 24–36px | 1.08 / 1.2 | -0.02em | Lead title and cover title |
| `text-5xl` | 26–38px | 26–38px | 1.06 / 1.18 | -0.025em | Article title |
| `text-6xl` | 28–40px | 28–40px | 1.06 / 1.18 | -0.025em | Page title (`PageTitle`, C-43). It is larger than the article title |
| `text-7xl` | 44–64px | 40–56px | 1.02 / 1.16 | -0.03em | Display. Not in use now |
| `text-section` | 22px | 22px | 1.25 / 1.3 | -0.01em | Section title (`SectionHeading`, the `DailyPoll` head, the shadcn card and dialog titles) |

Two line height classes change the line height of a step:

| Class | English | Bangla | Roles |
| --- | --- | --- | --- |
| `leading-tight` | 1.2 | 1.35 | Eyebrow, button |
| `leading-relaxed` | 1.5 | 1.6 | Deck, summary, caption, blockquote |

Notes:

- Below 600px (`width < 37.5rem`), `text-4xl` takes the `text-2xl` size, line height and tracking. The lead and the cover then read as the cards on phones (Analysis spec log AN-14).
- `text-nav` is the nav step: `text-xs` in English, `text-sm` in Bangla. The language choice is in the token, not in the NavBar (DR-346).
- The logo keeps its own classes, `type-logo` and `type-logo-sm` (Section 3.3).

### 3.2 Role map

A role is a set of classes. Put all the classes of the role on the element. Use `font-editorial` (serif) or `font-ui` (sans) for the family, as in Section 2.1. Older documents name a role `type-<role>`, for example `type-eyebrow`. Read that name as the role in this table.

| Role | Old name | Classes | Weight | Other |
| --- | --- | --- | --- | --- |
| Display | `type-display` | `font-editorial text-7xl font-semibold text-balance` | 600 | |
| Page title | `type-page-title` | `font-editorial text-6xl font-semibold text-balance` | 600 | |
| Article title | `type-article-title` | `font-editorial text-5xl font-semibold text-balance` | 600 | Cap `measure-article-title` (Section 5.1). On the article page `.rd-title` in `reader.css` sets these values |
| Lead title, cover title | `type-story-lead` | `font-editorial text-4xl font-semibold text-balance` | 600 | One role: `LeadStory`, the category cover (`OverlapCard` feature), the analysis hub cover (`StoryCard` size `lead`) |
| Card title | `type-story-title` | `font-editorial text-2xl font-semibold` | 600 | `OverlapCard`, `StoryCard` size `md` |
| List title | `type-story-title-sm` | `font-editorial text-lg font-semibold` | 600 | `StoryCard` size `sm`, `StoryListItem`, `RankedList`, `OpinionList`, region panels, poll question |
| Deck | `type-deck` | `font-editorial text-lg leading-relaxed font-normal` | 400 | Cap `measure-deck`. The PageTitle description has no cap (TYP-12) |
| Summary | `type-summary` | `font-editorial text-sm leading-relaxed font-medium` | 500 | Cap `measure-deck` |
| Article body | `type-article-body` | `font-editorial text-base font-normal` | 400 | Reader scale and floor (Section 4) |
| Article h2 | `type-article-h2` | `font-editorial text-3xl font-semibold` | 600 | Reader scale |
| Article h3 | `type-article-h3` | `font-editorial text-xl font-semibold` | 600 | Reader scale |
| Blockquote | `type-blockquote` | `font-editorial text-xl leading-relaxed` | 400 EN, 500 BN (`--blockquote-weight`) | Italic in English (`--blockquote-style`). Reader scale |
| Pull quote | `type-pullquote` | `font-editorial text-3xl font-medium text-balance` | 500 | Reader scale |
| Section title | `type-section-title` | `font-editorial text-section font-semibold` | 600 | |
| Eyebrow | `type-eyebrow` | `font-ui text-xs leading-tight font-eyebrow` | 700 EN, 600 BN (`--eyebrow-weight`) | `Eyebrow` and `Chip` only: add `tracking-eyebrow case-eyebrow` (English uppercase, 0.06em; DR-216). The article page labels in `reader.css` follow the same rule: the category (`.rd-eyebrow`), the rail title and the popover label take `--eyebrow-tracking` and `--eyebrow-case`; the `ContextCard` part label takes `--eyebrow-tracking` with no case |
| Metadata | `type-metadata` | `font-ui text-xs font-normal` | 400 | |
| Caption | `type-caption` | `font-ui text-xs leading-relaxed font-normal` | 400 | Reader scale in the article |
| UI | `type-ui` | `font-ui text-sm font-medium` | 500 | |
| UI small | `type-ui-sm` | `font-ui text-xs font-medium` | 500 | |
| Nav | `type-nav` | `font-ui text-nav font-semibold` | 600 | Section 7.4 |
| Button | `type-button` | `font-ui text-xs leading-tight font-semibold` | 600 | Same size at every width (DR-208) |
| Input | `type-input` | `font-ui text-sm font-normal` | 400 | |
| Logo | `type-logo`, `type-logo-sm` | `type-logo`, `type-logo-sm` | 700 | Section 3.3 |

A role "at weight 600" in Section 7 takes `font-semibold` in place of the weight of the role. `type-story-title-lg` is retired: no component used it.

Add `cn()` from `src/lib/utils.ts` when you merge classes. It knows the steps `text-section` and `text-nav`, the weight `font-eyebrow` and the tracking `tracking-eyebrow`. The default merge tables do not know them.

### 3.3 Logo

| Class | Size | Weight | Line height, EN / BN | Use |
| --- | --- | --- | --- | --- |
| `type-logo` | 20px; 28px from 768; 32px from 1024. When the bar is stuck: drawn at 24px by a transform (C-17), not by font size | 700 | 1 / 1.1 | Logo text stand-in in the TopBar until the logo file exists (BRD-06, BRD-09, DR-295, DR-306) |
| `type-logo-sm` | 24px | 700 | 1 / 1.1 | The same role for the Footer and `Drawer.head` |

### 3.4 Ink inset

The space next to a `Divider.item` rule is measured to the text ink, not to the line box (C-22, DR-350). The ink inset is the blank space between the line box edge and the ink of a step, as a share of the step size. It was measured from the fonts. Only the steps that stand next to a rule have a value (DR-355).

| Token | English | Bangla | Use |
| --- | --- | --- | --- |
| `--text-lg-ink-start` | 0.2 | 0.03 | Above the first list title line of a list item |
| `--text-lg-ink-end` | 0.12 | 0.25 | Below the last list title line (RankedList) |
| `--text-xs-ink-end` | 0.18 | 0.33 | Below the meta line of the item above a rule |
| `--rank-chip-ink-start` | 0.205em | 0.17em | Above the ink of the serif digits in the RankedList chip (C-07), so the chip centers the ink. Measured at both chip sizes and weights |
| `--rank-chip-ink-end` | 0.143em | 0.19em | Below the ink of the same digits |

The shares were measured at the old list title size (18–20px). Measure them again for the `text-lg` list title (16–20px; Section 10). Change these values with the fonts or the step sizes. Section 8.2 gives the CSS.

## 4. Reader sizes

The article page has a reader size control with three steps.

| Step | Scale | Body | H3 |
| --- | --- | --- | --- |
| A (default) | 1 | 18px | 22px |
| A+ | 1.2 | 21.6px | 26.4px |
| A++ | 1.4 | 25.2px | 30.8px |

Values are at the 1280px shell, the same in English and Bangla. On a 360px screen the body starts at 17px.

The scale changes all text inside the article body (`TYP-15`). `reader.css` multiplies the step size by `--reader-scale` on these elements:

- article body (paragraphs and lists, `text-base`)
- article h2 (`text-3xl`) and article h3 (`text-xl`)
- blockquote (`text-xl`) and pull quote (`text-3xl`)
- caption (`text-xs`) inside the article

On the article page the scale also changes the `KeyPoints` and `ContextCard` headings (article h3), their text and the key point numbers (article body) (DR-388).

The scale does not change the article title, deck, metadata, navigation, buttons, header, footer or ads.

A reader size change eases the text to its new size over `--duration-slide` with `--ease-slide`. With reduced motion the size changes at once (DR-388).

The body has a floor of 17px (`--type-body-min`) in both languages at every step (DR-455).

Keep the reader setting on the device (local storage). Default to A.

## 5. Measures

Two kinds of width exist (`LAY-04`). Each kind has one owner.

| Kind | Owner | Tokens |
| --- | --- | --- |
| Container width | `spacing-layout-system.md`, Section 4.1 | `measure-shell`, `measure-rail`, `measure-reading-en`, `measure-reading-bn` |
| Line length cap | This document | `measure-article-title`, `measure-deck` |

### 5.1 Line length caps

A cap is a maximum line length for one role. The role applies the cap as `max-inline-size` only (`max-w-(--measure-deck)` in a component, `max-inline-size` in `reader.css`). It does not set `width`, margin or padding. When the container is narrower than the cap, the container applies.

| Token | Value | Roles |
| --- | --- | --- |
| `measure-article-title` | 56rem (896px) | Article title |
| `measure-deck` | 36rem (576px) | Deck, summary |

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

### TYP-01 Use only the scale classes

Use only the scale classes of Section 3.1 and the role classes of Section 3.2. Do not add a size, a step or a role. If no role fits, ask for a new role.

### TYP-02 Use the role to select serif or sans

Use `font-editorial` for journalism. Use `font-ui` for the interface. A heading in a dialog is interface, so it uses sans. A headline on a card is journalism, so it uses serif.

### TYP-03 Set `lang` on every page and every other-language block

Set `<html lang="en">` or `<html lang="bn">`. Set `lang` on a block or phrase in the other language, for example `<span lang="en">RS-24 Yars</span>`.

### TYP-04 Keep language differences in the tokens

Use `:lang(bn)` in `typography.css`. Do not check the language in a component to set a font or size.

### TYP-05 Do not copy English metrics to Bangla

Use the Bangla line height of the scale (Section 3.1). Use tracking 0 for Bangla. Do not use uppercase or letter spacing on Bangla labels.

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
| Article body, both languages | 17px (DR-455) |

### TYP-12 Keep line length in the measures

Put article text in `measure-reading-en` or `measure-reading-bn`. Do not let the deck, summary or article title go wider than their measure (Section 5). Exception: the PageTitle description (C-43) has no measure; it runs the shell width and wraps only when the shell is narrower (Analysis spec log AN-12).

### TYP-13 Balance large headings only

Use `text-wrap: balance` on display, page title, article title, lead story, large story title and pull quote. Do not use it on body text, metadata, captions or interface text. Exception: the analysis hub hero title (`story-split-lead`, component-system Section 6) uses `text-wrap: pretty`, so its lines fill up to the gap before the image (Analysis spec log AN-07).

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
- Put the exact time in `<time datetime>`. The server renders the Dhaka time; a small script (1.5 KB or less, no library; DR-348) writes the reader text on load, every few minutes and when the tab gets focus. A list that adds stories in the browser (load more) runs it at once, before paint, so the added rows never show the server text (`refreshStoryTimes`). Give `<time>` `suppressHydrationWarning`.
- This applies to every metadata line (hero, Latest, cards).

### TYP-18 Use utilities, not raw values

Use only the scale classes (Section 3.1) and the role classes (Section 3.2). Do not write `text-[57px]`, `leading-[1.07]` or another arbitrary type value in a component. If a raw value is necessary, write the reason in the component.

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

The component names are in `component-system.md` Section 3. The role names are in Section 3.2.

| Element | Role (Section 3.2) |
| --- | --- |
| Lead story headline (`LeadStory`); category cover (`OverlapCard` feature); analysis hub cover (`StoryCard` size `lead`) | lead title (`text-4xl`) |
| Top story in the hero (`OverlapCard`) | card title (T-37) |
| Feature story of a section or a `CategoryBlock` | card title (DR-152) |
| `StoryCard` size `sm`, `StoryListItem`, every region panel story (DR-254) | list title |
| Card summary | summary |
| Section heading (`SectionHeading`) | section title |
| Logo text stand-in: TopBar; Footer and `Drawer.head` | `type-logo`; `type-logo-sm` (DR-306) |
| Region name in a region panel | list title |
| Category label (`Eyebrow`) | eyebrow |
| Time, author (`MetaLine`) | metadata |
| Most read rank chip | The chip digits: `--rank-chip-*` (`component-system.md` C-07, Section 6) |
| Most read title | list title |
| Opinion title | list title |
| Opinion author and time | metadata, author in 600 |
| Opinion chip মতামত (`Chip` label) | eyebrow on `brand` (dark: `interactive`), `text-on-interactive`. Not a link. The analysis column has no chip |
| Region chip (`Chip` filter) | UI small |
| "আরও দেখুন" link (`MoreLink`) | UI small at weight 600, `text-interactive` (DR-216) |
| Ad label | eyebrow at weight 600, `normal-case`, `text-ink-muted` (DR-216) |
| Poll heading; newsletter heading after prototype run 2 (DR-239) | section title (DR-215) |
| Newsletter text line (after prototype run 2, DR-239) | UI |
| Email field | input |
| Vote button ভোট দিন (`Button` primary) | button |
| Poll question (`legend`) | list title |
| Poll options and result labels (with the own-vote tag) | UI |
| Poll percent, vote total | UI small, tabular digits in the page language |
| Privacy link (after prototype run 2, DR-239) | UI small at weight 600 (DR-216) |
| Form error and done messages | UI small |
| Top bar language link | UI small at weight 600 |
| Search clear button মুছুন (`Button` text) | button |
| Trending label ট্রেন্ডিং | UI small at weight 600, `text-ink-muted` |
| Trending terms | UI small at weight 600, `text-interactive`, no underline (`COL-06`, DR-216) |
| Footer links | UI small at weight 600 (DR-216) |
| Footer copyright | metadata |

Every homepage text uses a role in this table. Phones use the low end of each fluid role, so the hierarchy is the same at every width.

**Most read rank.**

- The list is an `<ol>`. The rank comes from the data (the backend most-read query), not from a CSS counter. React writes it in a `<span aria-hidden="true">` at the start of each item: Bangla digits on Bangla pages (১), Latin digits on English pages (1). No leading zero (DR-290).
- The rank is a square chip with serif digits in both languages (Source Serif 4, Noto Serif Bengali): sizes, weights and colors in `component-system.md` C-07 and Section 6; the ink insets in Section 3.4. `type-rank` is retired (IMP-99; amends DR-144, DR-146, DR-147).
- The CSS is `@utility rank-list` in `component-system.md` Section 6. Put the class on the `<ol>`: `<ol class="rank-list">` (DR-217).

**Other homepage rules.**

- The opinion quote mark is a decorative SVG icon with `aria-hidden="true"`. It is not a text glyph.
- Metadata order on every card: time, then reading time. Reading time comes from the optional story field `readingMinutes`. A story with no reading time shows the time only, with no separator (DR-272). Draw the separator with CSS as a 4px square, not a character (`CPT-10`). Put the time in `<time datetime>` and format it per `TYP-17`.
- Homepage heading outline (DR-275): a hidden `h1` ফ্যাক্ট লেন্স: প্রথম পাতা (English string from `en.ts`); a hidden `h2` names the hero; each section has its `h2`; each story title is an `h3`. The logo is a link, not the `h1`.
- Each "আরও দেখুন" link has the section name for screen readers, for example "আরও দেখুন: দক্ষিণ এশিয়া". The visible text stays the same.
- Interface text is in the page language. Take every interface string from one string file per language (`src/i18n/bn.ts`, `src/i18n/en.ts`). A Bangla page has no English interface words.
- The language switch shows the other language in its own script, with a matching `lang` attribute. Bangla pages: "En" on phones (under 768px), "English" from 768px. English pages: "বাংলা" at every width (DR-174).
- Language redirect: a remembered English choice (cookie `fl-lang=en`) redirects to `/en` only at `/`. Every other URL, including a shared link, opens in its own language. Never read the browser language (DR-17, DR-270). The proxy runs on every path except `api/` and `_next/`; the `fl-lang` cookie is `Secure` in production; the `?lang=` redirect sends `Cache-Control: no-store` (DR-328).
- Every icon-only button (menu, theme, slider) has an accessible name in the page language.
- Region chips are as wide as their label. Do not truncate or shrink them (`TYP-09`). They are 44px tall or more.

A category label that links to its category uses `text-interactive`. A label that does not link uses `text-ink-muted`. Do not use `text-brand` for labels (`COL-04`).

Story prominence comes from the role, layout, image size, position and white space. Do not give one card its own size.

### 7.2 Article page

| Element | Role (Section 3.2) |
| --- | --- |
| Category | eyebrow |
| Headline (`h1`) | article title |
| Deck | deck |
| Byline, date, reading time | metadata |
| Paragraphs and lists | article body |
| Subheadings (`h2`, `h3`) | article h2, article h3 |
| Quotation | blockquote |
| Pull quote | pull quote |
| Image caption | caption |
| Category in the heading (`ArticleHeader`, a filled button) | eyebrow |
| Metadata line under the deck | metadata, `--color-meta` |
| Byline name; role | UI; metadata |
| Avatar initials, text size glyphs (A, A+, A++) | button |
| `KeyPoints` and `ContextCard` headings | article h3 |
| Key point text and numbers; `ContextCard` parts | article body |
| `KeyPoints` note, `ContextCard` teaser | metadata |
| `ContextCard` part labels | eyebrow, no uppercase (DR-216) |
| Rail title, popover label | eyebrow |
| Contents links | nav |
| Minutes left (rail); progress percent, dock line, selection bar, toast | metadata with UI small; UI small |
| Read next heading | section title |

Paragraph gap is 1.1em. Do not indent paragraphs. The spacing tokens in `spacing-layout-system.md` set the space around headings.

### 7.3 shadcn/ui components

| Component | Role |
| --- | --- |
| Button | button |
| Input, Textarea | input |
| Select trigger, Navigation menu | UI |
| Dropdown item, Tabs, Tooltip, Toast, Breadcrumb | UI small |
| Card title, Dialog title | section title (`text-section`) |
| Card description, Dialog description | UI |
| Badge | eyebrow |

### 7.4 Navigation

Use the nav role for the nav row (from 1280px): `font-ui text-nav font-semibold`. `text-nav` is `text-sm` (16px) on Bangla pages and `text-xs` (14px) on English pages, weight 600 (DR-295, DR-346). Use UI with weight 600 for the drawer (all widths). Use UI small with weight 500 for drawer sub-items. Do not use serif in navigation.

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
/* Remove the Tailwind default font families, text sizes, line heights and weights
   (TYP-01, TYP-06, DR-235). Only the Fact Lens scale and the weights 400 to 700 exist. */
@theme {
  --font-*: initial;
  --text-*: initial;
  --leading-*: initial;
  --tracking-*: initial;
  --font-weight-*: initial;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --default-font-family: var(--font-ui-active);
}

/* The type scale (Section 3, DR-454 to DR-456). Inline, so each class reads the
   language token of its own element (TYP-04): text-xs on an English block in a Bangla
   page takes the English value. */
@theme inline {
  --font-editorial: var(--font-editorial-active);
  --font-ui: var(--font-ui-active);
  --font-weight-eyebrow: var(--eyebrow-weight);

  --text-xs: var(--text-xs-size);
  --text-xs--line-height: var(--text-xs-line);
  --text-xs--letter-spacing: var(--text-xs-tracking);
  --text-sm: var(--text-sm-size);
  --text-sm--line-height: var(--text-sm-line);
  --text-sm--letter-spacing: var(--text-sm-tracking);
  --text-base: var(--text-base-size);
  --text-base--line-height: var(--text-base-line);
  --text-base--letter-spacing: var(--text-base-tracking);
  --text-lg: var(--text-lg-size);
  --text-lg--line-height: var(--text-lg-line);
  --text-lg--letter-spacing: var(--text-lg-tracking);
  --text-xl: var(--text-xl-size);
  --text-xl--line-height: var(--text-xl-line);
  --text-xl--letter-spacing: var(--text-xl-tracking);
  --text-2xl: var(--text-2xl-size);
  --text-2xl--line-height: var(--text-2xl-line);
  --text-2xl--letter-spacing: var(--text-2xl-tracking);
  --text-3xl: var(--text-3xl-size);
  --text-3xl--line-height: var(--text-3xl-line);
  --text-3xl--letter-spacing: var(--text-3xl-tracking);
  --text-4xl: var(--text-4xl-size);
  --text-4xl--line-height: var(--text-4xl-line);
  --text-4xl--letter-spacing: var(--text-4xl-tracking);
  --text-5xl: var(--text-5xl-size);
  --text-5xl--line-height: var(--text-5xl-line);
  --text-5xl--letter-spacing: var(--text-5xl-tracking);
  --text-6xl: var(--text-6xl-size);
  --text-6xl--line-height: var(--text-6xl-line);
  --text-6xl--letter-spacing: var(--text-6xl-tracking);
  --text-7xl: var(--text-7xl-size);
  --text-7xl--line-height: var(--text-7xl-line);
  --text-7xl--letter-spacing: var(--text-7xl-tracking);
  --text-section: var(--text-section-size);
  --text-section--line-height: var(--text-section-line);
  --text-section--letter-spacing: var(--text-section-tracking);
  /* Nav: text-xs in English, text-sm in Bangla. The language choice is in the token, not
     in the NavBar (TYP-04, DR-346). */
  --text-nav: var(--nav-size);
  --text-nav--line-height: var(--nav-line);

  --leading-tight: var(--leading-tight-value);
  --leading-relaxed: var(--leading-relaxed-value);
  --tracking-eyebrow: var(--eyebrow-tracking);
}

:root {
  --reader-scale: 1;

  /* Line length caps (Section 5.1). Typography owns these tokens. */
  --measure-article-title: 56rem;
  --measure-deck: 36rem;

  /* Article body floor, both languages (TYP-11, DR-455) */
  --type-body-min: 1.0625rem;

  /* Sizes that are the same in both languages. Fluid from 360 to 1280px. */
  --text-sm-size: 1rem;
  --text-base-size: clamp(1.062rem, 1.038rem + 0.1087vw, 1.125rem);
  --text-lg-size: clamp(1rem, 0.9022rem + 0.4348vw, 1.25rem);
  --text-xl-size: clamp(1.125rem, 1.027rem + 0.4348vw, 1.375rem);
  --text-2xl-size: clamp(1.25rem, 1.152rem + 0.4348vw, 1.5rem);
  --text-3xl-size: clamp(1.375rem, 1.179rem + 0.8696vw, 1.875rem);
  --text-4xl-size: clamp(1.5rem, 1.207rem + 1.304vw, 2.25rem);
  --text-5xl-size: clamp(1.625rem, 1.332rem + 1.304vw, 2.375rem);
  --text-6xl-size: clamp(1.75rem, 1.457rem + 1.304vw, 2.5rem);
  --text-section-size: 1.375rem;
}

/* English values. :lang(en) gives an English block on a Bangla page English type (TYP-03, DR-203).
   Language-free tokens stay on :root only: a :lang(en) copy of --reader-scale would reset the reader size. */
:root,
:lang(en) {
  --font-editorial-active:
    var(--font-source-serif), Georgia, "Times New Roman", serif;
  --font-ui-active:
    var(--font-plus-jakarta), system-ui, -apple-system, "Segoe UI", Arial,
    sans-serif;

  --text-xs-size: 0.875rem;
  --text-7xl-size: clamp(2.75rem, 2.261rem + 2.174vw, 4rem);

  --text-xs-line: 1.4;
  --text-sm-line: 1.4;
  --text-base-line: 1.68;
  --text-lg-line: 1.2;
  --text-xl-line: 1.22;
  --text-2xl-line: 1.16;
  --text-3xl-line: 1.15;
  --text-4xl-line: 1.08;
  --text-5xl-line: 1.06;
  --text-6xl-line: 1.06;
  --text-7xl-line: 1.02;
  --text-section-line: 1.25;
  --leading-tight-value: 1.2;
  --leading-relaxed-value: 1.5;

  --text-xs-tracking: 0;
  --text-sm-tracking: 0;
  --text-base-tracking: 0;
  --text-lg-tracking: -0.005em;
  --text-xl-tracking: -0.01em;
  --text-2xl-tracking: -0.01em;
  --text-3xl-tracking: -0.015em;
  --text-4xl-tracking: -0.02em;
  --text-5xl-tracking: -0.025em;
  --text-6xl-tracking: -0.025em;
  --text-7xl-tracking: -0.03em;
  --text-section-tracking: -0.01em;

  --nav-size: var(--text-xs-size);
  --nav-line: var(--text-xs-line);
  --eyebrow-weight: 700;
  --eyebrow-tracking: 0.06em;
  --eyebrow-case: uppercase;
  --blockquote-weight: 400;
  --blockquote-style: italic;

  /* Ink inset (Section 3.4, DR-355): the list title (text-lg) and metadata (text-xs) */
  --text-lg-ink-start: calc(var(--text-lg-size) * 0.2);
  --text-lg-ink-end: calc(var(--text-lg-size) * 0.12);
  --text-xs-ink-end: calc(var(--text-xs-size) * 0.18);
  /* RankedList chip digits, a share of the digit size (components.css) */
  --rank-chip-ink-start: 0.205em;
  --rank-chip-ink-end: 0.143em;

  --type-logo-size: 1.25rem;
  --type-logo-weight: 700;
  --type-logo-line: 1;
}

:lang(bn) {
  --font-editorial-active:
    var(--font-noto-serif-bengali), var(--font-source-serif), "Noto Serif",
    serif;
  --font-ui-active:
    var(--font-noto-sans-bengali), var(--font-plus-jakarta), "Nirmala UI",
    sans-serif;

  --text-xs-size: 0.9375rem;
  --text-7xl-size: clamp(2.5rem, 2.109rem + 1.739vw, 3.5rem);

  --text-xs-line: 1.5;
  --text-sm-line: 1.5;
  --text-base-line: 1.76;
  --text-lg-line: 1.3;
  --text-xl-line: 1.34;
  --text-2xl-line: 1.26;
  --text-3xl-line: 1.28;
  --text-4xl-line: 1.2;
  --text-5xl-line: 1.18;
  --text-6xl-line: 1.18;
  --text-7xl-line: 1.16;
  --text-section-line: 1.3;
  --leading-tight-value: 1.35;
  --leading-relaxed-value: 1.6;

  /* Bangla tracking is 0 at every step (TYP-05) */
  --text-xs-tracking: 0;
  --text-sm-tracking: 0;
  --text-base-tracking: 0;
  --text-lg-tracking: 0;
  --text-xl-tracking: 0;
  --text-2xl-tracking: 0;
  --text-3xl-tracking: 0;
  --text-4xl-tracking: 0;
  --text-5xl-tracking: 0;
  --text-6xl-tracking: 0;
  --text-7xl-tracking: 0;
  --text-section-tracking: 0;

  --nav-size: var(--text-sm-size);
  --nav-line: var(--text-sm-line);
  --eyebrow-weight: 600;
  --eyebrow-tracking: 0;
  --eyebrow-case: none;
  --blockquote-weight: 500;
  --blockquote-style: normal;

  /* Ink inset (Section 3.4, DR-355) */
  --text-lg-ink-start: calc(var(--text-lg-size) * 0.03);
  --text-lg-ink-end: calc(var(--text-lg-size) * 0.25);
  --text-xs-ink-end: calc(var(--text-xs-size) * 0.33);
  /* RankedList chip digits, a share of the digit size (components.css) */
  --rank-chip-ink-start: 0.17em;
  --rank-chip-ink-end: 0.19em;

  --type-logo-line: 1.1;
}

/* Below 600 the lead and cover step (text-4xl) takes the card title step (text-2xl), so
   the lead and the cards read alike on phones (tajmin, 4 Nov 2026). From 600 text-4xl
   keeps its own curve. */
@media (width < 37.5rem) {
  :root,
  :lang(en),
  :lang(bn) {
    --text-4xl-size: var(--text-2xl-size);
    --text-4xl-line: var(--text-2xl-line);
    --text-4xl-tracking: var(--text-2xl-tracking);
  }
}

[data-reader-size="lg"] {
  --reader-scale: 1.2;
}
[data-reader-size="xl"] {
  --reader-scale: 1.4;
}

body {
  font-family: var(--font-ui-active);
  font-synthesis: none;
  overflow-wrap: break-word; /* TYP-25 */
  font-optical-sizing: auto;
}

@media (min-width: 48rem) {
  :root,
  :lang(en) {
    --type-logo-size: 1.75rem;
  }
}

@media (min-width: 64rem) {
  :root,
  :lang(en) {
    --type-logo-size: 2rem;
  }
}

:lang(bn) em {
  font-style: normal;
  font-weight: 600;
}
:lang(bn) strong {
  font-weight: 700;
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

/* Eyebrow and Chip only: uppercase in English, no case in Bangla (DR-216). */
@utility case-eyebrow {
  text-transform: var(--eyebrow-case);
}
```

Put `data-reader-size` on the article element, not on `<html>`. Then only the article text scales.

The steps use `@theme inline`, so each class reads the language token of its own element: an English block on a Bangla page takes the English values (TYP-03, TYP-04). The reader scale is not in the classes. `reader.css` applies it to the elements of Section 4, for example:

```css
.rd-prose p {
  font-size: max(var(--type-body-min), calc(var(--text-base-size) * var(--reader-scale)));
  line-height: var(--text-base-line);
}
.rd-prose h2 {
  font-size: calc(var(--text-3xl-size) * var(--reader-scale));
  line-height: var(--text-3xl-line);
  letter-spacing: var(--text-3xl-tracking);
}
```

### 8.3 Usage

```tsx
<section lang="bn">
  <p className="font-ui text-xs leading-tight font-eyebrow tracking-eyebrow case-eyebrow text-interactive">বিশ্লেষণ</p>
  <h3 className="font-editorial text-4xl font-semibold text-balance text-ink">…</h3>
  <p className="font-editorial text-sm leading-relaxed font-medium max-w-(--measure-deck) text-ink-secondary">…</p>
  <p className="font-ui text-xs font-normal text-(--color-meta)">…</p>
</section>
```

### 8.4 Files

| File | Holds |
| --- | --- |
| `src/app/fonts.ts` | Font loading (Section 8.1) |
| `src/styles/colors.css` | Color tokens (`color-system.md`) |
| `src/styles/typography.css` | Typography tokens, the scale and the logo utilities (Section 8.2) |
| `src/styles/reader.css` | The article page type, with the reader scale (Section 4) |
| `src/lib/utils.ts` | `cn()`, with the scale steps in its merge tables (Section 3.2) |
| `src/app/globals.css` | The imports and base rules (`spacing-layout-system.md` Sections 12.4 and 12.5) |
| `src/components/ui/` | shadcn/ui components |
| `src/components/editorial/` | Story and article components |

## 9. Prototype checks

Check these items in the first prototype, in English and Bangla, on desktop and mobile. Change the token, not the component (`TYP-20`).

| Item | What to check | Start value |
| --- | --- | --- |
| Hero | Lead looks dominant at 1024px (648px wrapper). Bangla rail titles fit at 304px | Fluid wrapper + 304px rail (Section 5.2) |
| Article title | Line height and tracking look tight in both languages | EN 1.06 / −0.025em, BN 1.18. Test EN 1.12 / −0.015em. Width: `measure-article-title` 56rem. |
| Article headings at A++ | H2 at A++ (42px) comes close to the article title (38px) | Reader scale 1.4 |
| Bangla article body | Line height can be too loose | 1.76. Test 1.70. |
| Bangla small text | Eyebrow, metadata and caption are easy to see | 15px |
| Source Serif 4 | Source Serif 4 has a larger x-height than Newsreader, so text looks larger at the same size. Check body 18px and the headline sizes. | Scale (Section 3.1) |
| Rail titles | Bangla rail titles and summaries in the 304px rail | List title `text-lg` 16–20px, summary `text-sm` |
| Hero titles | The two top stories use the card title, so the lead title leads at 1024px (T-37, DR-85) | Card title `text-2xl` 20–24px |
| Reader sizes | A+ and A++ are clearly different and the layout does not break | 1, 1.2, 1.4 |
| Colors | Some colors can change after prototype rounds. See `color-system.md` Section 6. | `color-system.md` v2.1 |

## 10. Open items

| Item | When |
| --- | --- |
| Load only the fonts for the page language (for example no Bangla fonts on English pages) | After a performance measurement |
| Typography for charts and data | When the Data/Visual format starts |
| Print styles | Before release v1 |
| Measure the ink insets again for the `text-lg` list title (16–20px) and `text-xs` metadata (Section 3.4, DR-355) | Next layout pass |

## 11. Changelog

| Version | Date | Change |
| --- | --- | --- |
| 2.23 | 2026-11-04 | Type scale (DR-454, DR-455, DR-456). Section 3: one scale of Tailwind 4 text classes, `text-xs` to `text-7xl` and `text-section`, with `leading-tight`, `leading-relaxed` and `text-nav`; a role is a set of classes (role map 3.2); the 25 `type-*` role utilities and the `--type-*-size`, `-weight`, `-line`, `-tracking` tokens are retired; `type-logo` and `type-logo-sm` stay (3.3); `type-story-title-lg` retired. New values: card title 20–24px, list title 16–20px, lead and cover title 24–36px, article title 26–38px, page title 28–40px (larger than the article title), article h2 22–30px, h3 18–22px, deck 16–20px with line height 1.5 / 1.6, summary 16px in both languages, metadata tracking 0. Section 3.4: ink inset tokens renamed `--text-lg-ink-*`, `--text-xs-ink-end`, shares kept. Section 4: body 18px and h3 22px at 1280 in both languages; floor 17px in both languages (TYP-11). TYP-01 and TYP-18: use only the scale classes. Section 7 names roles. Section 8.2 CSS. |
| 2.21 | 2026-10-28 | Latest page (spec log `latest.md` LT-04): TYP-17 story time: a list that adds stories in the browser runs the script at once (load more). No value changes. |
| 2.20 | 2026-10-28 | URL format (IMP-97, `docs/tasks/url-format.md`): the "আরও দেখুন" example in Section 4 names দক্ষিণ এশিয়া, not বাংলাদেশ (DR-412). No value changes. |
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
