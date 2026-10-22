import { notFound } from 'next/navigation';
import { mediaDetailSchema } from '@fact-lens/contracts';
import { DeleteMedia, RightsForm } from '@/components/MediaParts';
import { Panel } from '@/components/ui';
import { ApiError, api, getPrincipal } from '@/lib/current';
import { formatDateTime } from '@/lib/format';
import { formatBytes, mediaFileUrl } from '@/lib/media';
import { can } from '@/lib/nav';

export const metadata = { title: 'Image' };

export default async function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const principal = await getPrincipal();
  const asset = await api(`/media/${id}`, mediaDetailSchema, { returnTo: `/media/${id}` }).catch((err) => {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">{asset.originalFilename ?? 'Image'}</h1>
      <p className="mb-4 text-sm text-muted">Uploaded {formatDateTime(asset.createdAt)} by {asset.uploadedBy ?? 'unknown'}</p>
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Panel title="Picture" id="pic">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaFileUrl(asset.id, 'hero')} alt={asset.altText ?? ''} className="max-h-[32rem] max-w-full rounded border border-line" />
            <dl className="mt-3 grid grid-cols-2 gap-1 text-sm">
              <dt className="text-muted">Size</dt><dd>{asset.width} × {asset.height} px · {formatBytes(asset.byteSize)}</dd>
              <dt className="text-muted">Type</dt><dd>{asset.mimeType}</dd>
              <dt className="text-muted">Copies</dt><dd>{asset.variants.map((v) => `${v.name} ${v.width}px`).join(', ')}</dd>
              <dt className="text-muted">Used in</dt><dd>{asset.usageCount} {asset.usageCount === 1 ? 'news item' : 'news items'}</dd>
            </dl>
          </Panel>
          {can(principal, 'media.manage') ? <Panel title="Delete" id="del"><DeleteMedia id={asset.id} usageCount={asset.usageCount} /></Panel> : null}
        </div>
        <Panel title="Rights and credit" id="rights"><RightsForm asset={asset} /></Panel>
      </div>
    </div>
  );
}
