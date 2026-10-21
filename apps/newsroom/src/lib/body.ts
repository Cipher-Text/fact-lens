import { tiptapBodySchema } from '@fact-lens/contracts';

/**
 * The shell edits plain paragraphs only. A body with anything else (bold, links, lists, images)
 * returns null so the editor stays closed: saving it as plain text would silently destroy content.
 */
export function bodyToPlainText(body: unknown): string | null {
  const parsed = tiptapBodySchema.safeParse(body);
  if (!parsed.success) return null;
  const paragraphs: string[] = [];
  for (const node of parsed.data.content as Array<{ type?: string; attrs?: unknown; content?: Array<{ type?: string; text?: string; marks?: unknown }> }>) {
    if (node.type !== 'paragraph' || node.attrs) return null;
    let text = '';
    for (const child of node.content ?? []) {
      if (child.type !== 'text' || child.marks) return null;
      text += child.text ?? '';
    }
    paragraphs.push(text);
  }
  return paragraphs.join('\n\n');
}

/** Blank lines separate paragraphs; single line breaks inside one are kept as spaces. */
export function plainTextToBody(text: string) {
  const paragraphs = text.replace(/\r\n/g, '\n').split(/\n{2,}/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  return { type: 'doc' as const, content: paragraphs.map((p) => ({ type: 'paragraph', content: [{ type: 'text', text: p }] })) };
}
