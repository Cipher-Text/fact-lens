'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Feed, InboxItem } from '@fact-lens/contracts';
import { announce } from '@/lib/announce';
import { bff } from '@/lib/client';
import { formatDateTime, relativeTime } from '@/lib/format';
import { submitWith } from '@/lib/form';
import { Badge, buttonClass, Field, inputClass, Notice } from './ui';

type Failure = { message: string; issues: string[] } | null;

function useCommand() {
  const router = useRouter();
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();
  const run = (method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown, after?: () => void) => {
    setError(null);
    start(async () => {
      const res = await bff(method, path, body);
      if (!res.ok) return setError({ message: res.reason === 'mfa_required' ? 'This step needs a sign-in with a second factor.' : res.message, issues: res.issues });
      after?.();
      announce('Saved');
      router.refresh();
    });
  };
  return { error, pending, run };
}

const hostOf = (url: string | null) => {
  try {
    return url ? new URL(url).host : null;
  } catch {
    return null;
  }
};

/** One item in the inbox: the headline links to the original, and an editor can make a news item from it or put it aside. */
export function InboxRow({ item, canEdit }: { item: InboxItem; canEdit: boolean }) {
  const { error, pending, run } = useCommand();
  const host = hostOf(item.url);
  return (
    <li className="rounded-lg border border-line bg-panel p-3">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium underline-offset-2 hover:underline">{item.title}</a>
          ) : (
            <span className="font-medium">{item.title}</span>
          )}
          <p className="mt-0.5 text-xs text-muted">
            {item.feedName}{host ? ` · ${host}` : ''} · {item.publishedAt ? relativeTime(item.publishedAt) : `fetched ${relativeTime(item.retrievedAt)}`}
          </p>
          {item.summary ? <p className="mt-1 text-sm text-muted">{item.summary}</p> : null}
        </div>
        {item.status === 'duplicate' ? <Badge tone="warn">Duplicate</Badge> : null}
        {item.status === 'rejected' ? <Badge>Put aside</Badge> : null}
        {item.status === 'used' ? <Badge tone="good">Used</Badge> : null}
      </div>
      {canEdit ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {item.status === 'new' || item.status === 'duplicate' ? (
            <>
              <Link href={`/news/new?fromInbox=${item.id}`} className={buttonClass('primary')}>Create news item</Link>
              <button type="button" disabled={pending} onClick={() => run('PUT', `inbox/${item.id}`, { status: 'rejected' })} className={buttonClass()}>Put aside</button>
            </>
          ) : null}
          {item.status === 'rejected' ? (
            <button type="button" disabled={pending} onClick={() => run('PUT', `inbox/${item.id}`, { status: 'new' })} className={buttonClass()}>Bring back</button>
          ) : null}
          {item.status === 'used' && item.newsId ? <Link href={`/news/${item.newsId}`} className={buttonClass()}>Open the news item</Link> : null}
        </div>
      ) : null}
      {error ? <div className="mt-2"><Notice kind="error" message={error.message} issues={error.issues} /></div> : null}
    </li>
  );
}

const statusBadge = (f: Feed) =>
  f.lastStatus === 'error' ? <Badge tone="bad">Failed</Badge>
    : f.lastStatus === 'ok' || f.lastStatus === 'not_modified' ? <Badge tone="good">Working</Badge>
    : <Badge>Not fetched yet</Badge>;

/** The approved feeds and how they are doing. Administrators add, pause and remove them. */
export function FeedManager({ feeds, canManage }: { feeds: Feed[]; canManage: boolean }) {
  const { error, pending, run } = useCommand();
  return (
    <div className="space-y-3">
      {feeds.length === 0 ? <p className="text-sm text-muted">No feeds yet.{canManage ? ' Add one below.' : ' An administrator adds them.'}</p> : (
        <ul className="space-y-2">
          {feeds.map((f) => (
            <li key={f.id} className="rounded-lg border border-line p-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{f.name}</strong>
                {statusBadge(f)}
                {!f.active ? <Badge>Paused</Badge> : null}
                {f.newCount > 0 ? <Badge tone="info">{`${f.newCount} new`}</Badge> : null}
              </div>
              <p className="mt-0.5 break-all text-xs text-muted">{f.url}</p>
              <p className="text-xs text-muted">
                Every {f.pollMinutes} min · {f.lastFetchedAt ? `last fetched ${formatDateTime(f.lastFetchedAt)}` : 'not fetched yet'}
              </p>
              {f.lastStatus === 'error' && f.lastError ? <p role="alert" className="mt-1 text-xs text-danger">{f.lastError}</p> : null}
              {canManage ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" disabled={pending} onClick={() => run('PUT', `feeds/${f.id}`, { active: !f.active })} className={buttonClass()}>{f.active ? 'Pause' : 'Resume'}</button>
                  <button type="button" disabled={pending} className={buttonClass('danger')}
                    onClick={() => { if (window.confirm(`Remove ${f.name} and everything it brought in?`)) run('DELETE', `feeds/${f.id}`); }}>Remove</button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {canManage ? (
        <details>
          <summary className="cursor-pointer text-sm font-medium">Add a feed</summary>
          <form className="mt-3 space-y-3" onSubmit={submitWith((form, el) => run('POST', 'feeds', {
            name: String(form.get('name') ?? '').trim(), url: String(form.get('url') ?? '').trim(), pollMinutes: Number(form.get('pollMinutes')) || 15,
          }, () => el.reset()))}>
            <Field label="Name"><input name="name" required maxLength={120} className={inputClass} /></Field>
            <Field label="Feed address" hint="The RSS or Atom address. Only feeds added here are ever fetched.">
              <input name="url" type="url" required placeholder="https://example.com/rss.xml" className={inputClass} />
            </Field>
            <Field label="Check every (minutes)"><input name="pollMinutes" type="number" min={5} max={1440} defaultValue={15} className={inputClass} /></Field>
            <button type="submit" disabled={pending} className={buttonClass('primary')}>Add feed</button>
          </form>
        </details>
      ) : null}
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </div>
  );
}
