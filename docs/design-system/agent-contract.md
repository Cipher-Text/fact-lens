# Fact Lens Agent Contract

Version 2.13.1 · 24 October 2026 · Section 3: article page approved, checkpoint 1 (DR-385 to DR-390); new rule LAY-22; Section 11: no tickets, no `/accept`

This contract tells an AI agent (or a developer) how to build Fact Lens screens from the design system. It is an index. It gives rule IDs and links. It does not give values. All values are in the four foundation documents: color, typography, spacing and layout, and components.

Generated from `tools/agent-contract/agent-contract.tpl.md` by `gen_contract.py`. Do not edit the rule tables by hand.

## Contents

1. [Authority](#1-authority)
2. [Before you start](#2-before-you-start)
3. [Scope](#3-scope)
4. [Where the values are](#4-where-the-values-are)
5. [Rule index](#5-rule-index)
6. [Shared rules](#6-shared-rules)
7. [Project decisions](#7-project-decisions)
8. [Check list: if you are about to](#8-check-list-if-you-are-about-to)
9. [Gaps in the system](#9-gaps-in-the-system)
10. [Validation](#10-validation)
11. [How to change this contract](#11-how-to-change-this-contract)

## 1. Authority

| Order | Source | Holds |
| --- | --- | --- |
| 1 | `color-system.md` v2.16, `typography-system.md` v2.17, `spacing-layout-system.md` v2.23, `component-system.md` v1.18 | Values, rules, component sheets and copy-ready CSS |
| 2 | This contract | Rule IDs, project decisions (Section 7), links and the build order |
| 3 | Existing code | Only where items 1 and 2 have no decision |

If this contract and a foundation document do not agree, follow the foundation document. Do not make a compromise. Report the difference as a `DOC-` issue.

## 2. Before you start

1. Read Section 1 ("How to use this document") of each foundation document.
2. Read the rules of the area that your task touches. Section 5 lists them.
3. Copy the CSS from the implementation section of each document. Do not type values by hand (`COL-02`, `TYP-18`, `LAY-01`).
4. In code review, prompts and commit messages, cite the rule ID, for example "fixes `LAY-10`".

## 3. Scope

| Area | Status | Use |
| --- | --- | --- |
| Color | Approved for prototype run 4 | `color-system.md` |
| Typography | Approved for prototype run 4 | `typography-system.md` |
| Homepage layout and spacing | Approved for prototype run 4 | `spacing-layout-system.md` |
| Homepage components, radius, icons, motion | Approved for prototype run 4. The footer is provisional | `component-system.md` |
| Article page layout and spacing | Approved, checkpoint 1 (DR-385, DR-386, DR-387) | `spacing-layout-system.md` Section 7A |
| Article page components | Approved, checkpoint 1 (DR-390): C-27 to C-42 | `component-system.md` Section 7, Article page |
| Other page layout and components | Defined per page in the browser (DR-370) | Build from the page brief `docs/briefs/<page>.md`; write changes in the page spec log. `spacing-layout-system.md` Section 14.2 lists the open items |

The homepage is locked (DR-370). Start a new page only with its brief (`AGENTS.md` Section 9).

## 4. Where the values are

| You need | Go to |
| --- | --- |
| Color tokens, light and dark | `color-system.md` Section 2 |
| Contrast results | `color-system.md` Section 3 |
| `globals.css` imports and their order | `spacing-layout-system.md` Section 12.5 |
| Tailwind 4 and shadcn/ui color names | `color-system.md` Section 5 |
| Theme resets, container sizes, motion, base rules | `spacing-layout-system.md` Sections 12.1 and 12.4 |
| Font families and stacks | `typography-system.md` Section 2 |
| Type roles (size, weight, line height, tracking) | `typography-system.md` Section 3 |
| Reader sizes A, A+, A++ | `typography-system.md` Section 4 |
| Line length caps | `typography-system.md` Section 5 |
| Which role for which element | `typography-system.md` Section 7 |
| Font loading and `typography.css` | `typography-system.md` Section 8 |
| Breakpoints, columns, gutters, gaps | `spacing-layout-system.md` Section 3 |
| Container widths | `spacing-layout-system.md` Section 4 |
| Spacing tokens | `spacing-layout-system.md` Section 5 |
| Header, drawer and search | `spacing-layout-system.md` Section 6 |
| Homepage order, patterns and sparse content | `spacing-layout-system.md` Section 7 |
| Peer rows | `spacing-layout-system.md` Section 8 |
| Ad slots, sizes and reserved heights | `spacing-layout-system.md` Section 9 |
| Layers (z-index) | `spacing-layout-system.md` Section 10 |
| Breakpoint, token and container CSS | `spacing-layout-system.md` Section 12 |
| Component names, page sections and labels | `component-system.md` Section 3 |
| Component rules (`CPT-`, `N-`) | `component-system.md` Section 4 |
| Container sizes for components | `component-system.md` Section 5 |
| Component tokens and `components.css` | `component-system.md` Section 6 |
| Component color token (`--color-bar`) | `color-system.md` Section 2.9 |
| One sheet per component: parts, sizes per width, checks | `component-system.md` Section 7 |

## 5. Rule index

Each row links to the rule. The rule text is in the foundation document.

### Color (`color-system.md` v2.16, 17 rules)

| ID | Rule |
| --- | --- |
| [`COL-01`](color-system.md#col-01-use-only-the-tokens-in-section-2) | Use only the tokens in Section 2 |
| [`COL-02`](color-system.md#col-02-use-utilities-not-hex-values) | Use utilities, not hex values |
| [`COL-03`](color-system.md#col-03-keep-theme-logic-in-the-tokens) | Keep theme logic in the tokens |
| [`COL-04`](color-system.md#col-04-use-brand-for-identity-only) | Use `brand` for identity only |
| [`COL-05`](color-system.md#col-05-use-interactive-for-controls-and-ui-links) | Use `interactive` for controls and UI links |
| [`COL-06`](color-system.md#col-06-show-link-states-with-color-only) | Show link states with color only |
| [`COL-07`](color-system.md#col-07-make-links-in-body-text-visible-without-color) | Make links in body text visible without color |
| [`COL-08`](color-system.md#col-08-do-not-lower-text-opacity) | Do not lower text opacity |
| [`COL-09`](color-system.md#col-09-show-status-with-color-and-a-second-cue) | Show status with color and a second cue |
| [`COL-10`](color-system.md#col-10-put-status-text-on-safe-surfaces-only) | Put status text on safe surfaces only |
| [`COL-11`](color-system.md#col-11-do-not-show-a-breaking-or-live-label) | Do not show a Breaking or Live label |
| [`COL-12`](color-system.md#col-12-use-border-interactive-for-form-controls) | Use `border-interactive` for form controls |
| [`COL-13`](color-system.md#col-13-show-a-focus-outline-on-every-focusable-element) | Show a focus outline on every focusable element |
| [`COL-14`](color-system.md#col-14-use-on-destructive-on-delete-buttons) | Use `on-destructive` on delete buttons |
| [`COL-15`](color-system.md#col-15-do-not-use-shadows) | Do not use shadows |
| [`COL-16`](color-system.md#col-16-set-the-page-colors-on-body) | Set the page colors on body |
| [`COL-17`](color-system.md#col-17-show-a-selected-item-with-interactive-and-a-word) | Show a selected item with `interactive` and a word |

### Typography (`typography-system.md` v2.17, 25 rules)

| ID | Rule |
| --- | --- |
| [`TYP-01`](typography-system.md#typ-01-use-only-the-roles-in-section-3) | Use only the roles in Section 3 |
| [`TYP-02`](typography-system.md#typ-02-use-the-role-to-select-serif-or-sans) | Use the role to select serif or sans |
| [`TYP-03`](typography-system.md#typ-03-set-lang-on-every-page-and-every-other-language-block) | Set `lang` on every page and every other-language block |
| [`TYP-04`](typography-system.md#typ-04-keep-language-differences-in-the-tokens) | Keep language differences in the tokens |
| [`TYP-05`](typography-system.md#typ-05-do-not-copy-english-metrics-to-bangla) | Do not copy English metrics to Bangla |
| [`TYP-06`](typography-system.md#typ-06-use-weights-400-to-700-only) | Use weights 400 to 700 only |
| [`TYP-07`](typography-system.md#typ-07-do-not-make-fake-styles) | Do not make fake styles |
| [`TYP-08`](typography-system.md#typ-08-use-the-default-font-width) | Use the default font width |
| [`TYP-09`](typography-system.md#typ-09-do-not-make-text-smaller-to-make-it-fit) | Do not make text smaller to make it fit |
| [`TYP-10`](typography-system.md#typ-10-let-the-browser-set-the-optical-size) | Let the browser set the optical size |
| [`TYP-11`](typography-system.md#typ-11-keep-the-minimum-sizes) | Keep the minimum sizes |
| [`TYP-12`](typography-system.md#typ-12-keep-line-length-in-the-measures) | Keep line length in the measures |
| [`TYP-13`](typography-system.md#typ-13-balance-large-headings-only) | Balance large headings only |
| [`TYP-14`](typography-system.md#typ-14-use-the-color-tokens-for-text-color) | Use the color tokens for text color |
| [`TYP-15`](typography-system.md#typ-15-scale-all-article-text-with-the-reader-size) | Scale all article text with the reader size |
| [`TYP-16`](typography-system.md#typ-16-underline-links-in-article-text) | Underline links in article text |
| [`TYP-17`](typography-system.md#typ-17-format-numbers-and-dates-for-the-page-language) | Format numbers and dates for the page language |
| [`TYP-18`](typography-system.md#typ-18-use-utilities-not-raw-values) | Use utilities, not raw values |
| [`TYP-19`](typography-system.md#typ-19-let-fact-lens-roles-override-shadcnui) | Let Fact Lens roles override shadcn/ui |
| [`TYP-20`](typography-system.md#typ-20-fix-a-visual-problem-in-the-token) | Fix a visual problem in the token |
| [`TYP-21`](typography-system.md#typ-21-keep-the-same-metrics-in-dark-mode) | Keep the same metrics in dark mode |
| [`TYP-22`](typography-system.md#typ-22-do-not-use-opacity-for-hierarchy) | Do not use opacity for hierarchy |
| [`TYP-23`](typography-system.md#typ-23-support-zoom-and-user-text-spacing) | Support zoom and user text spacing |
| [`TYP-24`](typography-system.md#typ-24-show-meaning-with-more-than-style) | Show meaning with more than style |
| [`TYP-25`](typography-system.md#typ-25-break-a-word-only-when-it-does-not-fit) | Break a word only when it does not fit |

### Spacing and layout (`spacing-layout-system.md` v2.23, 22 rules)

| ID | Rule |
| --- | --- |
| [`LAY-01`](spacing-layout-system.md#lay-01-use-only-the-tokens-in-this-document) | Use only the tokens in this document |
| [`LAY-02`](spacing-layout-system.md#lay-02-keep-content-inside-its-container) | Keep content inside its container |
| [`LAY-03`](spacing-layout-system.md#lay-03-use-the-full-shell-for-homepage-sections) | Use the full shell for homepage sections |
| [`LAY-04`](spacing-layout-system.md#lay-04-separate-container-width-and-line-length) | Separate container width and line length |
| [`LAY-05`](spacing-layout-system.md#lay-05-use-the-fixed-rail) | Use the fixed rail |
| [`LAY-06`](spacing-layout-system.md#lay-06-do-not-add-a-2xl-tier) | Do not add a 2xl tier |
| [`LAY-07`](spacing-layout-system.md#lay-07-use-the-agreed-cards-per-row) | Use the agreed cards per row |
| [`LAY-08`](spacing-layout-system.md#lay-08-use-one-card-variant-per-peer-row) | Use one card variant per peer row |
| [`LAY-09`](spacing-layout-system.md#lay-09-make-ad-rows-full-width-with-no-spacing) | Make ad rows full width with no spacing |
| [`LAY-10`](spacing-layout-system.md#lay-10-reserve-the-ad-height) | Reserve the ad height |
| [`LAY-11`](spacing-layout-system.md#lay-11-do-not-make-ads-sticky) | Do not make ads sticky |
| [`LAY-12`](spacing-layout-system.md#lay-12-put-section-to-ad-space-on-the-section) | Put section-to-ad space on the section |
| [`LAY-13`](spacing-layout-system.md#lay-13-do-not-show-two-ad-rows-together) | Do not show two ad rows together |
| [`LAY-14`](spacing-layout-system.md#lay-14-keep-the-source-order-equal-to-the-reading-order) | Keep the source order equal to the reading order |
| [`LAY-15`](spacing-layout-system.md#lay-15-make-only-the-site-header-sticky) | Make only the site header sticky |
| [`LAY-16`](spacing-layout-system.md#lay-16-use-the-same-geometry-in-both-languages-and-both-themes) | Use the same geometry in both languages and both themes |
| [`LAY-17`](spacing-layout-system.md#lay-17-do-not-set-a-fixed-height-on-text-containers) | Do not set a fixed height on text containers |
| [`LAY-18`](spacing-layout-system.md#lay-18-put-the-see-more-link-below-its-block) | Put the "see more" link below its block |
| [`LAY-19`](spacing-layout-system.md#lay-19-write-ad-sizes-in-px-tokens) | Write ad sizes in px tokens |
| [`LAY-20`](spacing-layout-system.md#lay-20-use-the-panel-inset-in-a-colored-panel) | Use the panel inset in a colored panel |
| [`LAY-21`](spacing-layout-system.md#lay-21-use-the-4px-scale-for-one-component-values) | Use the 4px scale for one-component values |
| [`LAY-22`](spacing-layout-system.md#lay-22-put-an-inline-ad-between-two-paragraphs) | Put an inline ad between two paragraphs |

### Components (`component-system.md` v1.18, 21 rules)

| ID | Rule |
| --- | --- |
| [`CPT-01`](component-system.md#cpt-01-name-a-component-by-what-it-is) | Name a component by what it is |
| [`CPT-02`](component-system.md#cpt-02-give-a-variant-as-a-prop) | Give a variant as a prop |
| [`CPT-03`](component-system.md#cpt-03-name-a-part-componentpart) | Name a part Component.part |
| [`CPT-04`](component-system.md#cpt-04-make-a-component-react-to-its-container) | Make a component react to its container |
| [`CPT-05`](component-system.md#cpt-05-do-not-round-corners) | Do not round corners |
| [`CPT-06`](component-system.md#cpt-06-do-not-put-a-border-around-a-card) | Do not put a border around a card |
| [`CPT-07`](component-system.md#cpt-07-use-tokens-and-scale-classes-only) | Use tokens and scale classes only |
| [`CPT-08`](component-system.md#cpt-08-do-not-cut-a-news-title) | Do not cut a news title |
| [`CPT-09`](component-system.md#cpt-09-scale-insets-and-overlaps-with-the-container) | Scale insets and overlaps with the container |
| [`CPT-10`](component-system.md#cpt-10-draw-the-metadata-separator) | Draw the metadata separator |
| [`CPT-11`](component-system.md#cpt-11-keep-the-story-text-hierarchy) | Keep the story text hierarchy |
| [`CPT-12`](component-system.md#cpt-12-use-one-metadata-size-per-language) | Use one metadata size per language |
| [`CPT-13`](component-system.md#cpt-13-do-not-make-a-section-heading-a-link) | Do not make a section heading a link |
| [`CPT-14`](component-system.md#cpt-14-put-one-morelink-at-the-end-of-each-section) | Put one MoreLink at the end of each section |
| [`CPT-15`](component-system.md#cpt-15-align-a-standalone-link-to-the-end-edge) | Align a standalone link to the end edge |
| [`CPT-16`](component-system.md#cpt-16-restyle-a-shadcn-component-when-you-add-it) | Restyle a shadcn component when you add it |
| [`N-01`](component-system.md#n-01-name-each-section-with-section-at-the-end) | Name each section with Section at the end |
| [`N-02`](component-system.md#n-02-name-a-section-by-what-it-holds) | Name a section by what it holds |
| [`N-03`](component-system.md#n-03-name-a-one-component-part-parentpart) | Name a one-component part Parent.part |
| [`N-04`](component-system.md#n-04-make-a-shared-part-its-own-component) | Make a shared part its own component |
| [`N-05`](component-system.md#n-05-use-the-approved-names-and-words) | Use the approved names and words |

## 6. Shared rules

Some topics have a rule in more than one document. Each rule covers its own part. Obey all of them.

| Topic | Rules |
| --- | --- |
| Raw values in components | `COL-02`, `TYP-18`, `LAY-01` |
| Theme changes color only | `COL-03`, `TYP-21`, `LAY-16` |
| No opacity on text | `COL-08`, `TYP-22` |
| Links in article text | `COL-06`, `COL-07`, `TYP-16` |
| Category labels and brand color | `COL-04`, `TYP-14`; label colors in `typography-system.md` Section 7.1 |
| Container width and line length | `LAY-04`, `TYP-12` |
| Text that does not fit | `TYP-08`, `TYP-09`, `LAY-17` |
| Meaning not by style alone | `COL-09`, `TYP-24` |
| Zoom, text spacing and reader sizes | `TYP-15`, `TYP-23`, `LAY-17` |
| Focus | `COL-13` |
| Reading order | `LAY-14` |
| Corners and borders | `CPT-05`, `CPT-06` |
| Metadata line | `CPT-10`, `CPT-11`, `CPT-12` |
| Section headings and section links | `CPT-13`, `CPT-14`, `CPT-15`, `LAY-18` |
| Raw values in components (scale classes, component tokens) | `CPT-07`, `CPT-09`, `LAY-21` |
| Panel padding | `LAY-20` |
| Adding a shadcn/ui component | `CPT-16` |
| Names | `CPT-01` to `CPT-03`, `N-01` to `N-05` |
| Ads | `LAY-09` to `LAY-13`, `LAY-19` |

## 7. Project decisions

These decisions are not in the foundation documents, but every build must obey them. The decision register is not in this repo. This table carries each decision that a build needs.

| Decision | Rule for the build |
| --- | --- |
| `DR-15`, `DR-88` | Stack: Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, shadcn/ui, `next/font`, pnpm. Do not add Storybook in prototype run 4 (the development test page stays, DR-317) |
| `DR-01` | Use mock data. Do not connect a backend |
| `DR-17` | Bangla is at the root URL. English is under `/en`. Remember the reader's choice; the remembered English choice redirects only at `/` (DR-270). Do not redirect by browser language |
| `DR-18` | Fact Lens has no fact-checking product. Do not add "Fact Check" or ফ্যাক্টচেক as a category, tag or navigation item |
| `DR-19` | চীন is not in the navigation. It is an entry under অঞ্চলসমূহ (DR-345) |
| `DR-35` | The first prototype uses the fixed rail only. Do not build the 8+4 hero |
| `DR-44` | No 4-up card rows anywhere. The hero has two top-story cards |
| `DR-51`, `DR-145` | Most read is a numbered list, not a card row: 4 per row from 1280px, 3 at 1024–1279px |
| `DR-87` | No rounded corners and no card borders, no exception (`CPT-05`, DR-349) |
| `DR-162` | Use the approved component and section names (`component-system.md` Section 3) |
| `DR-188` | No subscribe button in the header or the drawer |
| `DR-239` | Do not build `NewsletterSignup` in prototype run 4. The P-3 rail holds the `DailyPoll`, and from 1280px the `ad-rail` slot below it (DR-240, DR-245). Run 4 has no sign-up point |
| `DR-193` | The footer is provisional. Build the drawn look |
| `DR-356` | The gap between analysis and opinion (P-4) is `--space-analysis-gap` (32 / 48 / 64px), not `--grid-column-gap`. It is the one stated exception to the column gap |

## 8. Check list: if you are about to

| If you are about to | Stop. Read |
| --- | --- |
| Type a hex value, a pixel size or `text-[…]` | `COL-02`, `TYP-18`, `LAY-01`, `LAY-21` |
| Write `dark:` in a component | `COL-03` |
| Use `text-primary`, `text-secondary` or `text-muted` for text | `TYP-14` |
| Use `brand` on a link, button or label | `COL-04` |
| Check the language in a component to set a font or size | `TYP-04` |
| Make text smaller, condensed or clamped so that it fits | `TYP-08`, `TYP-09` |
| Add a breakpoint or a `2xl` value | `LAY-06` |
| Use `vw`, a breakout or a full-bleed trick | `LAY-02` |
| Make a 3-up or 4-up row on the homepage | `LAY-07` |
| Round a corner or put a border around a card | `CPT-05`, `CPT-06` |
| Make a section heading a link | `CPT-13` |
| Type a dot, a pipe or `·` between metadata items | `CPT-10` |
| Name a component after its place or its Bangla label | `CPT-01`, `N-02` |
| Make a new component for a size change | `CPT-02` |
| Type a pixel value from a component sheet | `CPT-07`, `LAY-21`. Use the scale class; a token only for a shared value |
| Add focus classes or a `ring-*` class | `COL-13` |
| Type padding in a colored panel | `LAY-20` |
| Keep a shadcn/ui file as `shadcn add` wrote it | `CPT-16` |
| Give a card a fixed height | `LAY-17` |
| Add padding, margin or a gutter to an ad row | `LAY-09` |
| Make an ad sticky, or the nav row sticky without the top bar | `LAY-11`, `LAY-15` |
| Use CSS `order` | `LAY-14` |
| Put a "আরও দেখুন" link in a heading row or align it to the start | `LAY-18`, `CPT-15` |
| Show an English word on a Bangla page | `typography-system.md` Section 7.1 |
| Add a new color, role, width or space | `COL-01`, `TYP-01`, `LAY-01`. Ask for a new token |
| Build a component | Its sheet in `component-system.md` Section 7, then its checks |

## 9. Gaps in the system

The system does not yet define article and category page components or the full footer (the footer is provisional). The 200% text stack trigger is the 17.5rem container rule in `StoryCard` (C-24, DR-308); check the value in the build and report a failure as `UNRESOLVED_DESIGN_SYSTEM`; do not choose another trigger yourself.

For a gap:

1. Use a neutral treatment that obeys every rule in Section 5.
2. Do not call the treatment a Fact Lens standard.
3. List it as `UNRESOLVED_DESIGN_SYSTEM` in your summary, with the file and the component.

### Flag before you decide

Solve every task from the design-system rules (`COL`, `TYP`, `LAY`, `CPT`, `N`). Raise a flag to tajmin and do not decide yourself when:

1. No rule answers the question.
2. Your fix is a workaround that does not belong to the design system.
3. Your fix needs a new rule that contradicts an existing rule.

A flag gives: what is wrong, what you did, the rule IDs, your proposal and an example. A choice is approved only when tajmin says so explicitly. "Next" or "go on" starts work; it does not approve a choice.

## 10. Validation

Before you finish a task:

1. Run lint, type check, tests and the production build. Fix the errors that your work caused.
2. Test the widths and content cases in `spacing-layout-system.md` Section 13.
3. Do the prototype checks in `typography-system.md` Section 9 and the checks in each component sheet (`component-system.md` Section 7).
4. If you changed a color, run the contrast test in `color-system.md` Section 3 again.
5. Test English and Bangla, light and dark, keyboard focus and 200% zoom.
6. Supported browsers: the last 2 versions of Chrome (Android and desktop), Edge, Firefox and Safari (macOS and iOS). The gate is the Chromium e2e run. WebKit runs as a separate report until its failures are fixed (DR-289). Check Firefox by hand before M2 (DR-341).
7. In your summary, give the changed files, the checks you did, the failures that remain and each `UNRESOLVED_DESIGN_SYSTEM` item.

## 11. How to change this contract

1. Edit the files in `docs/design-system/` only on a page branch. First write each spec change in the page spec log `docs/spec-log/<page>.md` (`AGENTS.md` Section 9, DR-372).
2. The `design-reviewer` agent checks the spec log against the diff at the final checkpoint (`/checkpoint`). tajmin's merge of the page pull request approves the green items. Red items go to tajmin as flags.
3. At the final checkpoint, the coding agent writes the green items into the foundation documents in this folder on the page branch, so they go in the same pull request. A hook allows spec edits only on a `page/` branch, so nothing changes after the merge. Before the merge, a project thread rebuilds this contract (`gen_contract.py` rebuilds the rule index and stops if a rule ID in this contract does not exist) and records the decisions in the project decision register, which is not in this repo (DR-251).
4. The blueprint thread changes the contract template only for Sections 1 to 4 and 6 to 11.
