import { contributorProfileListSchema } from '@fact-lens/contracts';
import { ContributorRow, NewContributorForm } from '@/components/ContributorParts';
import { AccessProblem, Empty, Panel } from '@/components/ui';
import { ApiError, api, getPrincipal, isMfaRequired } from '@/lib/current';
import { can } from '@/lib/nav';

export const metadata = { title: 'People' };

export default async function ContributorsPage({ searchParams }: { searchParams: Promise<{ q?: string; cursor?: string }> }) {
  const { q = '', cursor } = await searchParams;
  const principal = await getPrincipal();
  if (!can(principal, 'news.edit')) return <Empty>You do not have permission to manage people.</Empty>;
  const query = new URLSearchParams({ limit: '50' });
  if (q.trim()) query.set('query', q.trim().slice(0, 100));
  if (cursor) query.set('cursor', cursor.slice(0, 300));
  let people;
  try {
    people = await api(`/contributors/directory?${query}`, contributorProfileListSchema, { returnTo: '/contributors' });
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <AccessProblem mfaRequired={isMfaRequired(err)} />;
    throw err;
  }
  const next = new URLSearchParams({ ...(q.trim() ? { q: q.trim() } : {}), ...(people.nextCursor ? { cursor: people.nextCursor } : {}) });
  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold">People</h1>
        <p className="mt-1 text-sm text-muted">
          Reporters, editors, photographers and organizations credited on news items. Each has a photo, a short bio and social links that readers see on the byline.
          The contact email stays in the newsroom.
        </p>
      </header>

      <Panel title="Directory" id="people-h">
        <form className="mb-3 flex flex-wrap items-center gap-2" role="search">
          <input name="q" defaultValue={q} aria-label="Search people" placeholder="Search by name" maxLength={100} className="w-64 rounded border border-line bg-bg px-2 py-1.5 text-sm" />
          <button type="submit" className="rounded border border-line bg-panel px-3 py-1.5 text-sm font-medium">Search</button>
        </form>
        {people.items.length === 0 ? <Empty>{q ? 'No one matches.' : 'No one has been added yet.'}</Empty> : (
          <ul className="mb-3 space-y-2">{people.items.map((p) => <ContributorRow key={p.id} person={p} />)}</ul>
        )}
        {people.nextCursor ? <a href={`/contributors?${next}`} className="text-sm underline">Next 50</a> : null}
      </Panel>

      <Panel title="Add a person" id="new-person-h">
        <NewContributorForm />
      </Panel>
    </div>
  );
}
