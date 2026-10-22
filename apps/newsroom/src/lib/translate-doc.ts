/**
 * Translating a body keeps its structure: the document's text pieces go out in order and come back in
 * the same order, so headings, bold, links and images stay where they are and only the words change.
 */
type Node = { type?: string; text?: string; content?: Node[]; [k: string]: unknown };

/** Every text piece of a document, in reading order. */
export function collectTexts(doc: unknown): string[] {
  const out: string[] = [];
  const walk = (n: Node) => {
    if (typeof n.text === 'string') out.push(n.text);
    n.content?.forEach(walk);
  };
  if (doc && typeof doc === 'object') walk(doc as Node);
  return out;
}

/** A copy of the document with its text pieces replaced, in the same order. The count must match. */
export function replaceTexts<T>(doc: T, texts: string[]): T {
  const copy = structuredClone(doc) as unknown as Node;
  let i = 0;
  const walk = (n: Node) => {
    if (typeof n.text === 'string') n.text = texts[i++] ?? n.text;
    n.content?.forEach(walk);
  };
  walk(copy);
  if (i !== texts.length) throw new Error('The translation does not fit the text.');
  return copy as unknown as T;
}
