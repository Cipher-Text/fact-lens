import type { Story } from "@/content";
import { localizedPath } from "@/i18n";

// Shared link classes for story parts.
// Focus is the base outline (COL-13): no ring classes here.

const headlineBase = "text-ink hover:text-ink-muted";
const textBase =
  "text-interactive hover:text-interactive-hover active:text-interactive-pressed";

/**
 * A news link: ink text, ink-muted on hover, no pressed color, no underline outside
 * article text (COL-06, DR-199; the story sheets C-01, C-02, C-03, C-24, C-25).
 */
export const headlineLink = headlineBase;

/** A text link in interactive color, for example the privacy link (COL-05, typography 7.1). */
export const textLink = textBase;

/**
 * The story URL. Article pages do not exist yet (AGENTS.md Section 1), so the link
 * leads to a 404 page in the prototype (IMP-18).
 */
export function storyHref(story: Story): string {
  return localizedPath(story.lang, `/story/${story.slug}`);
}

/**
 * The category page URL (the Eyebrow link). Category pages do not exist yet, so the link
 * leads to a 404 page in the prototype, like the story links (IMP-18).
 */
export function categoryHref(
  lang: Story["lang"],
  category: Story["category"],
): string {
  return localizedPath(lang, `/category/${category}`);
}
