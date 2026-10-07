// Shared class lists for the header controls. Neutral treatment (U-02, U-04).
// Each control has two versions: on the page background (the bar, the nav row) and on
// surface-elevated (the drawer, the search dialog), because the focus ring offset takes
// the color of the surface below (COL-13).

const ring =
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none";

export const focusRing = `${ring} focus-visible:ring-offset-background`;
export const focusRingElevated = `${ring} focus-visible:ring-offset-surface-elevated`;

// A 44px icon-only button in interactive color (COL-05, U-05).
const iconButtonBase =
  "inline-flex size-11 shrink-0 items-center justify-center text-interactive hover:bg-accent-subtle hover:text-interactive-hover active:text-interactive-pressed";

export const iconButton = `${iconButtonBase} ${focusRing}`;
export const iconButtonElevated = `${iconButtonBase} ${focusRingElevated}`;

// A text link in interactive color.
const navLinkBase =
  "text-interactive underline-offset-4 hover:text-interactive-hover hover:underline active:text-interactive-pressed";

export const navLink = `${navLinkBase} ${focusRing}`;
export const navLinkElevated = `${navLinkBase} ${focusRingElevated}`;

// A filled interactive button or button-like link, 44px tall (Subscribe, search).
export const filledButton =
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-interactive px-4 type-button text-on-interactive hover:bg-interactive-hover active:bg-interactive-pressed";
