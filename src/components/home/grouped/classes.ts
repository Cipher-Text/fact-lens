import { filledButton, focusRing } from "@/components/header/classes";

// Shared classes for the P-3 rail modules. Neutral treatment (U-22): a top rule in the
// divider color with the section rule-to-title space, so the module tops line up with
// the category heading rules. Never the ad label or ad colors (7.4).
export const railModule =
  "border-t border-border pt-(--space-section-rule-title)";

export const railHeading = "type-story-title-sm text-ink";

// Inputs use border-interactive (color-system.md 2). 44px tall (U-05).
export const textField = `min-h-11 w-full min-w-0 border border-border-interactive bg-background px-3 type-input text-ink aria-invalid:border-error ${focusRing}`;

export const submitButton = `${filledButton} ${focusRing} aria-disabled:cursor-progress`;
