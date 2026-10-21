import Link from 'next/link';
import { z } from 'zod';
import { assignmentWithStorySchema, storyListSchema, storyStatuses, type StoryStatus } from '@fact-lens/contracts';
import { Empty, Panel, StatusBadge } from '@/components/ui';
import { api, getPrincipal } from '@/lib/current';
import { formatDateTime, pickTitle, relativeTime, statusLabel } from '@/lib/format';
import { can } from '@/lib/nav';

export const metadata = { title: 'Desk queue' };

export default async function DeskQueue({ searchParams }: { searchParams: Promise<{ status?: string; cursor?: string }> }) {
  const { status, cursor } = await searchParams;
  const filter = (storyStatuses as readonly string[]).includes(status ?? '') ? (status as StoryStatus) : undefined;
  const query = new URLSearchParams({ limit: '25', ...(filter ? { status: filter } : {}), ...(cursor ? { cursor } : {}) });
  const principal = await getPrincipal();

  const [list, mine] = await Promise.all([
    api(`/stories?${query}`, storyListSchema, { returnTo: '/' }),
    api('/assignments/mine?status=open', z.array(assignmentWithStorySchema), { returnTo: '/' }),
  ]);
  const chip = (value: string | undefined, label: string) => {
    const active = value === filter;
    return (
      <Link key={label} href={value ? `/?status=${value}` : '/'} aria-current={active ? 'true' : undefined}
        className={`rounded-full border px-3 py-1 text-sm ${active ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-panel'}`}>{label}</Link>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section aria-labelledby="stories-h">
        <div className="mb-3 flex items-center justify-between">
          <h1 id="stories-h" className="text-xl font-semibold">Desk queue</h1>
          {can(principal, 'story.edit') ? <Link href="/stories/new" className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg">New story</Link> : null}
        </div>
        <div className="mb-3 flex flex-wrap gap-2" aria-label="Filter by status">
          {chip(undefined, 'All')}
          {storyStatuses.filter((s) => s !== 'INGESTED' && s !== 'RESEARCHING').map((s) => chip(s, statusLabel(s)))}
        </div>
        {list.items.length === 0 ? (
          <Empty>No stories {filter ? `in ${statusLabel(filter).toLowerCase()}` : 'yet'}.</Empty>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-panel">
            {list.items.map((s) => {
              const title = pickTitle(s.titles);
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/stories/${s.id}`} lang={title?.locale} className="font-medium underline-offset-2 hover:underline">{title?.text ?? 'Untitled'}</Link>
                    <div className="text-xs text-muted">Updated {relativeTime(s.updatedAt)}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </li>
              );
            })}
          </ul>
        )}
        {list.nextCursor ? (
          <Link className="mt-3 inline-block text-sm underline" href={`/?${new URLSearchParams({ ...(filter ? { status: filter } : {}), cursor: list.nextCursor })}`}>Older stories</Link>
        ) : null}
      </section>

      <aside>
        <Panel title="My assignments" id="mine-h">
          {mine.length === 0 ? <Empty>Nothing assigned to you.</Empty> : (
            <ul className="space-y-3 text-sm">
              {mine.map((a) => {
                const title = pickTitle(a.storyTitles);
                return (
                  <li key={a.id}>
                    <Link href={`/stories/${a.storyId}`} lang={title?.locale} className="font-medium underline-offset-2 hover:underline">{title?.text ?? 'Untitled'}</Link>
                    <div className="text-muted">{a.role.replace('_', ' ')} · {a.dueAt ? `due ${formatDateTime(a.dueAt)}` : 'no due date'}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </aside>
    </div>
  );
}
