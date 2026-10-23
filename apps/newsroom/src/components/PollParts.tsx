'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Locale, Poll } from '@fact-lens/contracts';
import { announce } from '@/lib/announce';
import { bff } from '@/lib/client';
import { fromDhakaInput, percents, toDhakaInput } from '@/lib/polls';
import { Badge, buttonClass, Field, inputClass, Notice } from './ui';

type Failure = { message: string; issues: string[] } | null;
type Tone = 'neutral' | 'info' | 'warn' | 'good' | 'bad';

const pollStatusTone: Record<Poll['status'], Tone> = { draft: 'neutral', open: 'good', closed: 'warn', archived: 'neutral' };

/**
 * Writes a poll: the question and the options in each language, and when it opens and closes. Every language
 * that has a question needs a label for every option; a language left empty is left out of that language's site.
 */
export function PollForm({ locales, poll }: { locales: Locale[]; poll?: Poll }) {
  const router = useRouter();
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();
  const [count, setCount] = useState(poll?.options.length ?? 3);
  const editable = poll ? poll.editable : true;

  function submit(form: FormData) {
    setError(null);
    const questions: Record<string, string> = {};
    const options: Array<Record<string, string>> = Array.from({ length: count }, () => ({}));
    for (const l of locales) {
      const q = String(form.get(`q-${l.code}`) ?? '').trim();
      if (q) questions[l.code] = q;
      for (let i = 0; i < count; i++) {
        const label = String(form.get(`o-${l.code}-${i}`) ?? '').trim();
        if (label) options[i]![l.code] = label;
      }
    }
    start(async () => {
      const body = { questions, options, opensAt: fromDhakaInput(String(form.get('opensAt') ?? '')), closesAt: fromDhakaInput(String(form.get('closesAt') ?? '')) };
      const res = poll ? await bff<Poll>('PUT', `polls/${poll.id}`, body) : await bff<Poll>('POST', 'polls', body);
      if (!res.ok) return setError({ message: res.message, issues: res.issues });
      announce('Saved');
      if (poll) router.refresh();
      else router.push(`/polls/${res.data.id}`);
    });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(new FormData(e.currentTarget)); }} className="space-y-4">
      {!editable ? <Notice kind="ok" message="This poll has votes or has closed, so its wording can no longer change." /> : null}
      <fieldset disabled={!editable || pending} className="space-y-4">
        {locales.map((l, li) => (
          <div key={l.code} className="space-y-3 rounded-xl border border-line bg-panel p-4" lang={l.code}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{l.displayName}{li > 0 ? ' (optional)' : ''}</h3>
            <Field label="Question"><input name={`q-${l.code}`} defaultValue={poll?.questions[l.code] ?? ''} maxLength={300} className={inputClass} /></Field>
            {Array.from({ length: count }, (_, i) => (
              <Field key={i} label={`Option ${i + 1}`}>
                <input name={`o-${l.code}-${i}`} defaultValue={poll?.options[i]?.labels[l.code] ?? ''} maxLength={120} className={inputClass} />
              </Field>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={count >= 4} onClick={() => setCount(count + 1)} className={buttonClass()}>Add an option</button>
          <button type="button" disabled={count <= 2} onClick={() => setCount(count - 1)} className={buttonClass()}>Remove the last option</button>
          <span className="text-xs text-muted">Two to four options.</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Opens (Dhaka time)" hint="Optional. Empty: open as soon as it is opened here.">
            <input type="datetime-local" name="opensAt" defaultValue={toDhakaInput(poll?.opensAt)} className={inputClass} />
          </Field>
          <Field label="Closes (Dhaka time)" hint="Optional. Empty: stays open until you close it.">
            <input type="datetime-local" name="closesAt" defaultValue={toDhakaInput(poll?.closesAt)} className={inputClass} />
          </Field>
        </div>
      </fieldset>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
      {editable ? <button type="submit" disabled={pending} className={buttonClass('primary')}>{pending ? 'Saving…' : poll ? 'Save changes' : 'Create poll'}</button> : null}
    </form>
  );
}

/** Open, close, archive, feature and delete. What shows depends on the poll's state and on what the person may do. */
export function PollActions({ poll, canEdit, canPublish }: { poll: Poll; canEdit: boolean; canPublish: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();
  const run = (method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown, after?: () => void) => {
    setError(null);
    start(async () => {
      const res = await bff(method, path, body);
      if (!res.ok) return setError({ message: res.reason === 'mfa_required' ? 'This step needs a sign-in with a second factor.' : res.message, issues: res.issues });
      announce('Saved');
      if (after) after();
      else router.refresh();
    });
  };
  const s = poll.status;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {canPublish && s === 'draft' ? <button type="button" disabled={pending} onClick={() => run('POST', `polls/${poll.id}/open`)} className={buttonClass('primary')}>Open for voting</button> : null}
        {canPublish && s === 'open' ? (
          <button type="button" disabled={pending} className={buttonClass()}
            onClick={() => { if (window.confirm('Close this poll? Voting stops at once. The results stay visible.')) run('POST', `polls/${poll.id}/close`); }}>Close voting</button>
        ) : null}
        {canPublish && (s === 'open' || s === 'closed') ? (
          <button type="button" disabled={pending} onClick={() => run('PUT', `polls/${poll.id}/feature`, { featured: !poll.featured })} className={buttonClass()}>
            {poll.featured ? 'Remove from the homepage' : 'Show on the homepage'}
          </button>
        ) : null}
        {canPublish && (s === 'draft' || s === 'closed') ? <button type="button" disabled={pending} onClick={() => run('POST', `polls/${poll.id}/archive`)} className={buttonClass()}>Archive</button> : null}
        {canEdit && s === 'draft' ? (
          <button type="button" disabled={pending} className={buttonClass('danger')}
            onClick={() => { if (window.confirm('Delete this draft poll?')) run('DELETE', `polls/${poll.id}`, undefined, () => { router.push('/polls'); router.refresh(); }); }}>Delete</button>
        ) : null}
        <Link href="/polls" className={buttonClass()}>Back to polls</Link>
      </div>
      {!canPublish && s === 'draft' ? <p className="text-xs text-muted">A managing editor opens a poll for voting.</p> : null}
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </div>
  );
}

/** What the readers have chosen so far. */
export function PollResults({ poll }: { poll: Poll }) {
  const pct = percents(poll.options.map((o) => o.votes));
  return (
    <div className="space-y-2" role="group" aria-label="Results">
      <p className="text-sm text-muted">{poll.totalVotes.toLocaleString('en')} {poll.totalVotes === 1 ? 'vote' : 'votes'}</p>
      {poll.options.map((o, i) => (
        <div key={o.id}>
          <div className="flex justify-between gap-2 text-sm"><span>{o.labels.en ?? Object.values(o.labels)[0]}</span><span className="tabular-nums">{o.votes} · {pct[i]}%</span></div>
          <div className="h-2 rounded bg-line"><div className="h-2 rounded bg-accent" style={{ width: `${pct[i]}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export function PollBadges({ poll }: { poll: Poll }) {
  return (
    <>
      <Badge tone={pollStatusTone[poll.status]}>{poll.status[0]!.toUpperCase() + poll.status.slice(1)}</Badge>
      {poll.featured ? <Badge tone="info">On the homepage</Badge> : null}
    </>
  );
}
