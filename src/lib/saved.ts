// Saved stories: a list of story ids in local storage, for this mock.

/**
 * The stored list of saved story ids. A value that is not valid JSON, or not an array of
 * strings, reads as an empty list, so a bad value never breaks the page.
 */
export function parseSaved(raw: string | null): string[] {
  if (raw === null) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Before the URL format (layout 7C) the list held slugs; it holds ids now. A save of this
 * story under its slug counts as a save of its id, and the next write stores the id. Other
 * old slugs stay until their story is opened (PR #15 review).
 */
export function migrateSaved(
  list: string[],
  story: { id: string; slug: string },
): string[] {
  if (!list.includes(story.slug)) return list;
  const next = list.map((item) => (item === story.slug ? story.id : item));
  return next.filter((item, index) => next.indexOf(item) === index);
}
