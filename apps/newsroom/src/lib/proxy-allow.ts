/**
 * What the browser may reach through `/api/...`. The proxy forwards to the API with the
 * signed-in user's token, so this list is only a narrowing: it keeps the internal and public
 * surfaces and anything unknown out of reach. The API still decides every request.
 */
const ROOTS = new Set(['news', 'comments', 'assignments', 'sources', 'contributors', 'reference', 'media', 'taxonomy', 'ai', 'me']);
const METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE']);
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/;

export function isAllowedApiRequest(method: string, segments: string[]): boolean {
  if (!METHODS.has(method.toUpperCase()) || segments.length === 0 || segments.length > 6) return false;
  if (!segments.every((s) => SEGMENT.test(s) && s !== '.' && s !== '..' && !s.includes('..'))) return false;
  const [root, second] = segments;
  if (root === 'config') return (second === 'flags' || second === 'locales') && segments.length <= 3;
  return ROOTS.has(root!);
}

export const apiUrl = (base: string, segments: string[], search: string) =>
  `${base.replace(/\/$/, '')}/${segments.map(encodeURIComponent).join('/')}${search}`;
