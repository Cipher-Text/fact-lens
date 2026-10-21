import { z } from 'zod';
import { localeSchema } from '@fact-lens/contracts';
import { NewStoryForm } from '@/components/StoryForms';
import { api } from '@/lib/current';

export const metadata = { title: 'New story' };

export default async function NewStory() {
  const locales = await api('/reference/locales', z.array(localeSchema), { returnTo: '/stories/new' });
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">New story</h1>
      <NewStoryForm locales={locales.map((l) => ({ code: l.code, displayName: l.displayName }))} />
    </div>
  );
}
