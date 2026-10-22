import Link from 'next/link';
import { z } from 'zod';
import { feedSchema, inboxListSchema, inboxStatuses } from '@fact-lens/contracts';
import { FeedManager, InboxRow } from '@/components/InboxParts';
import { AccessProblem, Empty, Panel } from '@/components/ui';
import { ApiError, api, getPrincipal, isMfaRequired } from '@/lib/current';
import { can } from '@/lib/nav';

export const metadata = { title: 'Source inbox' };

const tabs = [
  { status: 'new', label: 'New' },
  { status: 'used', label: 'Used' },
  { status: 'rejected', label: 'Put aside' },
  { status: 'duplicate', label: 'Duplicates' },
] as const;

export default async function SourceInbox({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: asked } = await searchParams;
  const status = inboxStatuses.find((s) => s === asked) ?? 'new';
  const principal = await getPrincipal();
  let data;
  try {
    data = await Promise.all([
      api(`/inbox?status=${status}&limit=50`, inboxListSchema, { returnTo: '/inbox' }),
      api('/feeds', z.array(feedSchema), { returnTo: '/inbox' }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <AccessProblem mfaRequired={isMfaRequired(err)} />;
    throw err;
  }
  const [inbox, feeds] = data;
  const canEdit = can(principal, 'news.edit');
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Source inbox</h1>
        <p className="mt-1 text-sm text-muted">What the approved RSS feeds brought in. Make a news item from one, or put it aside. Each item is stored once, and the same address from another feed is listed as a duplicate.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          <nav aria-label="Inbox status" className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <Link key={t.status} href={`/inbox?status=${t.status}`} aria-current={t.status === status ? 'page' : undefined}
                className={`rounded-lg border px-3 py-1.5 text-sm ${t.status === status ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-panel'}`}>
                {t.label} <span className="tabular-nums opacity-80">{inbox.counts[t.status]}</span>
              </Link>
            ))}
          </nav>
          {inbox.items.length === 0 ? (
            <Empty>{feeds.length === 0 ? 'No feeds are set up yet.' : status === 'new' ? 'Nothing new. Feeds are checked in the background.' : 'Nothing here.'}</Empty>
          ) : (
            <ul className="space-y-2">{inbox.items.map((i) => <InboxRow key={i.id} item={i} canEdit={canEdit} />)}</ul>
          )}
          {inbox.counts[status] > inbox.items.length ? <p className="text-sm text-muted">Showing the latest {inbox.items.length}.</p> : null}
        </div>
        <Panel title="Feeds" id="feeds-h">
          <FeedManager feeds={feeds} canManage={can(principal, 'config.manage')} />
        </Panel>
      </div>
    </div>
  );
}
