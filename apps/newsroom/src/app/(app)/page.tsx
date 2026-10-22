import Link from 'next/link';
import { z } from 'zod';
import {
  assignmentWithNewsSchema, categorySchema, newsCountsSchema, newsListSchema, newsStatuses, type NewsStatus,
} from '@fact-lens/contracts';
import { Empty, Panel, StatusBadge } from '@/components/ui';
import { api, getPrincipal } from '@/lib/current';
import { formatDateTime, pickTitle, relativeTime, statusLabel } from '@/lib/format';
import { can } from '@/lib/nav';

export const metadata = { title: 'Desk queue' };

const tabStatuses = newsStatuses.filter((s) => s !== 'INGESTED' && s !== 'RESEARCHING');
const dueFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' });

function Kpi({ label, value, note, alert = false }: { label: string; value: number; note: string; alert?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="text-sm text-muted">{label}</div>
      <div className={`mt-1 text-3xl font-semibold tabular-nums ${alert && value > 0 ? 'text-danger' : ''}`}>{value}</div>
      <div className="mt-0.5 text-xs text-muted">{note}</div>
    </div>
  );
}

export default async function DeskQueue({ searchParams }: { searchParams: Promise<{ status?: string; cursor?: string }> }) {
  const { status, cursor } = await searchParams;
  const filter = (newsStatuses as readonly string[]).includes(status ?? '') ? (status as NewsStatus) : undefined;
  const query = new URLSearchParams({ limit: '25', ...(filter ? { status: filter } : {}), ...(cursor ? { cursor } : {}) });
  const principal = await getPrincipal();

  const [list, mine, counts, categories] = await Promise.all([
    api(`/news?${query}`, newsListSchema, { returnTo: '/' }),
    api('/assignments/mine?status=open', z.array(assignmentWithNewsSchema), { returnTo: '/' }),
    api('/news/counts', newsCountsSchema, { returnTo: '/' }),
    api('/reference/categories', z.array(categorySchema), { returnTo: '/' }),
  ]);
  const section = new Map(categories.map((c) => [c.id, c.labels.find((l) => l.locale === 'en')?.name ?? c.key]));
  const total = Object.values(counts.byStatus).reduce((t, n) => t + n, 0);
  const stages = tabStatuses.filter((s) => ['DRAFT', 'EDITOR_REVIEW', 'FACT_CHECK', 'READY', 'SCHEDULED'].includes(s) && (counts.byStatus[s] ?? 0) > 0).length;

  const tab = (value: NewsStatus | undefined, label: string, n: number) => {
    const active = value === filter;
    return (
      <Link key={label} href={value ? `/?status=${value}` : '/'} aria-current={active ? 'true' : undefined}
        className={`-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${active ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-fg'}`}>
        {label}
        <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? 'bg-accent/10' : 'bg-line/70'}`}>{n}</span>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Desk queue</h1>
          <p className="mt-1 text-muted">Every news item in the pipeline, by stage.</p>
        </div>
        {can(principal, 'news.edit') ? <Link href="/news/new" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg">+ New news item</Link> : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="In progress" value={counts.inProgress} note={`across ${stages} ${stages === 1 ? 'stage' : 'stages'}`} />
        <Kpi label="Due today" value={counts.dueToday} note="scheduled to publish, Dhaka time" />
        <Kpi label="Stuck over 24h" value={counts.stuck} note="in review or ready, unchanged" alert />
        <Kpi label="Published this week" value={counts.publishedThisWeek} note="in the last 7 days" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section aria-labelledby="news-h" className="min-w-0 rounded-xl border border-line bg-panel shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h2 id="news-h" className="sr-only">News items</h2>
          <div role="group" aria-label="Filter by stage" className="flex overflow-x-auto border-b border-line px-2">
            {tab(undefined, 'All', total)}
            {tabStatuses.map((s) => tab(s, statusLabel(s), counts.byStatus[s] ?? 0))}
          </div>
          {list.items.length === 0 ? (
            <div className="p-6"><Empty>No news {filter ? `in ${statusLabel(filter).toLowerCase()}` : 'yet'}.</Empty></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left">
                <thead className="bg-bg text-xs font-medium uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">News</th>
                    <th scope="col" className="px-4 py-2.5">Stage</th>
                    <th scope="col" className="px-4 py-2.5">Scheduled</th>
                    <th scope="col" className="px-4 py-2.5">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {list.items.map((n) => {
                    const title = pickTitle(n.titles);
                    return (
                      <tr key={n.id} className="relative hover:bg-line/30">
                        <td className="px-4 py-3">
                          <Link href={`/news/${n.id}`} lang={title?.locale} className="font-semibold after:absolute after:inset-0 hover:underline focus-visible:outline-2">{title?.text ?? 'Untitled'}</Link>
                          <div className="text-xs text-muted">{(n.categoryId && section.get(n.categoryId)) || 'No section'} · {Object.keys(n.titles).sort().join(', ') || 'no text yet'}</div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">{n.scheduledFor ? dueFormat.format(new Date(n.scheduledFor)) : '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">{relativeTime(n.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted">
            <span>Showing {list.items.length} {list.items.length === 1 ? 'news item' : 'news items'}</span>
            {list.nextCursor ? (
              <Link className="rounded-lg border border-line bg-panel px-3 py-1.5 font-medium text-fg" href={`/?${new URLSearchParams({ ...(filter ? { status: filter } : {}), cursor: list.nextCursor })}`}>Older</Link>
            ) : null}
          </div>
        </section>

        <aside>
          <Panel title="My assignments" id="mine-h">
            {mine.length === 0 ? <Empty>Nothing assigned to you.</Empty> : (
              <ul className="space-y-3 text-sm">
                {mine.map((a) => {
                  const title = pickTitle(a.newsTitles);
                  return (
                    <li key={a.id}>
                      <Link href={`/news/${a.newsId}`} lang={title?.locale} className="font-medium underline-offset-2 hover:underline">{title?.text ?? 'Untitled'}</Link>
                      <div className="text-muted">{a.role.replace('_', ' ')} · {a.dueAt ? `due ${formatDateTime(a.dueAt)}` : 'no due date'}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
