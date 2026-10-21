import Link from 'next/link';
import { mediaListSchema } from '@fact-lens/contracts';
import { UploadAndOpen } from '@/components/MediaParts';
import { Badge, Empty } from '@/components/ui';
import { api } from '@/lib/current';
import { formatDateTime } from '@/lib/format';
import { mediaFileUrl, rightsStatus } from '@/lib/media';

export const metadata = { title: 'Media library' };

export default async function MediaLibrary({ searchParams }: { searchParams: Promise<{ query?: string; cursor?: string }> }) {
  const { query, cursor } = await searchParams;
  const params = new URLSearchParams({ limit: '24', ...(query ? { query } : {}), ...(cursor ? { cursor } : {}) });
  const list = await api(`/media?${params}`, mediaListSchema, { returnTo: '/media' });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Media library</h1>
          <p className="text-sm text-muted">Pictures for stories. Add the credit and licence here so a story can be published.</p>
        </div>
        <UploadAndOpen />
      </div>
      <form role="search" className="mb-4 flex max-w-lg gap-2">
        <input type="search" name="query" defaultValue={query} aria-label="Search" placeholder="Search by file name, credit or alt text"
          className="w-full rounded border border-line bg-panel px-2 py-1.5 text-sm" />
        <button type="submit" className="rounded border border-line bg-panel px-3 py-1.5 text-sm">Search</button>
      </form>

      {list.items.length === 0 ? (
        <Empty>{query ? 'Nothing matches that search.' : 'The library is empty. Upload the first picture.'}</Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.items.map((a) => {
            const status = rightsStatus(a);
            return (
              <li key={a.id} className="rounded-lg border border-line bg-panel p-2">
                <Link href={`/media/${a.id}`} className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaFileUrl(a.id, 'thumb')} alt={a.altText ?? ''} loading="lazy" className="aspect-[4/3] w-full rounded object-cover" />
                  <span className="mt-2 block truncate text-sm font-medium">{a.originalFilename ?? 'Untitled'}</span>
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted">
                  <Badge tone={status.tone}>{status.label}</Badge>
                  <span>{a.usageCount > 0 ? `used in ${a.usageCount}` : 'unused'}</span>
                </div>
                <div className="mt-1 text-xs text-muted">{formatDateTime(a.createdAt)}</div>
              </li>
            );
          })}
        </ul>
      )}
      {list.nextCursor ? (
        <Link className="mt-4 inline-block text-sm underline" href={`/media?${new URLSearchParams({ ...(query ? { query } : {}), cursor: list.nextCursor })}`}>Older pictures</Link>
      ) : null}
    </div>
  );
}
