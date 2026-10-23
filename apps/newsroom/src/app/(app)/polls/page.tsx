import Link from 'next/link';
import { z } from 'zod';
import { pollSchema, pollStatuses } from '@fact-lens/contracts';
import { PollBadges } from '@/components/PollParts';
import { AccessProblem, Empty } from '@/components/ui';
import { ApiError, api, getPrincipal, isMfaRequired } from '@/lib/current';
import { formatDateTime } from '@/lib/format';
import { can } from '@/lib/nav';
import { pollTitle } from '@/lib/polls';

export const metadata = { title: 'Polls' };

export default async function Polls({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: asked } = await searchParams;
  const status = pollStatuses.find((s) => s === asked);
  const principal = await getPrincipal();
  let polls;
  try {
    polls = await api(`/polls${status ? `?status=${status}` : ''}`, z.array(pollSchema), { returnTo: '/polls' });
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <AccessProblem mfaRequired={isMfaRequired(err)} />;
    throw err;
  }
  const tabs: Array<{ href: string; label: string; on: boolean }> = [
    { href: '/polls', label: 'Current', on: !status },
    ...pollStatuses.map((s) => ({ href: `/polls?status=${s}`, label: s[0]!.toUpperCase() + s.slice(1), on: status === s })),
  ];
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Polls</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Questions for readers, voted on from the public site. One vote per browser, with a daily limit for each network address, so treat the numbers as reader interest, not a survey.
          </p>
        </div>
        {can(principal, 'news.edit') ? <Link href="/polls/new" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg">New poll</Link> : null}
      </header>
      <nav aria-label="Poll status" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.label} href={t.href} aria-current={t.on ? 'page' : undefined}
            className={`rounded-lg border px-3 py-1.5 text-sm ${t.on ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-panel'}`}>{t.label}</Link>
        ))}
      </nav>
      {polls.length === 0 ? <Empty>No polls here.</Empty> : (
        <ul className="space-y-2">
          {polls.map((p) => (
            <li key={p.id} className="rounded-lg border border-line bg-panel p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/polls/${p.id}`} className="font-medium underline-offset-2 hover:underline">{pollTitle(p)}</Link>
                <PollBadges poll={p} />
              </div>
              <p className="mt-1 text-xs text-muted">
                {p.totalVotes} {p.totalVotes === 1 ? 'vote' : 'votes'} · {p.options.length} options
                {p.opensAt ? ` · opens ${formatDateTime(p.opensAt)}` : ''}{p.closesAt ? ` · closes ${formatDateTime(p.closesAt)}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
