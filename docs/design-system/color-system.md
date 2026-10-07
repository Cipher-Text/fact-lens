# Fact Lens Color System

Version 2.1 · 6 October 2026 · Approved for the first prototype

The values are not final. Some colors can change after a few prototype rounds. Run the contrast tests in Section 3 again after each change.

This document is the single source for Fact Lens colors. It is for designers, developers and AI agents. Other documents link to the token table in Section 2. They do not copy values.

The system has two themes: **Light** (warm ivory) and **Dark** (graphite). The two themes must look like one publication.

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
- Follow the **rules** (Section 4). Each rule has a stable ID, for example `COL-03`. Use the ID in reviews, prompts and the decision register.
- Copy the **CSS** in Section 5 into the app. Do not type values by hand.

The color model has three layers:

| Layer | What it holds | Who uses it |
| --- | --- | --- |
| Primitive | Raw hex values | This document only |
| Semantic token | A role, for example `ink-muted` | CSS variables |
| Utility | A Tailwind or shadcn/ui class, for example `text-ink-muted` | Components |

Components use utilities only.

## 2. Token table

"Utility" is the Tailwind color name. Use it with any prefix: `bg-`, `text-`, `border-`, `ring-`, `fill-`.

### 2.1 Surfaces

| Token | Utility | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `background` | `background` | `#FFF9ED` | `#18191E` | Page canvas |
| `surface` | `surface`, `card` | `#FFFCF7` | `#202126` | Cards |
| `surface-alt` | `surface-alt`, `muted`, `secondary` | `#F6EEDF` | `#27292F` | Sections, bands |
| `surface-elevated` | `surface-elevated`, `popover` | `#FFFFFF` | `#303239` | Menus, dialogs, popovers, the বিশ্লেষণ ও মতামত section |

### 2.2 Ink (text)

| Token | Utility | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `ink` | `ink`, `foreground` | `#1F1A17` | `#F5F5F5` | Headlines, strong text |
| `ink-secondary` | `ink-secondary` | `#342F2C` | `#D0D0D0` | Body text |
| `ink-muted` | `ink-muted`, `muted-foreground` | `#4F4B48` | `#A3A3A3` | Metadata, captions, labels |
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
| `accent-subtle` | `accent-subtle`, `accent` | `#F6E6E0` | `#281B18` | Callouts, hover wash on menu items |

### 2.5 Borders

| Token | Utility | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `border` | `border` | `#DDD2C4` | `#3A3D44` | Dividers, card edges |
| `border-soft` | `border-soft` | `#EAE1D6` | `#2D3036` | Low-priority separators |
| `border-interactive` | `border-interactive`, `input` | `#857A70` | `#767E89` | Inputs, selects, checkboxes |

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
| `live` | `#B3261E` | `#FF5A4F` | Fill of a Breaking or Live label |
| `on-live` | `#FFF9ED` | `#18191E` | Text on a Breaking or Live label |

The utility name is the same as the token name, for example `text-success` and `bg-success-subtle`.

### 2.7 Utility colors

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `selection` | `#EDCEC4` | `#5A2A1C` | Selected text background |
| `overlay` | `rgb(31 26 23 / 0.48)` | `rgb(0 0 0 / 0.64)` | Behind dialogs and the menu drawer (scrim) |
| `shadow` | `rgb(31 26 23 / 0.12)` | `rgb(0 0 0 / 0.45)` | Elevated surfaces only |
| `skeleton` | `#EAE1D6` | `#2D3036` | Loading placeholders |

### 2.8 Focus ring

| Property | Value (both themes) |
| --- | --- |
| Color | `interactive` |
| Width | 2px |
| Offset | 2px |
| Offset color | The surface below the control |

## 3. Contrast results

Method: WCAG 2.2 contrast ratio. Each text token was tested on `background`, `surface`, `surface-alt`, `surface-elevated` and `accent-subtle`. The table shows the lowest result. Targets: 4.5:1 for text, 3:1 for input borders and focus rings.

| Token | Light (lowest) | Dark (lowest) |
| --- | --- | --- |
| `ink` | 14.21 | 11.74 |
| `ink-secondary` | 10.90 | 8.30 |
| `ink-muted` | 7.12 | 5.07 |
| `interactive` | 6.10 | 4.81 |
| `interactive-hover` | 7.72 | 6.52 |
| `interactive-pressed` | 9.31 | 8.38 |
| `success` | 4.87 | 4.78 |
| `warning` | 4.80 | 5.20 |
| `error` | 5.39 | 4.76 |
| `info` | 5.64 | 5.06 |
| `border-interactive` (3:1) | 3.63 | 3.12 |
| Focus ring (3:1) | 6.42 | 4.81 |
| `on-interactive` on all button states | 7.06 | 6.59 |
| `on-destructive` on `destructive` | 6.23 | 6.53 |
| `on-live` on `live` | 6.23 | 5.71 |

The hardest surface is `accent-subtle` in Light and `surface-elevated` in Dark.

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

### COL-05 Use `interactive` for all controls

Use `interactive` (shadcn `primary`) for links, buttons, active navigation and focus.

### COL-06 Change color on hover and press

Use `interactive-hover` and `interactive-pressed`. Hover changes the color only; the underline in article text stays (COL-07). Links outside article text have no underline.

### COL-07 Make links in body text visible without color

Underline links inside article text. Keep the text weight of the paragraph. Use `text-underline-offset: 0.2em` and `text-decoration-skip-ink: auto`, so the line clears Bangla and English descenders.

Reason: link color and body text are less than 3:1 apart. WCAG needs a second cue.

### COL-08 Do not lower text opacity

Use `ink-muted`. Do not use `text-foreground/50` or `opacity-*` on text.

Reason: opacity changes the contrast on each surface.

### COL-09 Show status with color and a second cue

Add a label, an icon or a shape to each status color, for example "✓ Subscribed" or "● Live".

### COL-10 Put status text on safe surfaces only

Put status text on the four surfaces, `accent-subtle` or its own `*-subtle` tint. Do not put it on `accent-soft`.

### COL-11 Show Breaking and Live as a filled label

Use `bg-live text-on-live` with the word "Breaking" or "Live". Do not use `live` as plain text.

Reason: dark `live` is 4.16:1 on `surface-elevated`.

### COL-12 Use `border-interactive` for form controls

Give inputs, selects and checkboxes `border-interactive`. Use `border` for dividers only.

### COL-13 Show a focus ring on every focusable element

Use `focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-background`. Set the offset color to the surface below.

### COL-14 Use `on-destructive` on delete buttons

Use `bg-destructive text-on-destructive`. Do not use white text.

Reason: dark `destructive` is light, so it needs dark text.

### COL-15 Use shadows on elevated surfaces only

Use `shadow` with `surface-elevated`. Do not add shadows to cards on the page.

## 5. Implementation

Put this CSS in `app/globals.css`. It sets the tokens for both themes and exposes them to Tailwind 4 and shadcn/ui.

```css
@import "tailwindcss";

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
  --ink-muted: #4f4b48;
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
  --border: #ddd2c4;
  --border-soft: #eae1d6;
  --border-interactive: #857a70;
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
  --live: #b3261e;
  --on-live: #fff9ed;
  /* Utility */
  --selection: #edcec4;
  --overlay: rgb(31 26 23 / 0.48);
  --shadow: rgb(31 26 23 / 0.12);
  --skeleton: #eae1d6;
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
  --border: #3a3d44;
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
  --live: #ff5a4f;
  --on-live: #18191e;
  --selection: #5a2a1c;
  --overlay: rgb(0 0 0 / 0.64);
  --shadow: rgb(0 0 0 / 0.45);
  --skeleton: #2d3036;
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
  --color-live: var(--live);
  --color-on-live: var(--on-live);
  --color-skeleton: var(--skeleton);
  --color-overlay: var(--overlay);
}

::selection {
  background: var(--selection);
}
```

Examples:

```tsx
// Card with metadata
<article className="bg-card text-ink-secondary border border-border">
  <h3 className="text-ink">Border talks resume in Dhaka</h3>
  <p className="text-ink-muted">5 min read</p>
</article>

// Link in body text (COL-06, COL-07)
<a className="text-interactive underline underline-offset-[0.2em] hover:text-interactive-hover active:text-interactive-pressed">
  full timeline
</a>

// Breaking label (COL-11)
<span className="bg-live text-on-live">● Breaking</span>

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
| 2.1 | 2026-10-06 | Links in article text are underlined, in the paragraph weight; weight 600 is not used (DR-25). |
| 2.0.1 | 2026-10-06 | Wording only: success examples do not use "Verified" (Fact Lens has no fact-checking product). `overlay` names the menu drawer, which opens at all widths. |
| 2.0 | 2026-10-04 | Contrast tested on every surface; dark ink, interactive states, status and input border values set for AA. Status tints, `live`, `selection`, `overlay`, `shadow`, `skeleton` and the four missing light values added. One status name per role in both themes. Ink tokens named `ink-*`, because `text-primary` and `text-secondary` clash with shadcn `primary` and `secondary`. `brand-dark` removed (same value as `interactive-hover`). Rewritten in ASD-STE100 style with rule IDs. |
| 1.x | Before 2026-10-04 | First version. |
