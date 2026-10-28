import { storyRef, type Story } from "@/content";
import { localizedPath } from "@/i18n";

// Shared link classes for story parts.
// Focus is the base outline (COL-13): no ring classes here.

const headlineBase = "text-ink hover:text-ink-muted";

/**
 * A news link: ink text, ink-muted on hover, no pressed color, no underline outside
 * article text (COL-06, DR-199; the story sheets C-01, C-02, C-03, C-24, C-25).
 */
export const headlineLink = headlineBase;

/**
 * The story URL, /story/<slug>-<id> for every format (layout 7C, DR-413). Only stories
 * with full text have a page; the others lead to a 404 page in the mock (IMP-18).
 */
export function storyHref(story: Story): string {
  return localizedPath(story.lang, storyPath(story));
}

/** The story path without the language prefix. */
export function storyPath(story: Pick<Story, "slug" | "id">): string {
  return `/story/${storyRef(story)}`;
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

/** The format hub URL: /analysis or /opinion (layout 7C, DR-414). No hub page yet (IMP-18). */
export function formatHref(
  lang: Story["lang"],
  format: Exclude<Story["format"], "news">,
): string {
  return localizedPath(lang, `/${format}`);
}
