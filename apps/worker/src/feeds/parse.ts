import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';
import type { FeedItemInput } from '@fact-lens/contracts';
import { FeedFetchError } from './safe-fetch';

const MAX_ITEMS = 100;
const SUMMARY_CHARS = 600;

const parser = new XMLParser({
  ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text', parseTagValue: false, trimValues: true,
  processEntities: true, isArray: (name) => ['item', 'entry', 'link'].includes(name),
});

type Node = string | { '#text'?: string; [k: string]: unknown } | undefined;

/** The text of a node, whether it is plain or carries attributes. */
const textOf = (n: unknown): string => {
  if (typeof n === 'string') return n;
  if (n && typeof n === 'object' && typeof (n as { '#text'?: unknown })['#text'] === 'string') return (n as { '#text': string })['#text'];
  return '';
};

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
/** Plain text from a title or description: tags removed, entities decoded, spaces collapsed. */
export function toPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === '#') {
        const code = e[1]!.toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : ' ';
      }
      return NAMED[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

const toUrl = (s: string): string | undefined => {
  try {
    const u = new URL(s.trim());
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
};

const toDate = (s: string): string | undefined => {
  const t = Date.parse(s);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
};

const cut = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`);

/** RSS 2.0, RSS 1.0 (RDF) and Atom, into the inbox's own shape. Anything it cannot use is skipped, not guessed. */
export function parseFeed(xml: string): FeedItemInput[] {
  if (/<!ENTITY/i.test(xml)) throw new FeedFetchError('The feed uses features that are not allowed');
  let doc: Record<string, any>;
  try {
    doc = parser.parse(xml) as Record<string, any>;
  } catch {
    throw new FeedFetchError('The feed could not be read as XML');
  }
  const raw: Array<Record<string, any>> =
    doc.rss?.channel?.item ?? doc['rdf:RDF']?.item ?? doc.feed?.entry ?? [];
  if (!doc.rss && !doc['rdf:RDF'] && !doc.feed) throw new FeedFetchError('The address did not return an RSS or Atom feed');

  const items: FeedItemInput[] = [];
  for (const it of raw.slice(0, MAX_ITEMS * 2)) {
    const title = toPlainText(textOf(it.title as Node));
    if (!title) continue;
    const links = Array.isArray(it.link) ? it.link : it.link ? [it.link] : [];
    const atomLink = links.find((l: any) => typeof l === 'object' && (!l['@_rel'] || l['@_rel'] === 'alternate'));
    const url = toUrl(atomLink?.['@_href'] ?? textOf(links.find((l: any) => typeof l === 'string' || textOf(l)))) ?? toUrl(textOf(it.guid as Node));
    const guid = textOf(it.guid as Node) || textOf(it.id as Node) || url ||
      createHash('sha256').update(`${title}|${textOf(it.pubDate as Node)}`).digest('hex').slice(0, 32);
    const summary = toPlainText(textOf((it.description ?? it.summary ?? it['content:encoded'] ?? it.content) as Node));
    const publishedAt = toDate(textOf((it.pubDate ?? it.published ?? it.updated ?? it['dc:date']) as Node));
    items.push({
      guid: guid.slice(0, 1000), title: cut(title, 500), ...(url ? { url } : {}),
      ...(summary ? { summary: cut(summary, SUMMARY_CHARS) } : {}), ...(publishedAt ? { publishedAt } : {}),
    });
    if (items.length >= MAX_ITEMS) break;
  }
  return items;
}
