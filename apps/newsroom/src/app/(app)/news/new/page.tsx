import { z } from 'zod';
import { localeSchema } from '@fact-lens/contracts';
import { NewNewsForm } from '@/components/NewsForms';
import { api } from '@/lib/current';

export const metadata = { title: 'New news item' };

export default async function NewNews() {
  const locales = await api('/reference/locales', z.array(localeSchema), { returnTo: '/news/new' });
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">New news item</h1>
      <NewNewsForm locales={locales.map((l) => ({ code: l.code, displayName: l.displayName }))} />
    </div>
  );
}
