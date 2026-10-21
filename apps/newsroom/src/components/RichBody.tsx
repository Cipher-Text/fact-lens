import type { ReactNode } from 'react';
import { tiptapBodySchema } from '@fact-lens/contracts';
import { isAllowedLink } from '@/lib/editor/extensions';

interface Mark { type: string; attrs?: { href?: string } }
interface Node { type: string; attrs?: Record<string, unknown>; content?: Node[]; text?: string; marks?: Mark[] }

const headingClass = ['', 'text-xl font-semibold', 'text-lg font-semibold', 'text-base font-semibold', 'text-base font-medium'];

function withMarks(text: string, marks: Mark[] = []): ReactNode {
  return marks.reduce<ReactNode>((inner, mark) => {
    switch (mark.type) {
      case 'bold': return <strong>{inner}</strong>;
      case 'italic': return <em>{inner}</em>;
      case 'underline': return <u>{inner}</u>;
      case 'strike': return <s>{inner}</s>;
      case 'code': return <code className="rounded bg-line/50 px-1 font-mono text-[0.9em]">{inner}</code>;
      case 'link': {
        const href = mark.attrs?.href;
        // Checked again here: a body that skipped validation must still not render a script link.
        return href && isAllowedLink(href)
          ? <a href={href} rel="noopener noreferrer nofollow" target="_blank" className="text-accent underline">{inner}</a>
          : inner;
      }
      default: return inner;
    }
  }, text);
}

function renderNode(node: Node, key: number): ReactNode {
  const children = node.content?.map(renderNode);
  switch (node.type) {
    case 'text': return <span key={key}>{withMarks(node.text ?? '', node.marks)}</span>;
    case 'hardBreak': return <br key={key} />;
    case 'paragraph': return <p key={key} className="my-2">{children}</p>;
    case 'heading': {
      const level = Number(node.attrs?.level) || 2;
      const Tag = `h${Math.min(level + 2, 6)}` as 'h3';
      return <Tag key={key} className={`mb-1 mt-4 ${headingClass[level] ?? ''}`}>{children}</Tag>;
    }
    case 'bulletList': return <ul key={key} className="my-2 list-disc pl-6">{children}</ul>;
    case 'orderedList': return <ol key={key} start={Number(node.attrs?.start) || 1} className="my-2 list-decimal pl-6">{children}</ol>;
    case 'listItem': return <li key={key}>{children}</li>;
    case 'blockquote': return <blockquote key={key} className="my-2 border-l-4 border-line pl-4 text-muted">{children}</blockquote>;
    case 'horizontalRule': return <hr key={key} className="my-4 border-line" />;
    case 'image':
      return (
        <figure key={key} className="image-reference my-2" aria-label="Image">
          Image{node.attrs?.alt ? `: ${String(node.attrs.alt)}` : ''}
          <span className="ml-2 text-xs text-muted">(shown once the media library exists)</span>
        </figure>
      );
    default: return null;
  }
}

/**
 * Renders a story body as read-only HTML. It builds elements from the validated JSON and never
 * injects markup, so text from a story cannot become a script. A body that fails the schema is
 * not rendered at all.
 */
export function RichBody({ body, lang }: { body: unknown; lang?: string }) {
  const parsed = tiptapBodySchema.safeParse(body);
  if (!parsed.success) return <p role="alert" className="text-sm text-danger">This text cannot be shown.</p>;
  const nodes = parsed.data.content as Node[];
  if (nodes.length === 0) return <p className="text-sm text-muted">No text yet.</p>;
  return <div lang={lang} className="text-sm">{nodes.map(renderNode)}</div>;
}
