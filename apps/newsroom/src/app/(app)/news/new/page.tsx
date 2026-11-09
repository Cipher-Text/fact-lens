import { z } from 'zod';
import { categorySchema, deskSchema, inboxItemSchema, localeSchema, taxonomyRegionSchema } from '@fact-lens/contracts';
import { NewNewsForm } from '@/components';
import { api } from '@/lib/current';

export const metadata = { title: 'New news item' };

const uuid = z.string().uuid();

export default async function NewNews({ searchParams }: { searchParams: Promise<{ fromInbox?: string }> }) {
  const { fromInbox } = await searchParams;
  const here = '/news/new';
  const inboxId = uuid.safeParse(fromInbox);
  const [locales, desks, categories, regions, item] = await Promise.all([
    api('/reference/locales', z.array(localeSchema), { returnTo: here }),
    api('/reference/desks', z.array(deskSchema), { returnTo: here }),
    api('/reference/categories', z.array(categorySchema), { returnTo: here }),
    api('/reference/regions', z.array(taxonomyRegionSchema), { returnTo: here }),
    // An item that is gone, or already used, simply means a blank form.
    inboxId.success ? api(`/inbox/${inboxId.data}`, inboxItemSchema, { returnTo: here }).catch(() => null) : Promise.resolve(null),
  ]);
  const from = item && item.status !== 'used' ? item : null;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New news item</h1>
      <NewNewsForm locales={locales.map((l) => ({ code: l.code, displayName: l.displayName }))} desks={desks} categories={categories} regions={regions} fromInbox={from} />
    </div>
  );
}
