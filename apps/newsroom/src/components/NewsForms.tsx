'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import type { Editor } from '@tiptap/react';
import { tiptapBodySchema, toCanonicalBody } from '@fact-lens/contracts';
import { bff } from '@/lib/client';
import { submitWith } from '@/lib/form';
import { MediaPicker } from './MediaParts';
import { RichTextEditor } from './RichTextEditor';
import { buttonClass, Field, inputClass, Notice } from './ui';

type Failure = { message: string; issues: string[] } | null;

export function NewNewsForm({ locales }: { locales: Array<{ code: string; displayName: string }> }) {
  const router = useRouter();
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();

  function submit(form: FormData) {
    setError(null);
    start(async () => {
      const res = await bff<{ news: { id: string } }>('POST', 'news', { locale: form.get('locale'), title: form.get('title') });
      if (!res.ok) return setError({ message: res.message, issues: res.issues });
      router.push(`/news/${res.data.news.id}`);
    });
  }

  return (
    <form onSubmit={submitWith((form) => submit(form))} className="max-w-xl space-y-4 rounded-lg border border-line bg-panel p-4">
      <Field label="Language">
        <select name="locale" className={inputClass} defaultValue={locales[0]?.code}>
          {locales.map((l) => <option key={l.code} value={l.code}>{l.displayName}</option>)}
        </select>
      </Field>
      <Field label="Headline" hint="You can change it, and the web address, later.">
        <input name="title" required maxLength={300} className={inputClass} />
      </Field>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
      <button type="submit" disabled={pending} className={buttonClass('primary')}>{pending ? 'Creating…' : 'Create draft'}</button>
    </form>
  );
}

export interface EditableTranslation {
  locale: string;
  localeName: string;
  title: string;
  dek: string | null;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  body: unknown;
  version: number | null;
}

/** Edits one language of a news: headline, standfirst, address, rich text and search text. */
export function TranslationEditor({ newsId, translation }: { newsId: string; translation: EditableTranslation }) {
  const router = useRouter();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [dirty, setDirty] = useState(false);
  const [picking, setPicking] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string; issues: string[] } | null>(null);
  const [pending, start] = useTransition();
  const onEditor = useCallback((e: Editor | null) => setEditor(e), []);
  const markDirty = useCallback(() => setDirty(true), []);

  // Closing the tab with unsaved changes would lose them; ask first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function save(form: FormData) {
    setMessage(null);
    if (!editor) return setMessage({ kind: 'error', text: 'The editor is still loading.', issues: [] });
    // The editor adds bookkeeping (link targets, empty values); strip it, then check the strict contract.
    const body = toCanonicalBody(editor.getJSON());
    const checked = tiptapBodySchema.safeParse(body);
    if (!checked.success) {
      return setMessage({ kind: 'error', text: 'The text has something that cannot be saved.', issues: checked.error.issues.map((i) => i.message) });
    }
    start(async () => {
      const res = await bff('PUT', `news/${newsId}/translations/${translation.locale}`, {
        title: form.get('title'), dek: (form.get('dek') as string) || null, slug: form.get('slug'),
        seoTitle: (form.get('seoTitle') as string) || null, seoDescription: (form.get('seoDescription') as string) || null,
        body: checked.data, expectedVersion: translation.version,
      });
      if (!res.ok) {
        const conflict = res.reason === 'version_conflict';
        return setMessage({ kind: 'error', text: conflict ? 'Someone else changed this translation. Reload to see their version before saving.' : res.message, issues: res.issues });
      }
      setDirty(false);
      setMessage({ kind: 'ok', text: 'Saved', issues: [] });
      router.refresh();
    });
  }

  return (
    <>
    <form onSubmit={submitWith((form) => save(form))} onChange={() => setDirty(true)} className="space-y-3" lang={translation.locale}>
      <Field label="Headline"><input name="title" defaultValue={translation.title} required maxLength={300} className={inputClass} /></Field>
      <Field label="Standfirst"><textarea name="dek" defaultValue={translation.dek ?? ''} maxLength={600} rows={2} className={inputClass} /></Field>
      <Field label="Slug" hint="Letters, digits and hyphens. Reserved when the news item is published.">
        <input name="slug" defaultValue={translation.slug} required className={inputClass} />
      </Field>
      <div>
        <span className="mb-1 block text-sm font-medium" id={`text-${translation.locale}`}>Text</span>
        <RichTextEditor initialContent={translation.body} lang={translation.locale} label={`News text (${translation.localeName})`} onEditor={onEditor} onChange={markDirty} onPickImage={() => setPicking(true)} />
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted">Search and sharing text</summary>
        <div className="mt-2 space-y-3">
          <Field label="SEO title"><input name="seoTitle" defaultValue={translation.seoTitle ?? ''} maxLength={120} className={inputClass} /></Field>
          <Field label="SEO description"><textarea name="seoDescription" defaultValue={translation.seoDescription ?? ''} maxLength={320} rows={2} className={inputClass} /></Field>
        </div>
      </details>
      {message ? <Notice kind={message.kind} message={message.text} issues={message.issues} /> : null}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || !editor} className={buttonClass('primary')}>
          {pending ? 'Saving…' : translation.version === null ? `Add ${translation.localeName}` : 'Save'}
        </button>
        {dirty && !pending ? <span className="text-xs text-muted">Unsaved changes</span> : null}
      </div>
    </form>
    {/* Outside the form on purpose: the picker has its own buttons and fields, and Enter in them must not save the news item. */}
    <MediaPicker open={picking} onClose={() => setPicking(false)}
      onChoose={({ mediaAssetId, alt }) => {
        editor?.chain().focus().insertContent({ type: 'image', attrs: { mediaAssetId, alt } }).run();
        setPicking(false);
      }} />
    </>
  );
}
