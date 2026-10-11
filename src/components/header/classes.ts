// Shared class lists for controls that other sections still use. The header itself uses
// the IconButton and Button parts (C-12); these go when R2-11 and R2-14 move their callers.

const ring =
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none";

export const focusRing = `${ring} focus-visible:ring-offset-background`;

// A 44px icon-only button in interactive color (COL-05, U-05).
export const iconButton = `inline-flex size-11 shrink-0 items-center justify-center text-interactive hover:bg-accent-subtle hover:text-interactive-hover active:text-interactive-pressed ${focusRing}`;

// A filled interactive button or button-like link, 44px tall.
export const filledButton =
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-interactive px-4 type-button text-on-interactive hover:bg-interactive-hover active:bg-interactive-pressed";

// A UI link in a menu: ink, interactive states, no underline (COL-06, DR-199).
export const uiLink =
  "text-ink hover:text-interactive-hover active:text-interactive-pressed aria-[current=page]:text-interactive";
