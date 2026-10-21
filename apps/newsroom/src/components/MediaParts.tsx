'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { MAX_MEDIA_BYTES, type MediaDetail } from '@fact-lens/contracts';
import { bff, bffUpload } from '@/lib/client';
import { submitWith } from '@/lib/form';
import { dateFromExpiry, expiryFromDate, formatBytes, licenseSuggestions, mediaFileUrl, rightsStatus } from '@/lib/media';
import { Badge, buttonClass, Field, inputClass, Notice } from './ui';

type Failure = { message: string; issues: string[] } | null;

/** Uploads one or more images, one request each, and reports every result. */
export function UploadButton({ onUploaded, label = 'Upload images' }: { onUploaded: (assets: MediaDetail[]) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Array<{ name: string; ok: boolean; text: string }>>([]);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setResults([]);
    const done: MediaDetail[] = [];
    const log: typeof results = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_MEDIA_BYTES) {
        log.push({ name: file.name, ok: false, text: `Larger than ${formatBytes(MAX_MEDIA_BYTES)}` });
        continue;
      }
      const res = await bffUpload<MediaDetail>(file);
      if (res.ok) {
        done.push(res.data);
        log.push({ name: file.name, ok: true, text: res.status === 200 ? 'Already in the library' : 'Uploaded' });
      } else {
        log.push({ name: file.name, ok: false, text: res.message });
      }
    }
    setResults(log);
    setBusy(false);
    if (input.current) input.current.value = '';
    if (done.length > 0) onUploaded(done);
  }

  return (
    <div>
      <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" id="media-file" aria-label={label}
        onChange={(e) => void upload(e.target.files)} />
      <label htmlFor="media-file" className={`${buttonClass('primary')} inline-block cursor-pointer ${busy ? 'opacity-50' : ''}`}>{busy ? 'Uploading…' : label}</label>
      <p className="mt-1 text-xs text-muted">JPEG, PNG or WebP. Location and camera details are removed.</p>
      {results.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm" aria-live="polite">
          {results.map((r, i) => <li key={`${r.name}-${i}`} className={r.ok ? 'text-muted' : 'text-danger'}>{r.name}: {r.text}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

export function UploadAndOpen() {
  const router = useRouter();
  return <UploadButton onUploaded={(assets) => (assets.length === 1 ? router.push(`/media/${assets[0]!.id}`) : router.refresh())} />;
}

export function RightsForm({ asset }: { asset: MediaDetail }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string; issues: string[] } | null>(null);
  const [pending, start] = useTransition();
  const status = rightsStatus(asset);

  return (
    <form className="space-y-3" onSubmit={submitWith((form) => {
      setMessage(null);
      start(async () => {
        const text = (name: string) => ((form.get(name) as string) ?? '').trim() || null;
        const res = await bff('PUT', `media/${asset.id}/rights`, {
          altText: text('altText'), license: text('license'), attribution: text('attribution'), rightsOwner: text('rightsOwner'),
          rightsNotes: text('rightsNotes'), sourceUrl: text('sourceUrl'), rightsExpiresAt: expiryFromDate((form.get('expires') as string) ?? ''),
          permittedChannels: form.getAll('channels'),
        });
        if (!res.ok) return setMessage({ kind: 'error', text: res.message, issues: res.issues });
        setMessage({ kind: 'ok', text: 'Saved', issues: [] });
        router.refresh();
      });
    })}>
      <div className="flex items-center gap-2"><Badge tone={status.tone}>{status.label}</Badge></div>
      <Field label="Alt text" hint="Describes the picture for people who cannot see it. Used as the starting text when you insert it.">
        <textarea name="altText" rows={2} maxLength={500} defaultValue={asset.altText ?? ''} className={inputClass} />
      </Field>
      <Field label="Credit line" hint="Shown with the picture, for example “Photo: Karim Hossain”.">
        <input name="attribution" maxLength={300} defaultValue={asset.attribution ?? ''} className={inputClass} />
      </Field>
      <Field label="Licence" hint="A story with this picture cannot be published until it has a licence or a credit line.">
        <input name="license" list="licences" maxLength={200} defaultValue={asset.license ?? ''} className={inputClass} />
        <datalist id="licences">{licenseSuggestions.map((l) => <option key={l} value={l} />)}</datalist>
      </Field>
      <Field label="Rights owner"><input name="rightsOwner" maxLength={300} defaultValue={asset.rightsOwner ?? ''} className={inputClass} /></Field>
      <Field label="Source address"><input name="sourceUrl" type="url" maxLength={2048} defaultValue={asset.sourceUrl ?? ''} placeholder="https://" className={inputClass} /></Field>
      <Field label="Rights end on" hint="Leave empty if they do not expire. After this day the picture stops showing to readers.">
        <input name="expires" type="date" defaultValue={dateFromExpiry(asset.rightsExpiresAt)} className={inputClass} />
      </Field>
      <fieldset>
        <legend className="mb-1 text-sm font-medium">May be used on</legend>
        <div className="flex gap-4 text-sm">
          {(['web', 'social', 'print'] as const).map((c) => (
            <label key={c} className="flex items-center gap-1"><input type="checkbox" name="channels" value={c} defaultChecked={asset.permittedChannels.includes(c)} /> {c}</label>
          ))}
        </div>
      </fieldset>
      <Field label="Notes"><textarea name="rightsNotes" rows={2} maxLength={2000} defaultValue={asset.rightsNotes ?? ''} className={inputClass} /></Field>
      {message ? <Notice kind={message.kind} message={message.text} issues={message.issues} /> : null}
      <button type="submit" disabled={pending} className={buttonClass('primary')}>{pending ? 'Saving…' : 'Save rights'}</button>
    </form>
  );
}

export function DeleteMedia({ id, usageCount }: { id: string; usageCount: number }) {
  const router = useRouter();
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();
  if (usageCount > 0) return <p className="text-sm text-muted">Used in {usageCount} {usageCount === 1 ? 'story' : 'stories'}, so it cannot be deleted.</p>;
  return (
    <div>
      <button type="button" disabled={pending} className={buttonClass('danger')} onClick={() => {
        if (!window.confirm('Delete this image and all its copies? This cannot be undone.')) return;
        setError(null);
        start(async () => {
          const res = await bff('DELETE', `media/${id}`);
          if (!res.ok) return setError({ message: res.message, issues: res.issues });
          router.push('/media');
          router.refresh();
        });
      }}>Delete image</button>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </div>
  );
}

/** A dialog that finds an image in the library (or uploads a new one) and gives back its id and alt text. */
export function MediaPicker({ open, onClose, onChoose }: {
  open: boolean; onClose: () => void; onChoose: (choice: { mediaAssetId: string; alt: string }) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<MediaDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<MediaDetail | null>(null);
  const [alt, setAlt] = useState('');

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    const res = await bff<{ items: MediaDetail[] }>('GET', `media?limit=24${q ? `&query=${encodeURIComponent(q)}` : ''}`);
    setLoading(false);
    if (res.ok) setItems(res.data.items);
    else setError(res.message);
  }, []);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      setChosen(null);
      void load('');
    }
    if (!open && el.open) el.close();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => void load(query), 250);
    return () => clearTimeout(timer);
  }, [query, open, load]);

  const choose = (a: MediaDetail) => {
    setChosen(a);
    setAlt(a.altText ?? '');
  };

  return (
    <dialog ref={dialog} onClose={onClose} onCancel={onClose} aria-labelledby="picker-title"
      className="m-auto w-[min(48rem,95vw)] rounded-lg border border-line bg-panel p-4 text-fg backdrop:bg-black/50">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="picker-title" className="text-lg font-semibold">{chosen ? 'Insert image' : 'Choose an image'}</h2>
        <button type="button" className={buttonClass()} onClick={onClose}>Close</button>
      </div>

      {chosen ? (
        <form className="space-y-3" onSubmit={submitWith(() => {
          if (!alt.trim()) return setError('Describe the picture in a few words. People who cannot see it rely on this.');
          onChoose({ mediaAssetId: chosen.id, alt: alt.trim() });
        })}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaFileUrl(chosen.id, 'card')} alt="" className="max-h-64 rounded border border-line" />
          <Field label="Alt text" hint="Describes the picture for people who cannot see it.">
            <textarea autoFocus value={alt} onChange={(e) => { setAlt(e.target.value); setError(null); }} rows={2} maxLength={500} className={inputClass} />
          </Field>
          {!rightsStatus(chosen).ready ? (
            <Notice kind="ok" message={`${rightsStatus(chosen).label}. You can insert it now, but the story cannot be published until this is fixed in the media library.`} />
          ) : null}
          {error ? <Notice kind="error" message={error} /> : null}
          <div className="flex gap-2">
            <button type="submit" className={buttonClass('primary')}>Insert</button>
            <button type="button" className={buttonClass()} onClick={() => { setChosen(null); setError(null); }}>Back to the library</button>
          </div>
        </form>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <input type="search" aria-label="Search the library" placeholder="Search by file name, credit or alt text" value={query}
              onChange={(e) => setQuery(e.target.value)} className={`${inputClass} max-w-sm`} />
            <UploadButton label="Upload" onUploaded={(assets) => { if (assets.length === 1) choose(assets[0]!); else void load(query); }} />
          </div>
          {error ? <Notice kind="error" message={error} /> : null}
          {loading && items.length === 0 ? <p className="text-sm text-muted">Loading…</p> : null}
          {!loading && items.length === 0 && !error ? <p className="text-sm text-muted">No images found. Upload one to get started.</p> : null}
          <ul className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
            {items.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => choose(a)} className="block w-full rounded border border-line p-1 text-left hover:border-accent">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaFileUrl(a.id, 'thumb')} alt="" loading="lazy" className="aspect-[4/3] w-full rounded object-cover" />
                  <span className="mt-1 block truncate text-xs">{a.originalFilename ?? 'Untitled'}</span>
                  <span className="text-xs text-muted">{rightsStatus(a).ready ? '' : rightsStatus(a).label}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </dialog>
  );
}
