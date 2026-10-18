# Fact Lens Color System

Version 2.15 · 17 October 2026 · Run 4 review (DR-358)

The values are not final. Some colors can change after a few prototype rounds. Run the contrast tests in Section 3 again after each change.

This document is the single source for Fact Lens colors. It is for designers, developers and AI agents. Other documents link to the token table in Section 2. They do not copy values.

The system has two themes: **Light** (warm ivory) and **Dark** (graphite). The two themes must look like one publication.

Light is the default on every device. Dark applies only when the reader turns it on with the theme switch. The site keeps that choice. The site does not follow the system color setting (DR-201). Only the `.dark` class on `<html>` drives the colors; do not set a `data-theme` attribute (DR-281).

All text pairs in this document meet WCAG 2.2 AA on every surface. Section 3 gives the results.

## Contents

1. [How to use this document](#1-how-to-use-this-document)
2. [Token table](#2-token-table)
3. [Contrast results](#3-contrast-results)
4. [Rules](#4-rules)
5. [Implementation](#5-implementation)
6. [Open items](#6-open-items)
7. [Changelog](#7-changelog)

## 1. How to use this document

- Find a color in the **token table** (Section 2). Each token has one name and one value per theme.
- Follow the **rules** (Section 4). Each rule has a stable ID, for example `COL-03`. Use the ID in reviews, prompts and commit messages.
- Copy the **CSS** in Section 5 into the app. Do not type values by hand.

The color model has three layers:

| Layer | What it holds | Who uses it |
| --- | --- | --- |
| Primitive | Raw hex values | This document only |
| Semantic token | A role, for example `ink-muted` | CSS variables |
| Utility | A Tailwind or shadcn/ui class, for example `text-ink-muted` | Components |

Components use utilities only.

## 2. Token table

"Utility" is the Tailwind color name. Use it with any prefix: `bg-`, `text-`, `border-`, `outline-`, `fill-`. Section 5 removes the Tailwind default palette, so only these names exist.

### 2.1 Surfaces

| Token | Utility | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `background` | `background` | `#FFF9ED` | `#18191E` | Page canvas |
| `surface` | `surface`, `card` | `#FFFCF7` | `#202126` | Cards |
| `surface-alt` | `surface-alt`, `muted`, `secondary` | `#F6EEDF` | `#27292F` | Sections, bands, the no-image placeholder in StoryImage (DR-338) |
| `surface-elevated` | `surface-elevated`, `popover` | `#FFFFFF` | `#303239` | Menus, dialogs, popovers, the বিশ্লেষণ ও মতামত section |

### 2.2 Ink (text)

| Token | Utility | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `ink` | `ink`, `foreground` | `#1F1A17` | `#F5F5F5` | Headlines, strong text |
| `ink-secondary` | `ink-secondary` | `#342F2C` | `#D0D0D0` | Body text |
| `ink-muted` | `ink-muted`, `muted-foreground` | `#6E6862` | `#A3A3A3` | Metadata, captions, labels, the ad label (DR-100) |
| `ink-disabled` | `ink-disabled` | `#9A928A` | `#5E666C` | Disabled controls only |

### 2.3 Brand and interactive

| Token | Utility | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `brand` | `brand` | `#993314` | `#993314` | Logo, brand mark, editorial rules |
| `interactive` | `interactive`, `primary`, `ring` | `#993314` | `#FC774F` | Links, buttons, active navigation, focus |
| `interactive-hover` | `interactive-hover` | `#7F2A11` | `#FDA287` | Hover state |
| `interactive-pressed` | `interactive-pressed` | `#6A230E` | `#FEC4B2` | Pressed state |
| `on-interactive` | `on-interactive`, `primary-foreground` | `#FFF9ED` | `#18191E` | Text on interactive fills |

### 2.4 Accent tints

| Token | Utility | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `accent-soft` | `accent-soft` | `#EDCEC4` | `#3A201A` | Tags, selected cards |
| `accent-subtle` | `accent-subtle`, `accent` | `#F6E6E0` | `#281B18` | Callouts |

### 2.5 Borders

| Token | Utility | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `border` | `border` | `#CEC7BD` | `#494D55` | Dividers, card edges |
| `border-soft` | `border-soft` | `#EAE1D6` | `#2D3036` | Low-priority separators |
| `border-interactive` | `border-interactive`, `input` | `#7D7369` | `#767E89` | Inputs, selects, checkboxes |

### 2.6 Status

Each status has one name. The value changes by theme.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `success` | `#1D7248` | `#60AE7C` | Text and icons: saved, subscribed, sent |
| `success-subtle` | `#E8F1ED` | `#192A26` | Background of a success message |
| `warning` | `#8D5A16` | `#D59A42` | Text and icons: developing, caution |
| `warning-subtle` | `#F4ECE0` | `#2F261D` | Background of a warning message |
| `error` | `#B3261E` | `#E5827B` | Text and icons: errors, corrections |
| `error-subtle` | `#F7E9E8` | `#341B1E` | Background of an error message |
| `info` | `#2E5E87` | `#6FA8DC` | Text and icons: context, notes |
| `info-subtle` | `#EAEFF3` | `#1C2531` | Background of an info message |
| `destructive` | `#B3261E` | `#E5827B` | Fill of a delete button |
| `on-destructive` | `#FFF9ED` | `#18191E` | Text on a delete button |

The utility name is the same as the token name, for example `text-success` and `bg-success-subtle`.

### 2.7 Utility colors

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `selection` | `#EDCEC4` | `#5A2A1C` | Selected text background |
| `overlay` | `rgb(31 26 23 / 0.48)` | `rgb(0 0 0 / 0.64)` | Behind dialogs and the menu drawer (scrim) |
| `skeleton` | `#EAE1D6` | `#2D3036` | Loading placeholders |
| `fill-neutral` | `#7E7E7E` | `#7E7E7E` | Poll result fill for the other options (C-26). 3.87:1 on light `background`, enough for a control (3:1). Not for text (DR-295) |

### 2.8 Focus ring

| Property | Value (both themes) |
| --- | --- |
| Color | `interactive` |
| Width | 2px |
| Offset | 2px |
| Style | `outline`, from the base rule (`COL-13`) |

### 2.9 Component colors

Components use the tokens in Sections 2.1 to 2.8. One component color token is allowed; it only points at a token above (DR-294, DR-349): `--color-bar` (brand bar: `brand` in light, `interactive` in dark). It is in `component-system.md` Section 6. Add no other component color token without a decision.

NewsletterSignup (DR-229; paused for prototype run 2, built in a later phase, DR-239): panel `accent-soft`; heading `ink`; text line `ink-secondary`; arrow button and privacy link `interactive`, with the UI link and button states; email field `background` with `border-interactive`. The field text is `ink` and the placeholder is `ink-muted`.

Theme control (DR-349): the ThemeButton at every width is an IconButton ghost. Icon `ink` in both themes; hover `interactive-hover`, pressed `interactive-pressed`; no wash; focus outline. The ThemeToggle switch is removed.

Form error (DR-230): the field gets a 2px `error` border. The message is `ink` with a 20px `error` icon (`COL-09`).

## 3. Contrast results

Method: WCAG 2.2 contrast ratio. Each text token was tested on `background`, `surface`, `surface-alt`, `surface-elevated` and `accent-subtle`. The table shows the lowest result. Targets: 4.5:1 for text, 3:1 for input borders and focus rings.

| Token | Light (lowest) | Dark (lowest) |
| --- | --- | --- |
| `ink` | 14.21 | 11.74 |
| `ink-secondary` | 10.90 | 8.30 |
| `ink-muted` | 4.53 | 5.07 |
| `interactive` | 6.10 | 4.81 |
| `interactive-hover` | 7.72 | 6.52 |
| `interactive-pressed` | 9.31 | 8.38 |
| `success` | 4.87 | 4.78 |
| `warning` | 4.80 | 5.20 |
| `error` | 5.39 | 4.76 |
| `info` | 5.64 | 5.06 |
| `border-interactive` (3:1) | 3.82 | 3.12 |
| Focus ring (3:1) | 6.42 | 4.81 |
| `on-interactive` on all button states | 7.06 | 6.59 |
| `on-destructive` on `destructive` | 6.23 | 6.53 |

The hardest surface is `accent-subtle` in Light and `surface-elevated` in Dark.

Component pairs on `accent-soft` (NewsletterSignup panel, Section 2.9):

| Pair | Light | Dark |
| --- | --- | --- |
| `ink` on `accent-soft` | 11.68 | 13.74 |
| `ink-secondary` on `accent-soft` | 8.95 | 9.72 |
| `interactive` on `accent-soft` (link, button fill) | 5.01 | 5.63 |
| `interactive-hover` on `accent-soft` | 6.35 | 7.63 |
| `error` icon on `accent-soft` (3:1) | 4.43 | 5.57 |
| `border-interactive` on `accent-soft` (3:1) | 3.14 | 3.65 |

Light `border-interactive` is `#7D7369` so that the newsletter email field border passes 3:1 on `accent-soft` (DR-238). The field background (`background`) is 4.42:1 against the border.

Not tested: `ink-disabled` (WCAG does not apply to disabled controls) and the logo (WCAG does not apply to logos). `brand` on `#18191E` is 2.37:1, so `COL-04` limits its use.

## 4. Rules

### COL-01 Use only the tokens in Section 2

Do not add new grays, reds, surfaces or status colors. Ask for a new token instead.

### COL-02 Use utilities, not hex values

Use `bg-surface`, `text-ink-muted` and other utilities. Do not write `text-[#1F1A17]` in a component.

### COL-03 Keep theme logic in the tokens

Do not write `dark:` color overrides in components. The token value changes with the theme.

### COL-04 Use `brand` for identity only

Use `brand` for the logo, brand mark and editorial rules. Do not use it for links, buttons or small text.

Reason: `brand` is 2.37:1 on the dark background.

### COL-05 Use `interactive` for controls and UI links

Use `interactive` (shadcn `primary`) for buttons, UI links, active navigation and focus. A UI link goes to a part of the interface, for example আরও দেখুন, a category label (eyebrow), the privacy link or a search term. Navigation and footer links keep the text color of their component at rest.

Do not use `interactive` for news links. A news link goes to a news item, for example a story title. It keeps the text color of its role (`ink` for titles).

### COL-06 Show link states with color only

Links have no underline. Hover and press change the color only (DR-199).

| Link | Rest | Hover | Pressed |
| --- | --- | --- | --- |
| News link (story title, other link to a news item) | Role color, `ink` for titles | `ink-muted`. A news link that is `ink-muted` at rest goes to `ink` | No own color: the hover color stays |
| UI link | `interactive`, or the component text color in navigation and the footer | `interactive-hover` | `interactive-pressed` |

Buttons use `interactive-hover` and `interactive-pressed` too. Social icon links (Drawer, Footer) are UI links: the icon changes color, with no wash (DR-220). The ghost icon buttons (TopBar menu, search and theme; the Drawer and SearchDialog close) and the TopBar language link work the same: `ink`, hover `interactive-hover`, pressed `interactive-pressed`, no wash (DR-349). Links inside article text: see `COL-07`. Every link shows the focus ring (`COL-13`).

### COL-07 Make links in body text visible without color

Underline links inside article text. Keep the text weight of the paragraph. Use `text-underline-offset: 0.2em` and `text-decoration-skip-ink: auto`, so the line clears Bangla and English descenders.

Reason: link color and body text are less than 3:1 apart. WCAG needs a second cue.

### COL-08 Do not lower text opacity

Use `ink-muted`. Do not use `text-foreground/50` or `opacity-*` on text.

Reason: opacity changes the contrast on each surface.

### COL-09 Show status with color and a second cue

Add a label, an icon or a shape to each status color, for example "✓ Subscribed".

### COL-10 Put status text on safe surfaces only

Put status text on the four surfaces, `accent-subtle` or its own `*-subtle` tint. Do not put it on `accent-soft`.

### COL-11 Do not show a Breaking or Live label

The site has no Breaking or Live label in either language and no `live` color tokens (DR-279). Do not add them.

### COL-12 Use `border-interactive` for form controls

Give inputs, selects and checkboxes `border-interactive`. Use `border` for dividers only.

### COL-13 Show a focus outline on every focusable element

The base rule in Section 5 gives every focusable element a 2px `ring` outline with a 2px offset on `:focus-visible` (DR-225). Do not add focus classes. Do not use `ring-*` utilities: they compile to a shadow (`COL-15`).

### COL-14 Use `on-destructive` on delete buttons

Use `bg-destructive text-on-destructive`. Do not use white text.

Reason: dark `destructive` is light, so it needs dark text.

### COL-15 Do not use shadows

Do not give any element a shadow. Show a raised surface with `surface-elevated`. Dialogs and the menu drawer also have the `overlay` scrim behind them (DR-202).

### COL-16 Set the page colors on body

The page uses `background` and the text color `ink`. The base rule in Section 5 sets them on `body` (DR-232). The default border color is `border`; a class names any other border color (`COL-12`).

### COL-17 Show a selected item with `interactive` and a word

Give a selected item an `interactive` cue and a word (`COL-09`). Do not use `accent-soft` as the only cue. Example: the own poll vote has an `interactive` bar and the label আপনার ভোট; other options have a `fill-neutral` bar (C-26, DR-273, DR-295).

## 5. Implementation

Put this CSS in `src/styles/colors.css`. It sets the tokens for both themes and exposes them to Tailwind 4 and shadcn/ui. The block has no `@import "tailwindcss"`: `app/globals.css` imports Tailwind once, then this file (DR-200). The full import list and order are in `spacing-layout-system.md` Section 12.5 (DR-339). Do not install or import `tw-animate-css` (DR-236).

```css
@custom-variant dark (&:is(.dark *));

:root {
  /* Surfaces */
  --background: #fff9ed;
  --surface: #fffcf7;
  --surface-alt: #f6eedf;
  --surface-elevated: #ffffff;
  /* Ink */
  --ink: #1f1a17;
  --ink-secondary: #342f2c;
  --ink-muted: #6e6862;
  --ink-disabled: #9a928a;
  /* Brand and interactive */
  --brand: #993314;
  --interactive: #993314;
  --interactive-hover: #7f2a11;
  --interactive-pressed: #6a230e;
  --on-interactive: #fff9ed;
  /* Accent tints */
  --accent-soft: #edcec4;
  --accent-subtle: #f6e6e0;
  /* Borders */
  --border: #cec7bd;
  --border-soft: #eae1d6;
  --border-interactive: #7d7369;
  /* Status */
  --success: #1d7248;
  --success-subtle: #e8f1ed;
  --warning: #8d5a16;
  --warning-subtle: #f4ece0;
  --error: #b3261e;
  --error-subtle: #f7e9e8;
  --info: #2e5e87;
  --info-subtle: #eaeff3;
  --destructive: #b3261e;
  --on-destructive: #fff9ed;
  /* Utility */
  --selection: #edcec4;
  --overlay: rgb(31 26 23 / 0.48);
  --skeleton: #eae1d6;
  --fill-neutral: #7e7e7e;
  /* Component colors */
}

.dark {
  --background: #18191e;
  --surface: #202126;
  --surface-alt: #27292f;
  --surface-elevated: #303239;
  --ink: #f5f5f5;
  --ink-secondary: #d0d0d0;
  --ink-muted: #a3a3a3;
  --ink-disabled: #5e666c;
  --brand: #993314;
  --interactive: #fc774f;
  --interactive-hover: #fda287;
  --interactive-pressed: #fec4b2;
  --on-interactive: #18191e;
  --accent-soft: #3a201a;
  --accent-subtle: #281b18;
  --border: #494d55;
  --border-soft: #2d3036;
  --border-interactive: #767e89;
  --success: #60ae7c;
  --success-subtle: #192a26;
  --warning: #d59a42;
  --warning-subtle: #2f261d;
  --error: #e5827b;
  --error-subtle: #341b1e;
  --info: #6fa8dc;
  --info-subtle: #1c2531;
  --destructive: #e5827b;
  --on-destructive: #18191e;
  --selection: #5a2a1c;
  --overlay: rgb(0 0 0 / 0.64);
  --skeleton: #2d3036;
  --fill-neutral: #7e7e7e;
}

@theme {
  /* Remove the Tailwind default palette: only Fact Lens colors exist (DR-235) */
  --color-*: initial;
}

@theme inline {
  /* shadcn/ui names */
  --color-background: var(--background);
  --color-foreground: var(--ink);
  --color-card: var(--surface);
  --color-card-foreground: var(--ink);
  --color-popover: var(--surface-elevated);
  --color-popover-foreground: var(--ink);
  --color-primary: var(--interactive);
  --color-primary-foreground: var(--on-interactive);
  --color-secondary: var(--surface-alt);
  --color-secondary-foreground: var(--ink);
  --color-muted: var(--surface-alt);
  --color-muted-foreground: var(--ink-muted);
  --color-accent: var(--accent-subtle);
  --color-accent-foreground: var(--ink);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--border-interactive);
  --color-ring: var(--interactive);

  /* Fact Lens names */
  --color-surface: var(--surface);
  --color-surface-alt: var(--surface-alt);
  --color-surface-elevated: var(--surface-elevated);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-ink-muted: var(--ink-muted);
  --color-ink-disabled: var(--ink-disabled);
  --color-brand: var(--brand);
  --color-interactive: var(--interactive);
  --color-interactive-hover: var(--interactive-hover);
  --color-interactive-pressed: var(--interactive-pressed);
  --color-on-interactive: var(--on-interactive);
  --color-accent-soft: var(--accent-soft);
  --color-accent-subtle: var(--accent-subtle);
  --color-border-soft: var(--border-soft);
  --color-border-interactive: var(--border-interactive);
  --color-success: var(--success);
  --color-success-subtle: var(--success-subtle);
  --color-warning: var(--warning);
  --color-warning-subtle: var(--warning-subtle);
  --color-error: var(--error);
  --color-error-subtle: var(--error-subtle);
  --color-info: var(--info);
  --color-info-subtle: var(--info-subtle);
  --color-on-destructive: var(--on-destructive);
  --color-skeleton: var(--skeleton);
  --color-fill-neutral: var(--fill-neutral);
  --color-overlay: var(--overlay);
}

::selection {
  background: var(--selection);
}

@layer base {
  /* COL-16, DR-232 */
  * {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-background);
    color: var(--color-ink);
  }
  /* COL-13, DR-225 */
  :focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: 2px;
  }
  /* COL-08, DR-235 */
  ::placeholder {
    color: var(--color-ink-muted);
  }
}
```

Examples:

```tsx
// Card with metadata
<article className="bg-card text-ink-secondary border border-border">
  <h3 className="text-ink">Border talks resume in Dhaka</h3>
  <p className="text-ink-muted">5 min read</p>
</article>

// UI link (COL-05, COL-06)
<a className="text-interactive hover:text-interactive-hover active:text-interactive-pressed">
  আরও দেখুন
</a>

// News link: story title (COL-06)
<a className="text-ink hover:text-ink-muted">
  Border talks resume in Dhaka
</a>

// Link in body text (COL-06, COL-07)
<a className="text-interactive underline underline-offset-[0.2em] hover:text-interactive-hover active:text-interactive-pressed">
  full timeline
</a>

// Delete button (COL-14)
<Button className="bg-destructive text-on-destructive">Delete</Button>
```

## 6. Open items

| Item | When |
| --- | --- |
| Review colors that look off in the prototype | After a few prototype rounds |
| Gradient for text on photos | Only if a design puts text on an image |
| Chart palette | When the Data/Visual format starts |
| Windows high-contrast (`forced-colors`) and print styles | Before release v1 |

## 7. Changelog

| Version | Date | Change |
| --- | --- | --- |
| 2.15 | 2026-10-17 | `border` changed: light `#DDD2C4` to `#CEC7BD`, dark `#3A3D44` to `#494D55`, so divider rules show on every surface, `surface-elevated` in dark included (Section 2.5, Section 5, DR-358). |
| 2.14 | 2026-10-16 | `--color-theme-control` and `--color-theme-icon` removed; `--color-bar` is the one component color token. Ghost icon buttons and the language link: ink, hover `interactive-hover`, no wash; `accent-subtle` has no hover use; `fill-neutral` for the poll only (Section 2.9, Section 4, DR-349). |
| 2.13 | 2026-10-16 | Third component color token `--color-theme-icon` for the theme control icons (Section 2.9, DR-348). |
| 2.12 | 2026-10-15 | Section 5 links to the one `globals.css` import list in layout Section 12.5 (DR-339). |
| 2.11 | 2026-10-15 | `surface-alt` also fills the StoryImage no-image placeholder (DR-338). `skeleton` stays for loading only. |
| 2.10 | 2026-10-14 | New token `fill-neutral` (#7E7E7E, both themes) for the poll bars and the light ThemeToggle track; dark track `interactive` (DR-295). §2.9 allows two component color tokens, `--color-bar` and `--color-theme-control` (DR-294). |
| 2.9 | 2026-10-13 | Only `.dark` drives the theme, no `data-theme` (DR-281). No Breaking or Live label; the `live` and `on-live` tokens are removed (COL-11, DR-279). |
| 2.8 | 2026-10-13 | Poll results: own vote `interactive` bar + আপনার ভোট, others `#7E7E7E` in both themes on a `border` track (C-26, DR-273). Amends DR-221. |
| 2.7 | 2026-10-10 | NewsletterSignup colors apply after prototype run 2 (DR-239). `border-interactive` `#7D7369` stays for every field (DR-238). |
| 2.6 | 2026-10-10 | Light `border-interactive` is `#7D7369` (was `#857A70`): 3.14:1 on the `accent-soft` newsletter panel, 3.82:1 or more on the other surfaces (DR-238). |
| 2.5 | 2026-10-10 | Newsletter panel `accent-soft` with existing tokens; `newsletter-*` tokens removed (DR-229). Focus is a base-layer outline (`COL-13`, DR-225). New rule `COL-16` page colors (DR-232). Default palette removed; base layer for border, body, focus and placeholder (DR-235). Phone ThemeButton icon `interactive` (DR-237). Form error colors (DR-230). |
| 2.4 | 2026-10-10 | Theme controls use existing tokens; `toggle-*` tokens removed; no hover or pressed on theme controls and the language link (DR-211, DR-219). Social icon links change color like UI links (DR-220). New rule `COL-17` selected state (DR-221). |
| 2.3 | 2026-10-09 | Link states: news links and UI links, no underline outside article text (COL-05, COL-06, DR-199). Light is the default theme; no system theme (DR-201). No shadows; the `shadow` token is removed (COL-15, DR-202). The Section 5 block has no Tailwind import (DR-200). |
| 2.2 | 2026-10-09 | `ink-muted` light is `#6E6862` for all muted text (DR-100). Component colors for ThemeToggle and NewsletterSignup (Section 2.9, DR-132, DR-133, DR-169, DR-179). |
| 2.1 | 2026-10-06 | Links in article text are underlined, in the paragraph weight; weight 600 is not used (DR-25). |
| 2.0.1 | 2026-10-06 | Wording only: success examples do not use "Verified" (Fact Lens has no fact-checking product). `overlay` names the menu drawer, which opens at all widths. |
| 2.0 | 2026-10-04 | Contrast tested on every surface; dark ink, interactive states, status and input border values set for AA. Status tints, `live`, `selection`, `overlay`, `shadow`, `skeleton` and the four missing light values added. One status name per role in both themes. Ink tokens named `ink-*`, because `text-primary` and `text-secondary` clash with shadcn `primary` and `secondary`. `brand-dark` removed (same value as `interactive-hover`). Rewritten in ASD-STE100 style with rule IDs. |
| 1.x | Before 2026-10-04 | First version. |
