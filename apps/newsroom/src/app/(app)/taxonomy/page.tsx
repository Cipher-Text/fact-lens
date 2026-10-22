import Link from 'next/link';
import { z } from 'zod';
import { localeSchema, taxonomyCategorySchema, taxonomyTagListSchema } from '@fact-lens/contracts';
import { CategoryRow, NewCategoryForm, NewTagForm, TagRow } from '@/components';
import { AccessProblem, Empty, Panel } from '@/components/ui';
import { ApiError, api, getPrincipal, isMfaRequired } from '@/lib/current';
import { can } from '@/lib/nav';

export const metadata = { title: 'Sections and tags' };

export default async function TaxonomyPage({ searchParams }: { searchParams: Promise<{ q?: string; archived?: string }> }) {
  const { q = '', archived } = await searchParams;
  const principal = await getPrincipal();
  if (!can(principal, 'taxonomy.manage')) return <Empty>You do not have permission to manage sections and tags.</Empty>;
  const query = new URLSearchParams({ limit: '100' });
  if (q.trim()) query.set('query', q.trim().slice(0, 100));
  if (archived === '1') query.set('status', 'archived');
  let data;
  try {
    data = await Promise.all([
      api('/reference/locales', z.array(localeSchema), { returnTo: '/taxonomy' }),
      api('/taxonomy/categories', z.array(taxonomyCategorySchema), { returnTo: '/taxonomy' }),
      api(`/taxonomy/tags?${query}`, taxonomyTagListSchema, { returnTo: '/taxonomy' }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <AccessProblem mfaRequired={isMfaRequired(err)} />;
    throw err;
  }
  const [locales, categories, tags] = data;
  const order = categories.map((c) => c.id);
  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Sections and tags</h1>
        <p className="mt-1 text-sm text-muted">
          Sections make up the news menu; a news item has one. Tags describe a news item; it can have many. Each is named once per language ({locales.map((l) => l.displayName).join(', ')}).
          Something with no name in a language is left out of that language&apos;s site. Add languages under <Link href="/config" className="underline">Configuration</Link>.
        </p>
      </header>

      <Panel title="Menu sections" id="categories-h">
        <ol className="mb-4 space-y-2">
          {categories.map((c) => <CategoryRow key={c.id} category={c} order={order} locales={locales} />)}
        </ol>
        <details>
          <summary className="cursor-pointer text-sm font-medium">Add a section</summary>
          <div className="mt-3"><NewCategoryForm locales={locales} /></div>
        </details>
      </Panel>

      <Panel title="Tags" id="tags-h">
        <form className="mb-3 flex flex-wrap items-center gap-2" role="search">
          <input name="q" defaultValue={q} aria-label="Search tags" placeholder="Search by name, address or key" maxLength={100} className="w-64 rounded border border-line bg-bg px-2 py-1.5 text-sm" />
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="archived" value="1" defaultChecked={archived === '1'} /> Archived only</label>
          <button type="submit" className="rounded border border-line bg-panel px-3 py-1.5 text-sm font-medium">Search</button>
        </form>
        {tags.items.length === 0 ? <Empty>No tags match.</Empty> : (
          <ul className="mb-3 space-y-2">{tags.items.map((t) => <TagRow key={t.id} tag={t} locales={locales} />)}</ul>
        )}
        {tags.nextCursor ? <p className="mb-3 text-sm text-muted">Showing the first 100. Search to narrow the list.</p> : null}
        <details>
          <summary className="cursor-pointer text-sm font-medium">Add a tag</summary>
          <div className="mt-3"><NewTagForm locales={locales} /></div>
        </details>
      </Panel>
    </div>
  );
}
