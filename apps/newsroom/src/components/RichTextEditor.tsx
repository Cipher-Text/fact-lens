'use client';

import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';
import { editorExtensions, isAllowedLink } from '@/lib/editor/extensions';
import { buttonClass, inputClass } from './ui';

/** Typing `example.com` should mean a web page; anything else must already carry its scheme. */
function toLink(raw: string): string | null {
  const value = raw.trim();
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value) ? `https://${value}` : value;
  return isAllowedLink(candidate) ? candidate : null;
}

function ToolButton({ label, active, disabled, onClick, children }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={active} disabled={disabled} onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className={`min-w-8 rounded px-2 py-1 text-sm disabled:opacity-40 ${active ? 'bg-accent text-accent-fg' : 'hover:bg-line/60'}`}>
      {children}
    </button>
  );
}

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState(false);
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'), italic: e.isActive('italic'), underline: e.isActive('underline'), strike: e.isActive('strike'),
      code: e.isActive('code'), link: e.isActive('link'), bullet: e.isActive('bulletList'), ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      heading: ([1, 2, 3, 4] as const).find((level) => e.isActive('heading', { level })) ?? 0,
      canUndo: e.can().undo(), canRedo: e.can().redo(),
    }),
  });
  const run = () => editor.chain().focus();

  function openLink() {
    setLink((editor.getAttributes('link').href as string | undefined) ?? '');
    setLinkError(false);
    setLinkOpen(true);
  }
  function applyLink() {
    const href = toLink(link);
    if (!href) return setLinkError(true);
    run().extendMarkRange('link').setLink({ href }).run();
    setLinkOpen(false);
  }

  return (
    <div role="toolbar" aria-label="Text formatting" className="sticky top-0 z-10 rounded-t border border-line bg-panel p-1">
      <div className="flex items-center gap-x-3 gap-y-1 overflow-x-auto sm:flex-wrap sm:overflow-visible">
        <div role="group" aria-label="Text style" className="flex shrink-0 items-center gap-1 sm:flex-wrap">
        <select aria-label="Block style" value={s.heading} className="rounded border border-line bg-bg px-1 py-1 text-sm"
          onChange={(e) => {
            const level = Number(e.target.value);
            if (level === 0) run().setParagraph().run();
            else run().setHeading({ level: level as 1 | 2 | 3 | 4 }).run();
          }}>
          <option value={0}>Paragraph</option>
          {[1, 2, 3, 4].map((l) => <option key={l} value={l}>Heading {l}</option>)}
        </select>
        <ToolButton label="Bold" active={s.bold} onClick={() => run().toggleBold().run()}><strong>B</strong></ToolButton>
        <ToolButton label="Italic" active={s.italic} onClick={() => run().toggleItalic().run()}><em>I</em></ToolButton>
        <ToolButton label="Underline" active={s.underline} onClick={() => run().toggleUnderline().run()}><u>U</u></ToolButton>
        <ToolButton label="Strikethrough" active={s.strike} onClick={() => run().toggleStrike().run()}><s>S</s></ToolButton>
        <ToolButton label="Code" active={s.code} onClick={() => run().toggleCode().run()}><code>{'</>'}</code></ToolButton>
        <ToolButton label="Link" active={s.link} onClick={openLink}>Link</ToolButton>
        </div>
        <div role="group" aria-label="Blocks" className="flex shrink-0 items-center gap-1 sm:flex-wrap">
        <ToolButton label="Bulleted list" active={s.bullet} onClick={() => run().toggleBulletList().run()}>• List</ToolButton>
        <ToolButton label="Numbered list" active={s.ordered} onClick={() => run().toggleOrderedList().run()}>1. List</ToolButton>
        <ToolButton label="Quote" active={s.quote} onClick={() => run().toggleBlockquote().run()}>“ ”</ToolButton>
        <ToolButton label="Divider" onClick={() => run().setHorizontalRule().run()}>―</ToolButton>
        <ToolButton label="Insert image from the library" onClick={onImage}>Image</ToolButton>
        </div>
        <div role="group" aria-label="History" className="flex shrink-0 items-center gap-1">
        <ToolButton label="Undo" disabled={!s.canUndo} onClick={() => run().undo().run()}>↶</ToolButton>
        <ToolButton label="Redo" disabled={!s.canRedo} onClick={() => run().redo().run()}>↷</ToolButton>
        </div>
      </div>
      {linkOpen ? (
        <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Link">
          <input autoFocus aria-label="Link address" aria-invalid={linkError} value={link} placeholder="https://… or mailto:…" className={`${inputClass} max-w-sm`}
            onChange={(e) => { setLink(e.target.value); setLinkError(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } if (e.key === 'Escape') setLinkOpen(false); }} />
          <button type="button" className={buttonClass('primary')} onClick={applyLink}>Apply</button>
          <button type="button" className={buttonClass()} onClick={() => { run().extendMarkRange('link').unsetLink().run(); setLinkOpen(false); }}>Remove link</button>
          <button type="button" className={buttonClass()} onClick={() => setLinkOpen(false)}>Cancel</button>
          {linkError ? <span role="alert" className="text-xs text-danger">Use a web address (https://…) or a mail address (mailto:…).</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The story text editor. It can only make what the body contract allows. The parent receives the
 * editor so it can read the document when the form is saved, and `onChange` when it is edited.
 */
export function RichTextEditor({ initialContent, lang, label, onEditor, onChange, onPickImage }: {
  initialContent: unknown; lang: string; label: string; onEditor: (editor: Editor | null) => void; onChange: () => void;
  /** Opens the library picker. It lives outside the form, so it cannot submit the story. */
  onPickImage: () => void;
}) {
  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent as object,
    // Next renders on the server first; rendering the editor there would not match the browser.
    immediatelyRender: false,
    editorProps: { attributes: { class: 'rich-editor-content', lang, role: 'textbox', 'aria-multiline': 'true', 'aria-label': label } },
    onUpdate: () => onChange(),
  });
  useEffect(() => {
    onEditor(editor);
    return () => onEditor(null);
  }, [editor, onEditor]);

  if (!editor) return <div className="min-h-48 rounded border border-line bg-bg" aria-busy="true" />;
  return (
    <div className="rich-editor">
      <Toolbar editor={editor} onImage={onPickImage} />
      <EditorContent editor={editor} />
    </div>
  );
}
