import { z } from 'zod';

/**
 * Story body: ProseMirror/Tiptap JSON checked against an allowlist. Anything else is rejected
 * rather than stripped, so stored content is always renderable by the public site. Images are
 * references to media assets, never URLs. (docs/07, docs/12)
 */

const MAX_DEPTH = 12;
const MAX_NODES = 20_000;
const MAX_TEXT = 200_000;
const BLOCKS = new Set(['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote', 'horizontalRule', 'image']);
const INLINE = new Set(['text', 'hardBreak']);
const MARKS = new Set(['bold', 'italic', 'underline', 'strike', 'code', 'link']);

/** Every node type a body may contain (besides the root `doc`). Editors must offer exactly these. */
export const bodyNodeTypes = [...BLOCKS, ...INLINE, 'listItem'] as const;
/** Every mark type a body may carry. */
export const bodyMarkTypes = [...MARKS] as const;
/** The only attributes each node or mark may have. Anything else is rejected. */
export const bodyAttrAllowlist: Record<string, readonly string[]> = {
  heading: ['level'],
  orderedList: ['start'],
  image: ['mediaAssetId', 'alt'],
  link: ['href'],
};

/**
 * Drops the bookkeeping attributes an editor adds (a link's `target` and `rel`, empty values,
 * empty content arrays) so a body it produced fits the strict schema. It never removes a node or
 * a mark: content the schema forbids still fails validation instead of silently disappearing.
 */
export function toCanonicalBody(input: unknown): unknown {
  const attrs = (type: string, raw: unknown) => {
    if (typeof raw !== 'object' || raw === null) return undefined;
    const allowed = bodyAttrAllowlist[type] ?? [];
    const kept = Object.fromEntries(Object.entries(raw).filter(([k, v]) => allowed.includes(k) && v !== null && v !== undefined));
    return Object.keys(kept).length > 0 ? kept : undefined;
  };
  const visit = (node: unknown, isRoot = false): unknown => {
    if (typeof node !== 'object' || node === null || Array.isArray(node)) return node;
    const n = node as Record<string, unknown>;
    const type = n.type;
    if (typeof type !== 'string') return node;
    const out: Record<string, unknown> = { type };
    const a = attrs(type, n.attrs);
    if (a) out.attrs = a;
    if (typeof n.text === 'string') out.text = n.text;
    if (Array.isArray(n.marks) && n.marks.length > 0) {
      out.marks = n.marks.map((m) => {
        if (typeof m !== 'object' || m === null || typeof (m as { type?: unknown }).type !== 'string') return m;
        const mark = m as { type: string; attrs?: unknown };
        const ma = attrs(mark.type, mark.attrs);
        return ma ? { type: mark.type, attrs: ma } : { type: mark.type };
      });
    }
    if (Array.isArray(n.content) && (n.content.length > 0 || isRoot)) out.content = n.content.map((c) => visit(c));
    return out;
  };
  return visit(input, true);
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Node {
  type?: unknown;
  attrs?: unknown;
  content?: unknown;
  marks?: unknown;
  text?: unknown;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export const tiptapBodySchema = z
  .object({ type: z.literal('doc'), content: z.array(z.unknown()).max(MAX_NODES).default([]) })
  .strict()
  .superRefine((doc, ctx) => {
    let nodes = 0;
    let textLength = 0;
    const bad = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });

    const checkAttrs = (attrs: unknown, allowed: Record<string, (v: unknown) => boolean>, path: (string | number)[]) => {
      if (attrs === undefined) return;
      if (!isObj(attrs)) return bad([...path, 'attrs'], 'attrs must be an object');
      for (const [k, v] of Object.entries(attrs)) {
        if (!allowed[k]) bad([...path, 'attrs', k], `attribute not allowed: ${k}`);
        else if (!allowed[k](v)) bad([...path, 'attrs', k], `invalid ${k}`);
      }
    };

    const walk = (raw: unknown, path: (string | number)[], depth: number, parent: string) => {
      if (++nodes > MAX_NODES) return bad(path, 'document too large');
      if (depth > MAX_DEPTH) return bad(path, 'document nested too deeply');
      if (!isObj(raw)) return bad(path, 'node must be an object');
      const node = raw as Node;
      const type = node.type;
      if (typeof type !== 'string') return bad([...path, 'type'], 'node type required');

      const blockParent = ['doc', 'blockquote', 'listItem'].includes(parent);
      const inlineParent = ['paragraph', 'heading'].includes(parent);
      const listParent = ['bulletList', 'orderedList'].includes(parent);
      const known = BLOCKS.has(type) || INLINE.has(type) || type === 'listItem';
      if (!known) return bad([...path, 'type'], `node type not allowed: ${type}`);
      if (blockParent && !BLOCKS.has(type)) return bad(path, `${type} cannot appear in ${parent}`);
      if (inlineParent && !INLINE.has(type)) return bad(path, `${type} cannot appear in ${parent}`);
      if (listParent && type !== 'listItem') return bad(path, `${type} cannot appear in ${parent}`);

      if (type === 'text') {
        if (typeof node.text !== 'string' || node.text.length === 0) return bad([...path, 'text'], 'text required');
        textLength += node.text.length;
        if (textLength > MAX_TEXT) return bad(path, 'text too long');
        if (node.content !== undefined) bad([...path, 'content'], 'text nodes have no content');
        if (node.marks !== undefined) {
          if (!Array.isArray(node.marks)) return bad([...path, 'marks'], 'marks must be an array');
          node.marks.forEach((m, i) => {
            const mp = [...path, 'marks', i];
            if (!isObj(m) || typeof m.type !== 'string' || !MARKS.has(m.type)) return bad(mp, 'mark not allowed');
            if (m.type === 'link') {
              checkAttrs(m.attrs, { href: (v) => typeof v === 'string' && v.length <= 2048 && /^(https?:\/\/|mailto:)/i.test(v) }, mp);
              if (!isObj(m.attrs) || m.attrs.href === undefined) bad(mp, 'link needs href');
            } else if (m.attrs !== undefined) bad([...mp, 'attrs'], 'mark takes no attributes');
          });
        }
        return;
      }

      if (node.text !== undefined) bad([...path, 'text'], 'only text nodes carry text');
      if (node.marks !== undefined) bad([...path, 'marks'], 'only text nodes carry marks');

      if (type === 'heading') checkAttrs(node.attrs, { level: (v) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 4 }, path);
      else if (type === 'image') {
        checkAttrs(node.attrs, { mediaAssetId: (v) => typeof v === 'string' && UUID.test(v), alt: (v) => typeof v === 'string' && v.length <= 500 }, path);
        if (!isObj(node.attrs) || node.attrs.mediaAssetId === undefined) bad(path, 'image needs mediaAssetId');
      } else if (type === 'orderedList') checkAttrs(node.attrs, { start: (v) => Number.isInteger(v) && (v as number) >= 0 }, path);
      else checkAttrs(node.attrs, {}, path);

      const leaf = type === 'horizontalRule' || type === 'image' || type === 'hardBreak';
      if (leaf) {
        if (node.content !== undefined) bad([...path, 'content'], `${type} has no content`);
        return;
      }
      if (node.content === undefined) return;
      if (!Array.isArray(node.content)) return bad([...path, 'content'], 'content must be an array');
      node.content.forEach((child, i) => walk(child, [...path, 'content', i], depth + 1, type));
    };

    doc.content.forEach((child, i) => walk(child, ['content', i], 1, 'doc'));
  });

export type TiptapBody = z.infer<typeof tiptapBodySchema>;

export const emptyBody: TiptapBody = { type: 'doc', content: [] };

/** Plain text of a validated body, for length checks and (later) search projection. */
export function bodyPlainText(body: unknown): string {
  const parts: string[] = [];
  const visit = (n: unknown) => {
    if (!isObj(n)) return;
    if (typeof n.text === 'string') parts.push(n.text);
    if (Array.isArray(n.content)) n.content.forEach(visit);
  };
  visit(body);
  return parts.join(' ').trim();
}

/** Media asset ids referenced by image nodes. */
export function bodyMediaAssetIds(body: unknown): string[] {
  const ids = new Set<string>();
  const visit = (n: unknown) => {
    if (!isObj(n)) return;
    if (n.type === 'image' && isObj(n.attrs) && typeof n.attrs.mediaAssetId === 'string') ids.add(n.attrs.mediaAssetId);
    if (Array.isArray(n.content)) n.content.forEach(visit);
  };
  visit(body);
  return [...ids];
}
