'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import type { Editor } from '@tiptap/react';
import { tiptapBodySchema, toCanonicalBody, type AiSuggestion, type AiTranslation } from '@fact-lens/contracts';
import { bff } from '@/lib/client';
import { submitWith } from '@/lib/form';
import { collectTexts, replaceTexts } from '@/lib/translate-doc';
import { MediaPicker } from './MediaParts';
import { RichTextEditor } from './RichTextEditor';
import { buttonClass, Field, inputClass, Notice } from './ui';

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

/** The language a new language is translated from: the first text of the news item. */
export interface TranslationSource {
  locale: string;
  localeName: string;
  title: string;
  dek: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  body: unknown;
}

/**
 * Edits one language of a news: headline, standfirst, slug, rich text and search text.
 * `siblingSlug` is the slug of another language of the same news, if it is Latin letters: a slug is
 * unique per language, so the languages can share one, and a suggestion then keeps it.
 */
export function TranslationEditor({ newsId, translation, siblingSlug, tagIds = [], source }: {
  newsId: string; translation: EditableTranslation; siblingSlug?: string | null; tagIds?: string[]; source?: TranslationSource | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const seoRef = useRef<HTMLDetailsElement>(null);
  const [suggesting, startSuggest] = useTransition();
  const [suggestFailed, setSuggestFailed] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<AiSuggestion['tags']>([]);
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagging, startTagging] = useTransition();
  // Tags are saved on the news item at once, not with the text; the ones already on it are not offered again.
  const offered = suggestedTags.filter((t) => !tagIds.includes(t.id));
  function addTags(add: AiSuggestion['tags']) {
    setTagError(null);
    startTagging(async () => {
      const res = await bff('PUT', `news/${newsId}/tags`, { tagIds: [...tagIds, ...add.map((t) => t.id)] });
      if (!res.ok) return setTagError(res.message);
      router.refresh();
    });
  }
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

  const [translating, startTranslating] = useTransition();

  /** Translates the first language's headline, standfirst, search text and body into this one. Nothing is saved until the editor saves. */
  function translate() {
    setMessage(null);
    setSuggestFailed(true);
    const form = formRef.current;
    if (!editor || !form || !source) return;
    const el = (n: string) => form.elements.namedItem(n) as HTMLInputElement | HTMLTextAreaElement;
    const segments = collectTexts(source.body);
    if (!source.title.trim() || segments.every((t) => !t.trim())) {
      return setMessage({ kind: 'error', text: `Write the ${source.localeName} text first: there is nothing to translate yet.`, issues: [] });
    }
    const filled = ['title', 'dek', 'seoTitle', 'seoDescription'].some((f) => el(f).value.trim()) || editor.getText().trim();
    if (filled && !window.confirm(`Replace this ${translation.localeName} text with a translation of the ${source.localeName} text?`)) return;
    startTranslating(async () => {
      const res = await bff<AiTranslation>('POST', 'ai/news-translate', {
        fromLocale: source.locale, toLocale: translation.locale, title: source.title, dek: source.dek ?? '',
        seoTitle: source.seoTitle ?? '', seoDescription: source.seoDescription ?? '', segments,
      });
      if (!res.ok) return setMessage({ kind: 'error', text: res.message, issues: res.issues });
      let body;
      try {
        body = replaceTexts(source.body, res.data.segments);
      } catch {
        return setMessage({ kind: 'error', text: 'The translation did not fit the text. Try again.', issues: [] });
      }
      el('title').value = res.data.title;
      el('dek').value = res.data.dek;
      el('seoTitle').value = res.data.seoTitle;
      el('seoDescription').value = res.data.seoDescription;
      if (siblingSlug && !el('slug').value.trim()) el('slug').value = siblingSlug;
      editor.commands.setContent(body as Parameters<Editor['commands']['setContent']>[0]);
      if (seoRef.current) seoRef.current.open = true;
      setSuggestFailed(false);
      setDirty(true);
      setMessage({ kind: 'ok', text: `Translated from ${source.localeName}. Check it, then save.`, issues: [] });
    });
  }

  /** Fills the headline, standfirst, slug and search text from the text. Nothing is saved until the editor saves. */
  function suggest() {
    setMessage(null);
    setSuggestFailed(true);
    const form = formRef.current;
    if (!editor || !form) return;
    const text = editor.getText({ blockSeparator: '\n\n' }).trim();
    if (text.length < 40) return setMessage({ kind: 'error', text: 'Write the text first: suggestions need at least 40 characters.', issues: [] });
    const fields = ['title', 'dek', 'slug', 'seoTitle', 'seoDescription'] as const;
    const el = (n: string) => form.elements.namedItem(n) as HTMLInputElement | HTMLTextAreaElement;
    if (fields.some((f) => el(f).value.trim()) && !window.confirm('Replace the headline, standfirst, slug and search text with the suggestions?')) return;
    startSuggest(async () => {
      const res = await bff<AiSuggestion>('POST', 'ai/news-suggest', { locale: translation.locale, text });
      if (!res.ok) return setMessage({ kind: 'error', text: res.message, issues: res.issues });
      setSuggestFailed(false);
      const v = { ...res.data, slug: siblingSlug || res.data.slug };
      for (const f of fields) el(f).value = v[f];
      setSuggestedTags(res.data.tags);
      if (seoRef.current) seoRef.current.open = true;
      setDirty(true);
      setMessage({ kind: 'ok', text: 'Suggestions filled in. Check them, then save.', issues: [] });
    });
  }

  function save(form: FormData) {
    setMessage(null);
    setSuggestFailed(false);
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
    <form ref={formRef} onSubmit={submitWith((form) => save(form))} onChange={() => setDirty(true)} className="space-y-3" lang={translation.locale}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={suggest} disabled={suggesting || translating || !editor} className={buttonClass('primary')}>{suggesting ? 'Generating…' : '✨ Generate with Gemini'}</button>
        {source ? <button type="button" onClick={translate} disabled={suggesting || translating || !editor} className={buttonClass('primary')}>{translating ? 'Translating…' : `🌐 Translate with Gemini from ${source.localeName}`}</button> : null}
      </div>
      {offered.length > 0 ? (
        <div className="space-y-1">
          <p className="text-sm font-medium">Suggested tags</p>
          <ul className="flex flex-wrap items-center gap-1">
            {offered.map((t) => <li key={t.id}><button type="button" disabled={tagging} onClick={() => addTags([t])} className={buttonClass()}>+ {t.name}</button></li>)}
            {offered.length > 1 ? <li><button type="button" disabled={tagging} onClick={() => addTags(offered)} className={buttonClass()}>Add all</button></li> : null}
          </ul>
          {tagError ? <Notice kind="error" message={tagError} issues={[]} /> : null}
        </div>
      ) : null}
      {message && message.kind === 'error' && suggestFailed ? <Notice kind="error" message={message.text} issues={message.issues} /> : null}
      <Field label="Headline"><input name="title" defaultValue={translation.title} required maxLength={300} className={inputClass} /></Field>
      <Field label="Standfirst"><textarea name="dek" defaultValue={translation.dek ?? ''} maxLength={600} rows={2} className={inputClass} /></Field>
      <Field label="Slug" hint="Letters, digits and hyphens. Reserved when the news item is published. Each language has its own, and they may be the same.">
        <input name="slug" defaultValue={translation.slug} required className={inputClass} />
      </Field>
      <div>
        <span className="mb-1 block text-sm font-medium" id={`text-${translation.locale}`}>Text</span>
        <RichTextEditor initialContent={translation.body} lang={translation.locale} label={`News text (${translation.localeName})`} onEditor={onEditor} onChange={markDirty} onPickImage={() => setPicking(true)} />
      </div>
      <details ref={seoRef} className="text-sm">
        <summary className="cursor-pointer text-muted">Search and sharing text</summary>
        <div className="mt-2 space-y-3">
          <Field label="SEO title"><input name="seoTitle" defaultValue={translation.seoTitle ?? ''} maxLength={120} className={inputClass} /></Field>
          <Field label="SEO description"><textarea name="seoDescription" defaultValue={translation.seoDescription ?? ''} maxLength={320} rows={2} className={inputClass} /></Field>
        </div>
      </details>
      {message && !(message.kind === 'error' && suggestFailed) ? <Notice kind={message.kind} message={message.text} issues={message.issues} /> : null}
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
