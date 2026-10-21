'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { bff } from '@/lib/client';
import { submitWith } from '@/lib/form';
import { bodyToPlainText, plainTextToBody } from '@/lib/body';
import { buttonClass, Field, inputClass, Notice } from './ui';

type Failure = { message: string; issues: string[] } | null;

export function NewStoryForm({ locales }: { locales: Array<{ code: string; displayName: string }> }) {
  const router = useRouter();
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();

  function submit(form: FormData) {
    setError(null);
    start(async () => {
      const res = await bff<{ story: { id: string } }>('POST', 'stories', { locale: form.get('locale'), title: form.get('title') });
      if (!res.ok) return setError({ message: res.message, issues: res.issues });
      router.push(`/stories/${res.data.story.id}`);
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

/** Edits plain paragraphs. Rich content stays read-only until the full editor exists. */
export function TranslationEditor({ storyId, translation }: { storyId: string; translation: EditableTranslation }) {
  const router = useRouter();
  const plain = translation.version === null ? '' : bodyToPlainText(translation.body);
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string; issues: string[] } | null>(null);
  const [pending, start] = useTransition();

  function save(form: FormData) {
    setMessage(null);
    start(async () => {
      const text = (form.get('body') as string | null) ?? '';
      const res = await bff('PUT', `stories/${storyId}/translations/${translation.locale}`, {
        title: form.get('title'), dek: (form.get('dek') as string) || null, slug: form.get('slug'),
        seoTitle: (form.get('seoTitle') as string) || null, seoDescription: (form.get('seoDescription') as string) || null,
        body: plain === null ? translation.body : plainTextToBody(text), expectedVersion: translation.version,
      });
      if (!res.ok) {
        const conflict = res.reason === 'version_conflict';
        return setMessage({ kind: 'error', text: conflict ? 'Someone else changed this translation. Reload to see their version before saving.' : res.message, issues: res.issues });
      }
      setMessage({ kind: 'ok', text: 'Saved', issues: [] });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submitWith((form) => save(form))} className="space-y-3" lang={translation.locale}>
      <Field label="Headline"><input name="title" defaultValue={translation.title} required maxLength={300} className={inputClass} /></Field>
      <Field label="Standfirst"><textarea name="dek" defaultValue={translation.dek ?? ''} maxLength={600} rows={2} className={inputClass} /></Field>
      <Field label="Web address" hint="Letters, digits and hyphens. Reserved when the story is published.">
        <input name="slug" defaultValue={translation.slug} required className={inputClass} />
      </Field>
      {plain === null ? (
        <Notice kind="ok" message="This text has formatting, links, lists or images. It cannot be edited here yet, and saving keeps it unchanged." />
      ) : (
        <Field label="Text" hint="Leave a blank line between paragraphs.">
          <textarea name="body" defaultValue={plain} rows={10} className={inputClass} />
        </Field>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted">Search and sharing text</summary>
        <div className="mt-2 space-y-3">
          <Field label="SEO title"><input name="seoTitle" defaultValue={translation.seoTitle ?? ''} maxLength={120} className={inputClass} /></Field>
          <Field label="SEO description"><textarea name="seoDescription" defaultValue={translation.seoDescription ?? ''} maxLength={320} rows={2} className={inputClass} /></Field>
        </div>
      </details>
      {message ? <Notice kind={message.kind} message={message.text} issues={message.issues} /> : null}
      <button type="submit" disabled={pending} className={buttonClass('primary')}>
        {pending ? 'Saving…' : translation.version === null ? `Add ${translation.localeName}` : 'Save'}
      </button>
    </form>
  );
}
