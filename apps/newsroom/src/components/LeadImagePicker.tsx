'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { announce } from '@/lib/announce';
import { bff } from '@/lib/client';
import { mediaFileUrl } from '@/lib/media';
import { MediaPicker } from './MediaParts';
import { buttonClass, Notice } from './ui';

/** The lead image of the open revision: shown on the cards, the lists and Most read once it is cleared for the web. */
export function LeadImagePicker({ newsId, imageId }: { newsId: string; imageId: string | null }) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<{ message: string; issues: string[] } | null>(null);
  const [pending, start] = useTransition();
  const save = (mediaAssetId: string | null) => {
    setError(null);
    start(async () => {
      const res = await bff('PUT', `news/${newsId}/lead-image`, { mediaAssetId });
      if (!res.ok) return setError({ message: res.message, issues: res.issues });
      announce('Saved');
      router.refresh();
    });
  };
  return (
    <div>
      <p className="mb-1 text-sm font-medium">Lead image</p>
      <div className="flex items-center gap-3">
        {imageId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaFileUrl(imageId, 'thumb')} alt="" width={96} height={54} className="h-14 w-24 rounded-lg border border-line object-cover" />
        ) : (
          <span className="grid h-14 w-24 place-items-center rounded-lg border border-dashed border-line text-xs text-muted">None</span>
        )}
        <div className="flex gap-2">
          <button type="button" disabled={pending} className={buttonClass()} onClick={() => setPicking(true)}>{imageId ? 'Change' : 'Choose from library'}</button>
          {imageId ? <button type="button" disabled={pending} className={buttonClass()} onClick={() => save(null)}>Remove</button> : null}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">Needs a credit or licence, and the web channel, to show on the public site.</p>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
      <MediaPicker open={picking} onClose={() => setPicking(false)} onChoose={(c) => { setPicking(false); save(c.mediaAssetId); }} />
    </div>
  );
}
