import { notFound } from 'next/navigation';
import { z } from 'zod';
import { localeSchema, pollSchema } from '@fact-lens/contracts';
import { PollActions, PollBadges, PollForm, PollResults } from '@/components/PollParts';
import { Panel } from '@/components/ui';
import { ApiError, api, getPrincipal } from '@/lib/current';
import { formatDateTime } from '@/lib/format';
import { can } from '@/lib/nav';
import { pollTitle } from '@/lib/polls';

export const metadata = { title: 'Poll' };

export default async function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const here = `/polls/${id}`;
  const principal = await getPrincipal();
  const [poll, locales] = await Promise.all([
    api(`/polls/${id}`, pollSchema, { returnTo: here }).catch((e) => { if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return null; throw e; }),
    api('/reference/locales', z.array(localeSchema), { returnTo: here }),
  ]);
  if (!poll) notFound();
  const canEdit = can(principal, 'news.edit');
  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold">{pollTitle(poll)}</h1><PollBadges poll={poll} /></div>
        <p className="text-xs text-muted">
          Created {formatDateTime(poll.createdAt)}
          {poll.opensAt ? ` · opens ${formatDateTime(poll.opensAt)}` : ''}{poll.closesAt ? ` · closes ${formatDateTime(poll.closesAt)}` : ''}
        </p>
        <PollActions poll={poll} canEdit={canEdit} canPublish={can(principal, 'news.publish')} />
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Panel title={poll.editable ? 'Wording' : 'Wording (fixed)'} id="wording-h">
          <PollForm locales={locales} poll={poll} />
        </Panel>
        <Panel title="Results" id="results-h">
          {poll.status === 'draft' ? <p className="text-sm text-muted">Votes appear once the poll is open.</p> : <PollResults poll={poll} />}
        </Panel>
      </div>
    </div>
  );
}
