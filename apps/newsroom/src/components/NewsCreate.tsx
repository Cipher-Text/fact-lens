'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import type { Editor } from '@tiptap/react';
import {
  tiptapBodySchema, toCanonicalBody, type AiSuggestion, type AiTranslation, type Category, type Desk, type InboxItem, type TaxonomyTag,
} from '@fact-lens/contracts';
import { bff } from '@/lib/client';
import { slugOf } from '@/lib/slug';
import { collectTexts, replaceTexts } from '@/lib/translate-doc';
import { MediaPicker } from './MediaParts';
import { RichTextEditor } from './RichTextEditor';
import { SectionPicker, type Sections } from './SectionPicker';
import { buttonClass, Field, inputClass, Notice, Panel } from './ui';

interface Draft { title: string; dek: string; slug: string; seoTitle: string; seoDescription: string }
const blank: Draft = { title: '', dek: '', slug: '', seoTitle: '', seoDescription: '' };
type Tag = { id: string; name: string };
type Note = { kind: 'error' | 'ok'; text: string } | null;

const tagName = (t: TaxonomyTag) => t.labels.find((l) => l.locale === 'en')?.name ?? t.labels[0]?.name ?? t.key;
const categoryName = (c: Category) => c.labels.find((l) => l.locale === 'en')?.name ?? c.labels[0]?.name ?? c.key;
const emptyDoc = { type: 'doc', content: [] };

/**
 * The whole new news item in one form: a block for each language (the first is open, the others
 * fold away), the desk, section and tags. One button creates it with everything and goes to the
 * desk queue, so there is no second form to fill in afterwards.
 */
export function NewNewsForm({ locales, desks, categories, fromInbox = null }: {
  locales: Array<{ code: string; displayName: string }>; desks: Desk[]; categories: Category[];
  /** A source inbox item this news item is made from: it fills the headline and becomes the news item's source. */
  fromInbox?: InboxItem | null;
}) {
  const router = useRouter();
  // The headline goes in the language it is written in: Bangla script, else English, else the first language.
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    if (!fromInbox) return {};
    const prefix = /[\u0980-\u09FF]/.test(fromInbox.title) ? 'bn' : 'en';
    const into = locales.find((l) => l.code === prefix || l.code.startsWith(`${prefix}-`)) ?? locales[0];
    return into ? { [into.code]: { ...blank, title: fromInbox.title } } : {};
  });
  const editors = useRef<Record<string, Editor | null>>({});
  const [deskId, setDeskId] = useState('');
  const [sections, setSections] = useState<Sections>({ ids: [], primary: null });
  const [tags, setTags] = useState<Tag[]>([]);
  const [picking, setPicking] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<{ message: string; issues: string[] } | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const draftOf = (code: string) => drafts[code] ?? blank;
  const patch = (code: string, p: Partial<Draft>) => {
    setDrafts((d) => ({ ...d, [code]: { ...(d[code] ?? blank), ...p } }));
    setDirty(true);
  };
  const addTags = (add: Tag[]) => setTags((cur) => [...cur, ...add.filter((t) => !cur.some((c) => c.id === t.id))]);

  useEffect(() => {
    if (!dirty || createdId) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, createdId]);

  const bodyOf = (code: string) => {
    const ed = editors.current[code];
    return ed ? toCanonicalBody(ed.getJSON()) : emptyDoc;
  };
  const textOf = (code: string) => editors.current[code]?.getText({ blockSeparator: '\n\n' }).trim() ?? '';
  /** A Latin slug already written in another language, which this one may share. */
  const siblingSlug = (code: string) =>
    locales.filter((l) => l.code !== code).map((l) => draftOf(l.code).slug.trim()).find((s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s));
  /** What another language holds, to translate from: the first other block with a headline and text. */
  const sourceFor = (code: string) => {
    const other = locales.find((l) => l.code !== code && draftOf(l.code).title.trim() && textOf(l.code));
    if (!other) return null;
    const d = draftOf(other.code);
    return { locale: other.code, localeName: other.displayName, title: d.title.trim(), dek: d.dek, seoTitle: d.seoTitle, seoDescription: d.seoDescription, body: bodyOf(other.code) };
  };

  function create() {
    setError(null);
    const used = locales.filter((l) => draftOf(l.code).title.trim());
    if (used.length === 0) return setError({ message: 'Write a headline in at least one language.', issues: [] });
    const bodies: Record<string, unknown> = {};
    for (const l of used) {
      const checked = tiptapBodySchema.safeParse(bodyOf(l.code));
      if (!checked.success) return setError({ message: `The ${l.displayName} text has something that cannot be saved.`, issues: checked.error.issues.map((i) => i.message) });
      bodies[l.code] = checked.data;
    }
    start(async () => {
      const first = used[0]!;
      const slugs = Object.fromEntries(used.map((l) => {
        const d = draftOf(l.code);
        return [l.code, d.slug.trim() || slugOf(d.title.trim(), `news-${Date.now().toString(36)}`)];
      }));
      const made = await bff<{ news: { id: string } }>('POST', 'news', {
        locale: first.code, title: draftOf(first.code).title.trim(), slug: slugs[first.code],
        ...(deskId ? { deskId } : {}), ...(sections.ids.length ? { categoryId: sections.primary, categoryIds: sections.ids } : {}),
      });
      if (!made.ok) return setError({ message: made.message, issues: made.issues });
      const id = made.data.news.id;
      // The item exists now. If a later step fails, say so and point at the draft rather than lose what was typed.
      const stop = (what: string, m: { message: string; issues: string[] }) => {
        setCreatedId(id);
        setError({ message: `The news item was created, but ${what} could not be saved: ${m.message}`, issues: m.issues });
      };
      for (const l of used) {
        const d = draftOf(l.code);
        const saved = await bff('PUT', `news/${id}/translations/${l.code}`, {
          title: d.title.trim(), dek: d.dek.trim() || null, slug: slugs[l.code], seoTitle: d.seoTitle.trim() || null,
          seoDescription: d.seoDescription.trim() || null, body: bodies[l.code], expectedVersion: l.code === first.code ? 1 : null,
        });
        if (!saved.ok) return stop(`the ${l.displayName} text`, saved);
      }
      if (tags.length > 0) {
        const t = await bff('PUT', `news/${id}/tags`, { tagIds: tags.map((x) => x.id) });
        if (!t.ok) return stop('its tags', t);
      }
      if (fromInbox) {
        const u = await bff('POST', `inbox/${fromInbox.id}/use`, { newsId: id });
        if (!u.ok) return stop('the link to its source', u);
      }
      setDirty(false);
      router.push('/');
      router.refresh();
    });
  }

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); create(); }} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {fromInbox ? (
            <div className="rounded-xl border border-line bg-panel p-4 text-sm">
              <p className="font-semibold">From the source inbox</p>
              <p className="mt-1">
                {fromInbox.url ? <a href={fromInbox.url} target="_blank" rel="noopener noreferrer" className="underline">{fromInbox.title}</a> : fromInbox.title}
                <span className="text-muted"> · {fromInbox.feedName}</span>
              </p>
              {fromInbox.summary ? <p className="mt-1 text-muted">{fromInbox.summary}</p> : null}
              <p className="mt-2 text-xs text-muted">Write the story in your own words. This item is attached to the news item as its source when you create it.</p>
            </div>
          ) : null}
          {locales.map((l, i) => (
            <details key={l.code} open={i === 0} className="rounded-xl border border-line bg-panel p-4">
              <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-muted">
                {l.displayName} text{i > 0 ? ' (optional)' : ''}{draftOf(l.code).title.trim() ? ' ✓' : ''}
              </summary>
              <div className="mt-3">
                <LanguageBlock
                  code={l.code} name={l.displayName} draft={draftOf(l.code)} onPatch={(p) => patch(l.code, p)}
                  onEditor={(ed) => { editors.current[l.code] = ed; }} onPickImage={() => setPicking(l.code)}
                  textOf={() => textOf(l.code)} siblingSlug={() => siblingSlug(l.code)}
                  sourceFor={() => sourceFor(l.code)} onTags={addTags} onDirty={() => setDirty(true)}
                />
              </div>
            </details>
          ))}
        </div>

        <div className="space-y-4">
          <Panel title="Create">
            {error ? <div className="mb-3"><Notice kind="error" message={error.message} issues={error.issues} /></div> : null}
            {createdId ? <Link href={`/news/${createdId}`} className="mb-3 block text-sm underline">Open the news item to finish it there</Link> : null}
            <div className="flex items-center gap-2">
              <button type="submit" disabled={pending || createdId !== null} className={buttonClass('primary')}>{pending ? 'Creating…' : 'Create news item'}</button>
              <Link href="/" className={buttonClass()}>Cancel</Link>
            </div>
            <p className="mt-2 text-xs text-muted">It starts as a draft. A language with no headline is left out.</p>
          </Panel>
          <Panel title="Details">
            <div className="space-y-3">
              <Field label="Desk">
                <select value={deskId} onChange={(e) => { setDeskId(e.target.value); setDirty(true); }} className={inputClass}>
                  <option value="">None</option>
                  {desks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <SectionPicker
                options={categories.map((c) => ({ id: c.id, name: categoryName(c), parentId: c.parentId }))}
                value={sections} onChange={(next) => { setSections(next); setDirty(true); }} />
              <TagChooser tags={tags} onAdd={addTags} onRemove={(id) => setTags((cur) => cur.filter((t) => t.id !== id))} />
            </div>
          </Panel>
        </div>
      </form>
      {/* Outside the form on purpose: the picker has its own buttons and fields, and Enter in them must not create the news item. */}
      <MediaPicker open={picking !== null} onClose={() => setPicking(null)}
        onChoose={({ mediaAssetId, alt }) => {
          if (picking) editors.current[picking]?.chain().focus().insertContent({ type: 'image', attrs: { mediaAssetId, alt } }).run();
          setPicking(null);
        }} />
    </>
  );
}

/** One language: headline, standfirst, slug, text, search text, and the Gemini helpers. */
function LanguageBlock({ code, name, draft, onPatch, onEditor, onPickImage, textOf, siblingSlug, sourceFor, onTags, onDirty }: {
  code: string; name: string; draft: Draft; onPatch: (p: Partial<Draft>) => void; onEditor: (e: Editor | null) => void; onPickImage: () => void;
  textOf: () => string; siblingSlug: () => string | undefined;
  sourceFor: () => { locale: string; localeName: string; title: string; dek: string; seoTitle: string; seoDescription: string; body: unknown } | null;
  onTags: (t: Tag[]) => void; onDirty: () => void;
}) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [note, setNote] = useState<Note>(null);
  const [working, startWork] = useTransition();
  const seo = useRef<HTMLDetailsElement>(null);
  const onEditorRef = useCallback((e: Editor | null) => { setEditor(e); onEditor(e); }, [onEditor]);
  const filled = () => [draft.title, draft.dek, draft.slug, draft.seoTitle, draft.seoDescription].some((v) => v.trim());

  function generate() {
    setNote(null);
    const text = textOf();
    if (text.length < 40) return setNote({ kind: 'error', text: 'Write the text first: at least 40 characters.' });
    if (filled() && !window.confirm('Replace the headline, standfirst, slug and search text with the suggestions?')) return;
    startWork(async () => {
      const res = await bff<AiSuggestion>('POST', 'ai/news-suggest', { locale: code, text });
      if (!res.ok) return setNote({ kind: 'error', text: res.message });
      const v = res.data;
      onPatch({ title: v.title, dek: v.dek, slug: siblingSlug() || v.slug, seoTitle: v.seoTitle, seoDescription: v.seoDescription });
      onTags(v.tags.map((t) => ({ id: t.id, name: t.name })));
      if (seo.current) seo.current.open = true;
      setNote({ kind: 'ok', text: 'Filled in. Check it, then create.' });
    });
  }

  function translate() {
    setNote(null);
    const source = sourceFor();
    if (!source) return setNote({ kind: 'error', text: 'Write a headline and text in another language first: there is nothing to translate yet.' });
    if ((filled() || textOf()) && !window.confirm(`Replace this ${name} text with a translation of the ${source.localeName} text?`)) return;
    startWork(async () => {
      const res = await bff<AiTranslation>('POST', 'ai/news-translate', {
        fromLocale: source.locale, toLocale: code, title: source.title, dek: source.dek, seoTitle: source.seoTitle, seoDescription: source.seoDescription,
        segments: collectTexts(source.body),
      });
      if (!res.ok) return setNote({ kind: 'error', text: res.message });
      let body;
      try {
        body = replaceTexts(source.body, res.data.segments);
      } catch {
        return setNote({ kind: 'error', text: 'The translation did not fit the text. Try again.' });
      }
      onPatch({ title: res.data.title, dek: res.data.dek, slug: draft.slug.trim() || siblingSlug() || '', seoTitle: res.data.seoTitle, seoDescription: res.data.seoDescription });
      editor?.commands.setContent(body as Parameters<Editor['commands']['setContent']>[0]);
      if (seo.current) seo.current.open = true;
      setNote({ kind: 'ok', text: `Translated from ${source.localeName}. Check it, then create.` });
    });
  }

  return (
    <div className="space-y-3" lang={code}>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={generate} disabled={working || !editor} className={buttonClass('primary')}>{working ? 'Working…' : '✨ Generate with Gemini'}</button>
        <button type="button" onClick={translate} disabled={working || !editor} className={buttonClass('primary')}>🌐 Translate with Gemini</button>
      </div>
      {note ? <Notice kind={note.kind} message={note.text} /> : null}
      <Field label="Headline"><input value={draft.title} onChange={(e) => onPatch({ title: e.target.value })} maxLength={300} className={inputClass} /></Field>
      <Field label="Standfirst"><textarea value={draft.dek} onChange={(e) => onPatch({ dek: e.target.value })} maxLength={600} rows={2} className={inputClass} /></Field>
      <Field label="Slug" hint="Optional. Made from the headline when left empty. Each language has its own, and they may be the same.">
        <input value={draft.slug} onChange={(e) => onPatch({ slug: e.target.value })} className={inputClass} />
      </Field>
      <div>
        <span className="mb-1 block text-sm font-medium">Text</span>
        <RichTextEditor initialContent={emptyDoc} lang={code} label={`News text (${name})`} onEditor={onEditorRef} onChange={onDirty} onPickImage={onPickImage} />
      </div>
      <details ref={seo} className="text-sm">
        <summary className="cursor-pointer text-muted">Search and sharing text</summary>
        <div className="mt-2 space-y-3">
          <Field label="SEO title"><input value={draft.seoTitle} onChange={(e) => onPatch({ seoTitle: e.target.value })} maxLength={120} className={inputClass} /></Field>
          <Field label="SEO description"><textarea value={draft.seoDescription} onChange={(e) => onPatch({ seoDescription: e.target.value })} maxLength={320} rows={2} className={inputClass} /></Field>
        </div>
      </details>
    </div>
  );
}

/** Tags before the news item exists: the chosen ones as chips, and a search of the active tags. */
function TagChooser({ tags, onAdd, onRemove }: { tags: Tag[]; onAdd: (t: Tag[]) => void; onRemove: (id: string) => void }) {
  const [found, setFound] = useState<Tag[]>([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function search() {
    setSearching(true);
    setProblem(null);
    const res = await bff<{ items: TaxonomyTag[] }>('GET', `reference/tags?limit=10&query=${encodeURIComponent(query.trim())}`);
    setSearching(false);
    if (!res.ok) return setProblem(res.message);
    setFound(res.data.items.filter((t) => !tags.some((c) => c.id === t.id)).map((t) => ({ id: t.id, name: tagName(t) })));
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Tags</p>
      <ul className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <li key={t.id} className="flex items-center gap-1 rounded bg-line/60 px-2 py-0.5 text-sm">
            {t.name}
            <button type="button" aria-label={`Remove tag ${t.name}`} onClick={() => onRemove(t.id)} className="text-danger">×</button>
          </li>
        ))}
        {tags.length === 0 ? <li className="text-sm text-muted">No tags yet. Generate with Gemini suggests some, or find one.</li> : null}
      </ul>
      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Find a tag" placeholder="Find a tag in any language" maxLength={100} className={inputClass}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void search(); } }} />
        <button type="button" disabled={searching} onClick={() => void search()} className={buttonClass()}>Find</button>
      </div>
      {problem ? <Notice kind="error" message={problem} /> : null}
      {found.length > 0 ? (
        <ul className="flex flex-wrap gap-1" aria-label="Matching tags">
          {found.map((t) => <li key={t.id}><button type="button" onClick={() => { onAdd([t]); setFound(found.filter((f) => f.id !== t.id)); }} className={buttonClass()}>+ {t.name}</button></li>)}
        </ul>
      ) : null}
    </div>
  );
}
