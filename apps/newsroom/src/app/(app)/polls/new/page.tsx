import { z } from 'zod';
import { localeSchema } from '@fact-lens/contracts';
import { PollForm } from '@/components/PollParts';
import { Empty } from '@/components/ui';
import { api, getPrincipal } from '@/lib/current';
import { can } from '@/lib/nav';

export const metadata = { title: 'New poll' };

export default async function NewPoll() {
  const principal = await getPrincipal();
  if (!can(principal, 'news.edit')) return <Empty>You do not have permission to write polls.</Empty>;
  const locales = await api('/reference/locales', z.array(localeSchema), { returnTo: '/polls/new' });
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">New poll</h1>
      <p className="text-sm text-muted">Write the question and two to four options. It starts as a draft: a managing editor opens it for voting.</p>
      <PollForm locales={locales} />
    </div>
  );
}
