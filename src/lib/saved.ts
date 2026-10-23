// Saved stories: a list of slugs in local storage, for this mock.

/**
 * The stored list of saved slugs. A value that is not valid JSON, or not an array of
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
