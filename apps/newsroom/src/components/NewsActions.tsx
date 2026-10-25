'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { AvailableTransition } from '@fact-lens/contracts';
import { statusLabel } from '@/lib/format';
import { announce } from '@/lib/announce';
import { bff } from '@/lib/client';
import { submitWith } from '@/lib/form';
import { SectionPicker, type SectionOption, type Sections } from './SectionPicker';
import { buttonClass, Empty, Field, inputClass, Notice } from './ui';

type Failure = { message: string; issues: string[] } | null;

function useCommand() {
  const router = useRouter();
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();
  const run = (method: 'POST' | 'PUT' | 'DELETE', path: string, body: unknown, after?: () => void) => {
    setError(null);
    start(async () => {
      const res = await bff(method, path, body);
      if (!res.ok) return setError({ message: res.reason === 'mfa_required' ? 'This step needs a sign-in with a second factor. Sign out and sign in again with MFA.' : res.message, issues: res.issues });
      after?.();
      announce('Saved');
      router.refresh();
    });
  };
  return { error, pending, run };
}

/** Datetime-local has no zone; the desk works in Dhaka time (UTC+6, no daylight saving). */
const dhakaToIso = (local: string) => new Date(`${local}:00+06:00`).toISOString();

export function TransitionPanel({ newsId, transitions }: { newsId: string; transitions: AvailableTransition[] }) {
  const { error, pending, run } = useCommand();
  if (transitions.length === 0) return <Empty>No further steps from here.</Empty>;
  const open = transitions.filter((t) => t.permitted);
  const closed = transitions.filter((t) => !t.permitted);
  return (
    <div className="space-y-3">
      {open.length === 0 ? <Empty>You cannot move this news item from its current state.</Empty> : null}
      {open.map((t, i) => {
        const needsInput = t.reasonRequired || t.needsSchedule;
        const form = (
          <form key={t.to} className="space-y-2"
            onSubmit={submitWith((form) => run('POST', `news/${newsId}/transitions`, {
              to: t.to,
              ...(t.reasonRequired ? { reason: form.get('reason') } : {}),
              ...(t.needsSchedule ? { schedule: { scheduledFor: dhakaToIso(form.get('when') as string), timeZone: 'Asia/Dhaka' } } : {}),
            }))}>
            {t.reasonRequired ? <Field label={t.to === 'ARCHIVED' ? 'Why archive this news item?' : t.to === 'DRAFT' ? 'What needs to change?' : 'Reason'}><input name="reason" required minLength={3} maxLength={500} className={inputClass} /></Field> : null}
            {t.needsSchedule ? <Field label="Publish at (Dhaka time)"><input type="datetime-local" name="when" required className={inputClass} /></Field> : null}
            <button type="submit" disabled={pending} className={buttonClass(t.to === 'ARCHIVED' ? 'danger' : i === 0 && !needsInput ? 'primary' : 'secondary')}>
              Move to {statusLabel(t.to).toLowerCase()}
            </button>
          </form>
        );
        // Steps that ask for a reason or a time stay folded away until wanted, so the usual next step is the obvious one.
        return needsInput ? (
          <details key={t.to} className="border-t border-line pt-2 first:border-0 first:pt-0">
            <summary className={`cursor-pointer text-sm font-medium ${t.to === 'ARCHIVED' ? 'text-danger' : ''}`}>
              {t.to === 'ARCHIVED' ? 'Archive this news item…' : t.to === 'DRAFT' ? 'Send back for changes…' : `Move to ${statusLabel(t.to).toLowerCase()}…`}
            </summary>
            <div className="mt-2">{form}</div>
          </details>
        ) : form;
      })}
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
      {closed.length > 0 ? (
        <details className="text-sm text-muted">
          <summary className="cursor-pointer">Other steps need a different permission</summary>
          <ul className="mt-1 list-disc pl-5">
            {closed.map((t) => <li key={t.to}>{statusLabel(t.to)}: needs {t.capability}</li>)}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export function ReviseForm({ newsId }: { newsId: string }) {
  const { error, pending, run } = useCommand();
  return (
    <form className="space-y-2" onSubmit={submitWith((form) => run('POST', `news/${newsId}/revisions`, { reason: form.get('reason') }))}>
      <Field label="Why open a new revision?" hint="The published version stays live while you edit."><input name="reason" required minLength={3} maxLength={500} className={inputClass} /></Field>
      <button type="submit" disabled={pending} className={buttonClass()}>Open new revision</button>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </form>
  );
}

export function CorrectionForm({ newsId, locales }: { newsId: string; locales: string[] }) {
  const { error, pending, run } = useCommand();
  return (
    <form className="space-y-2"
      onSubmit={submitWith((form) => run('POST', `news/${newsId}/corrections`, {
        reason: form.get('reason'),
        notices: Object.fromEntries(locales.map((l) => [l, ((form.get(`notice-${l}`) as string) ?? '').trim()]).filter(([, v]) => v)),
      }))}>
      <Field label="What was wrong?"><input name="reason" required minLength={3} maxLength={500} className={inputClass} /></Field>
      {locales.map((l) => (
        <Field key={l} label={`Notice readers will see (${l})`}><textarea name={`notice-${l}`} rows={2} maxLength={1000} lang={l} className={inputClass} /></Field>
      ))}
      <button type="submit" disabled={pending} className={buttonClass('danger')}>Record correction</button>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </form>
  );
}

export function MetaForm({ newsId, desks, categories, deskId, categoryId, categoryIds, contributors, people }: {
  newsId: string;
  desks: Array<{ id: string; name: string }>;
  categories: SectionOption[];
  deskId: string | null;
  categoryId: string | null;
  categoryIds: string[];
  contributors: Array<{ id: string; name: string; role: string }>;
  people: Array<{ id: string; name: string }>;
}) {
  const { error, pending, run } = useCommand();
  const [added, setAdded] = useState(contributors);
  const [sections, setSections] = useState<Sections>({ ids: categoryIds, primary: categoryId });

  return (
    <form className="space-y-3"
      onSubmit={submitWith((form) => run('PUT', `news/${newsId}/meta`, {
        deskId: (form.get('deskId') as string) || null, categoryId: sections.primary, categoryIds: sections.ids,
        contributors: added.map((c, i) => ({ contributorId: c.id, role: c.role, position: i })),
      }))}>
      <Field label="Desk"><select name="deskId" defaultValue={deskId ?? ''} className={inputClass}><option value="">None</option>{desks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
      <SectionPicker options={categories} value={sections} onChange={setSections} />
      <fieldset>
        <legend className="mb-1 text-sm font-medium">Credits</legend>
        <ul className="mb-2 space-y-1 text-sm">
          {added.map((c) => (
            <li key={`${c.id}-${c.role}`} className="flex items-center justify-between gap-2">
              <span>{c.name} <span className="text-muted">({c.role})</span></span>
              <button type="button" className="text-xs text-danger underline" onClick={() => setAdded(added.filter((x) => !(x.id === c.id && x.role === c.role)))}>Remove</button>
            </li>
          ))}
          {added.length === 0 ? <li className="text-muted">Nobody credited yet. A news item needs an author for review.</li> : null}
        </ul>
        <div className="flex gap-2">
          <select aria-label="Person" id="person" className={inputClass} defaultValue="">
            <option value="" disabled>Choose a person</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select aria-label="Role" id="role" className={inputClass} defaultValue="author">
            {['author', 'editor', 'photographer', 'translator'].map((r) => <option key={r}>{r}</option>)}
          </select>
          <button type="button" className={buttonClass()} onClick={() => {
            const person = (document.getElementById('person') as HTMLSelectElement).value;
            const role = (document.getElementById('role') as HTMLSelectElement).value;
            const found = people.find((p) => p.id === person);
            if (found && !added.some((c) => c.id === person && c.role === role)) setAdded([...added, { id: found.id, name: found.name, role }]);
          }}>Add</button>
        </div>
      </fieldset>
      <button type="submit" disabled={pending} className={buttonClass('primary')}>Save details</button>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </form>
  );
}

export function NewPersonForm() {
  const router = useRouter();
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();
  return (
    <form className="flex gap-2" onSubmit={submitWith((form, el) => {
      setError(null);
      start(async () => {
        const res = await bff('POST', 'contributors', { displayName: form.get('name') });
        if (!res.ok) return setError({ message: res.message, issues: res.issues });
        el.reset();
        router.refresh();
      });
    })}>
      <input name="name" required maxLength={200} aria-label="New person's name" placeholder="Add a person to credit" className={inputClass} />
      <button type="submit" disabled={pending} className={buttonClass()}>Add</button>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </form>
  );
}

export function CommentBox({ newsId }: { newsId: string }) {
  const { error, pending, run } = useCommand();
  return (
    <form className="space-y-2" onSubmit={submitWith((form, el) => run('POST', `news/${newsId}/comments`, { body: form.get('body') }, () => el.reset()))}>
      <Field label="Add a comment"><textarea name="body" required rows={2} maxLength={5000} className={inputClass} /></Field>
      <button type="submit" disabled={pending} className={buttonClass()}>Comment</button>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </form>
  );
}

export function ResolveButton({ commentId, resolved }: { commentId: string; resolved: boolean }) {
  const { error, pending, run } = useCommand();
  return (
    <>
      <button type="button" disabled={pending} className="text-xs underline" onClick={() => run('POST', `comments/${commentId}/${resolved ? 'reopen' : 'resolve'}`, undefined)}>
        {resolved ? 'Reopen' : 'Resolve'}
      </button>
      {error ? <span role="alert" className="ml-2 text-xs text-danger">{error.message}</span> : null}
    </>
  );
}

export function FlagToggle({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const { error, pending, run } = useCommand();
  return (
    <form className="mt-2 flex flex-wrap items-end gap-2" onSubmit={submitWith((form, el) => run('PUT', `config/flags/${flagKey}`, { enabled: !enabled, reason: form.get('reason') }, () => el.reset()))}>
      <Field label={`Reason to turn ${enabled ? 'off' : 'on'}`}><input name="reason" required minLength={3} maxLength={500} className={inputClass} /></Field>
      <button type="submit" disabled={pending} className={buttonClass(enabled ? 'danger' : 'primary')}>Turn {enabled ? 'off' : 'on'}</button>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </form>
  );
}
