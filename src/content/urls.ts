// Article URLs (spacing-layout-system.md 7C, DR-413): /story/<slug>-<id>, the same for
// every format. The page finds the article by <id>; the slug is for people. The proxy
// imports this file, so it keeps to the story data and the article text.
import { articleDefs } from "./reader-articles";
import { stories } from "./stories";
import type { Lang } from "./types";

/** <id>: 6 to 8 base36 characters, after the last hyphen. */
const STORY_REF = /^(.+)-([0-9a-z]{6,8})$/;

/** The path segment of a story: "<slug>-<id>". */
export function storyRef(story: { slug: string; id: string }): string {
  return `${story.slug}-${story.id}`;
}

/** Splits "<slug>-<id>". Null when the segment has no id. */
export function parseStoryRef(
  ref: string,
): { slug: string; id: string } | null {
  const match = STORY_REF.exec(ref);
  return match ? { slug: match[1], id: match[2] } : null;
}

const storyById = new Map(stories.map((def) => [def.id, def]));
const storyBySlug = new Map(stories.map((def) => [def.slug, def]));
const articleBySlug = new Map(articleDefs.map((def) => [def.slug, def]));

/** The path segment of the story with this slug. Throws for an unknown slug. */
export function refForSlug(slug: string): string {
  const def = storyBySlug.get(slug);
  if (!def) throw new Error(`Unknown story slug: ${slug}`);
  return storyRef(def);
}

/** The story slug for an id, or null for an unknown id. */
export function slugForId(id: string): string | null {
  return storyById.get(id)?.slug ?? null;
}

/**
 * The current path segment for a story URL that is wrong or old: a wrong slug with a
 * known id, or the old root /story/<slug> with no id. Null when the segment is already
 * current, or when no article exists in that language (the page gives a 404).
 */
export function currentStoryRef(ref: string, lang: Lang): string | null {
  const parsed = parseStoryRef(ref);
  const def =
    (parsed && storyById.get(parsed.id)) ?? storyBySlug.get(ref) ?? null;
  if (!def || !articleBySlug.get(def.slug)?.[lang]) return null;
  const current = storyRef(def);
  return current === ref ? null : current;
}
