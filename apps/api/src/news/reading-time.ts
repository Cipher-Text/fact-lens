import { DEFAULT_READING_RATES, type ReadingRates } from '@fact-lens/contracts';

/** A node of a Tiptap document (only the parts this module reads). */
export interface BodyNode {
  type?: string;
  text?: string;
  content?: BodyNode[];
}

/** Blocks whose text is read for the reading time (doc 24 section 3). Images and rules have no text here. */
const TEXT_BLOCKS = new Set(['paragraph', 'heading']);

/** The text of a node and everything under it. */
function textOf(node: BodyNode): string {
  if (typeof node.text === 'string') return node.text;
  return (node.content ?? []).map(textOf).join(' ');
}

/** Collects the text blocks of a body in order. A list item with no paragraph of its own is read as text. */
function textBlocks(node: BodyNode, out: string[]): void {
  if (node.type && TEXT_BLOCKS.has(node.type)) {
    out.push(textOf(node));
    return;
  }
  if (node.type === 'listItem' && !(node.content ?? []).some((child) => child.type === 'paragraph')) {
    out.push(textOf(node));
    return;
  }
  for (const child of node.content ?? []) textBlocks(child, out);
}

/** Words in a body, counted with the language's word segmenter, so Bangla punctuation is not a word. */
export function countWords(body: BodyNode, lang: string): number {
  const blocks: string[] = [];
  textBlocks(body, blocks);
  const segmenter = new Intl.Segmenter(lang, { granularity: 'word' });
  let words = 0;
  for (const block of blocks) {
    for (const segment of segmenter.segment(block)) {
      if (segment.isWordLike) words += 1;
    }
  }
  return words;
}

/** Calculated reading time in whole minutes: at least one, the words divided by the language's rate (doc 24). */
export function readingMinutesFor(body: BodyNode, lang: string, rates: ReadingRates = DEFAULT_READING_RATES): number {
  const rate = (rates as Record<string, number>)[lang] ?? rates.en;
  return Math.max(1, Math.round(countWords(body, lang) / rate));
}

/** The editor's override when there is one, otherwise the calculation. */
export function effectiveReadingMinutes(calculated: number, override: number | null | undefined): number {
  return override ?? calculated;
}
