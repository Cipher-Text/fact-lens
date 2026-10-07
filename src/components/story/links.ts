import type { Story } from "@/content";
import { localizedPath } from "@/i18n";

// Shared link classes for story parts. Neutral treatment (U-02, U-11).
// Each link has two versions: on the page background and on surface-elevated
// (বিশ্লেষণ ও মতামত), because the focus ring offset takes the color of the surface
// below (COL-13, DOC-07).

const ringBase =
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none";
const ring = `${ringBase} focus-visible:ring-offset-background`;
const ringElevated = `${ringBase} focus-visible:ring-offset-surface-elevated`;

const headlineBase =
  "text-ink hover:text-interactive-hover active:text-interactive-pressed";
const textBase =
  "text-interactive hover:text-interactive-hover active:text-interactive-pressed";

/**
 * A headline link: ink text, interactive color on hover and press, no underline
 * outside article text (COL-06). The headline color is not in the specs (U-11).
 */
export const headlineLink = `${headlineBase} ${ring}`;
export const headlineLinkElevated = `${headlineBase} ${ringElevated}`;

/** A text link in interactive color, for example "আরও দেখুন" (COL-05, typography 7.1). */
export const textLink = `${textBase} ${ring}`;
export const textLinkElevated = `${textBase} ${ringElevated}`;

/**
 * The story URL. Article pages do not exist yet (AGENTS.md Section 1), so the link
 * leads to a 404 page in the prototype (IMP-18).
 */
export function storyHref(story: Story): string {
  return localizedPath(story.lang, `/story/${story.slug}`);
}
