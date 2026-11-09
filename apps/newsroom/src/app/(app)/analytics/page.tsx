import Link from 'next/link';
import { z } from 'zod';
import {
  categorySchema, localeSchema, newsFormats, newsPerformanceListSchema, performanceGroups, performanceQuerySchema, performanceSummaryQuerySchema,
  performanceSummarySchema, taxonomyRegionSchema,
} from '@fact-lens/contracts';
import { SourceBars } from '@/components/PerformanceParts';
import { AccessProblem, Badge, Empty, Panel } from '@/components/ui';
import { ApiError, api, getPrincipal, isMfaRequired } from '@/lib/current';
import { formatDateTime, formatLabel } from '@/lib/format';
import { can } from '@/lib/nav';

export const metadata = { title: 'Analytics' };

type Params = Record<string, string | undefined>;

const inputClass = 'rounded border border-line bg-bg px-2 py-1.5 text-sm';
const groupNames: Record<(typeof performanceGroups)[number], string> = {
  category: 'Section', region: 'Region', format: 'Format', author: 'Author', locale: 'Language',
};

/** Keeps only the filters that have a value, in a query string. */
const queryOf = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(params).filter((e): e is [string, string | number] => e[1] !== undefined && e[1] !== '').map(([k, v]) => [k, String(v)])).toString();

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const raw = await searchParams;
  const principal = await getPrincipal();
  if (!can(principal, 'analytics.read')) return <Empty>You do not have permission to see analytics.</Empty>;

  const parsed = performanceQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return (
      <div className="max-w-4xl space-y-3">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <Empty>{`That filter is not valid: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}. `}<Link href="/analytics" className="underline">Start again</Link></Empty>
      </div>
    );
  }
  const q = parsed.data;
  const by = performanceSummaryQuerySchema.shape.by.safeParse(raw.by).data ?? 'category';
  const here = `/analytics?${queryOf(raw)}`;
  const filterQuery = { from: q.from, to: q.to, locale: q.locale, category: q.category, region: q.region, format: q.format };

  let data;
  try {
    data = await Promise.all([
      api(`/analytics/news?${queryOf({ ...filterQuery, metric: q.metric, order: q.order, minAgeDays: q.minAgeDays, limit: q.limit, offset: q.offset })}`, newsPerformanceListSchema, { returnTo: here }),
      api(`/analytics/summary?${queryOf({ from: q.from, to: q.to, locale: q.locale, by })}`, performanceSummarySchema, { returnTo: here }),
      api('/reference/locales', z.array(localeSchema), { returnTo: here }),
      api('/reference/categories', z.array(categorySchema), { returnTo: here }),
      api('/reference/regions', z.array(taxonomyRegionSchema), { returnTo: here }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <AccessProblem mfaRequired={isMfaRequired(err)} />;
    if (err instanceof ApiError && err.status === 400) {
      return (
        <div className="max-w-4xl space-y-3">
          <h1 className="text-xl font-semibold">Analytics</h1>
          <Empty>{`${err.message} `}<Link href="/analytics" className="underline">Start again</Link></Empty>
        </div>
      );
    }
    throw err;
  }
  const [list, summary, locales, categories, regions] = data;
  const nameOf = (labels: Array<{ locale: string; name: string }>, key: string) => labels.find((l) => l.locale === 'en')?.name ?? labels[0]?.name ?? key;
  const slugOf = (labels: Array<{ locale: string; slug: string }>, key: string) => labels.find((l) => l.locale === 'en')?.slug ?? labels[0]?.slug ?? key;
  const total = list.items.reduce((n, i) => n + i.views, 0);
  const page = (offset: number) => `/analytics?${queryOf({ ...raw, offset: offset || undefined })}`;
  const mostRead = { ...raw, order: undefined, minAgeDays: undefined, offset: undefined };
  const leastRead = { ...raw, order: 'asc', minAgeDays: raw.minAgeDays ?? '14', offset: undefined };

  return (
    <div className="max-w-6xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          How much each news item is read. A view is the first view of a news item, in a language, by a session in 24 hours, counted by the public site and
          added here hourly. Days are Dhaka days. Section, region and author are today&apos;s, not as they were when the news was read.
        </p>
      </header>

      <Panel title="Filters" id="filters-h">
        <form className="flex flex-wrap items-end gap-3" role="search">
          <label className="text-sm">From<br /><input type="date" name="from" defaultValue={list.from} className={inputClass} /></label>
          <label className="text-sm">To<br /><input type="date" name="to" defaultValue={list.to} className={inputClass} /></label>
          <label className="text-sm">Language<br />
            <select name="locale" defaultValue={q.locale ?? ''} className={inputClass}><option value="">All</option>{locales.map((l) => <option key={l.code} value={l.code}>{l.displayName}</option>)}</select>
          </label>
          <label className="text-sm">Section<br />
            <select name="category" defaultValue={q.category ?? ''} className={inputClass}><option value="">All</option>{categories.map((c) => { const slug = slugOf(c.labels, c.key); return <option key={c.id} value={slug}>{nameOf(c.labels, c.key)}</option>; })}</select>
          </label>
          <label className="text-sm">Region<br />
            <select name="region" defaultValue={q.region ?? ''} className={inputClass}><option value="">All</option>{regions.map((r) => { const slug = slugOf(r.labels, r.key); return <option key={r.id} value={slug}>{nameOf(r.labels, r.key)}</option>; })}</select>
          </label>
          <label className="text-sm">Format<br />
            <select name="format" defaultValue={q.format ?? ''} className={inputClass}><option value="">All</option>{newsFormats.map((f) => <option key={f} value={f}>{formatLabel(f)}</option>)}</select>
          </label>
          <label className="text-sm">Rank by<br />
            <select name="metric" defaultValue={q.metric} className={inputClass}><option value="views">Views</option><option value="rate">Views a day</option></select>
          </label>
          <label className="text-sm">Older than (days)<br /><input type="number" name="minAgeDays" min={0} max={3650} defaultValue={q.minAgeDays || ''} className={`${inputClass} w-24`} /></label>
          <input type="hidden" name="order" value={q.order} />
          <input type="hidden" name="by" value={by} />
          <button type="submit" className="rounded border border-line bg-panel px-3 py-1.5 text-sm font-medium">Apply</button>
        </form>
      </Panel>

      <Panel title={`${groupNames[by]} totals`} id="summary-h">
        <nav aria-label="Group by" className="mb-3 flex flex-wrap gap-2 text-sm">
          {performanceGroups.map((g) => (
            <Link key={g} href={`/analytics?${queryOf({ ...raw, by: g })}`} aria-current={g === by ? 'true' : undefined}
              className={`rounded border px-2 py-1 ${g === by ? 'border-accent font-semibold' : 'border-line'}`}>{groupNames[g]}</Link>
          ))}
        </nav>
        {summary.rows.length === 0 ? <Empty>No live news in this period.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-1 pr-4">{groupNames[by]}</th><th className="py-1 pr-4 text-right">News</th><th className="py-1 pr-4 text-right">Views</th><th className="py-1 text-right">Views a news item</th></tr></thead>
              <tbody>
                {summary.rows.map((r) => (
                  <tr key={r.key} className="border-t border-line">
                    <td className="py-1.5 pr-4">{r.label}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">{r.news}</td>
                    <td className="py-1.5 pr-4 text-right font-medium tabular-nums">{r.views}</td>
                    <td className="py-1.5 text-right tabular-nums text-muted">{r.viewsPerNews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted">A news item counts in every section and region it has, and for every author it credits, so groups can add up to more than the total.</p>
          </div>
        )}
      </Panel>

      <Panel title={q.order === 'asc' ? 'Least read' : 'Most read'} id="list-h"
        actions={(
          <span className="flex gap-2 text-sm">
            <Link href={`/analytics?${queryOf(mostRead)}`} aria-current={q.order === 'desc' ? 'true' : undefined} className={`rounded border px-2 py-1 ${q.order === 'desc' ? 'border-accent font-semibold' : 'border-line'}`}>Most read</Link>
            <Link href={`/analytics?${queryOf(leastRead)}`} aria-current={q.order === 'asc' ? 'true' : undefined} className={`rounded border px-2 py-1 ${q.order === 'asc' ? 'border-accent font-semibold' : 'border-line'}`}>Least read</Link>
          </span>
        )}>
        {q.order === 'asc' ? (
          <p className="mb-3 text-sm text-muted">Includes news nobody read. Set &quot;Older than&quot; so new news is not listed just for being new. &quot;Views a day&quot; compares new and old news fairly.</p>
        ) : null}
        {list.items.length === 0 ? <Empty>No live news matches.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr><th className="py-1 pr-3">#</th><th className="py-1 pr-4">News</th><th className="py-1 pr-4">Published</th><th className="py-1 pr-4 text-right">Views</th><th className="py-1 pr-4 text-right">A day</th><th className="py-1">Where from</th></tr>
              </thead>
              <tbody>
                {list.items.map((n, i) => (
                  <tr key={`${n.newsId}-${n.locale}`} className="border-t border-line align-top">
                    <td className="py-2 pr-3 tabular-nums text-muted">{q.offset + i + 1}</td>
                    <td className="py-2 pr-4">
                      <Link href={`/news/${n.newsId}`} lang={n.locale} className="font-medium hover:underline">{n.title}</Link>
                      <div className="mt-0.5 flex flex-wrap gap-1 text-xs text-muted"><Badge>{n.locale}</Badge>{n.format !== 'news' ? <Badge tone="info">{formatLabel(n.format)}</Badge> : null}<code>{n.shortId}</code></div>
                    </td>
                    <td className="whitespace-nowrap py-2 pr-4 text-muted">{formatDateTime(n.publishedAt)}</td>
                    <td className="py-2 pr-4 text-right font-semibold tabular-nums">{n.views}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-muted">{n.viewsPerDay}</td>
                    <td className="min-w-48 py-2"><SourceBars sources={n.sources} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted">{list.items.length > 0 ? `${q.offset + 1} to ${q.offset + list.items.length}, ${total} views` : ''}</span>
          <span className="flex gap-3">
            {q.offset > 0 ? <Link href={page(Math.max(0, q.offset - q.limit))} className="underline">Previous</Link> : null}
            {list.more ? <Link href={page(q.offset + q.limit)} className="underline">Next</Link> : null}
          </span>
        </div>
      </Panel>
    </div>
  );
}
