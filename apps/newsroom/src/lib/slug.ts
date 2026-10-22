/** The slug made from a headline, the same way the API makes it: letters and digits from any script, joined by hyphens. */
export function slugOf(title: string, fallback: string): string {
  const slug = title
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/g, '');
  return /^[\p{L}\p{N}]/u.test(slug) ? slug : fallback;
}
