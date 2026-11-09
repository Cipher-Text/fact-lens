'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { contributorKinds, socialNetworks, type ContributorProfile } from '@fact-lens/contracts';
import { announce } from '@/lib/announce';
import { bff } from '@/lib/client';
import { submitWith } from '@/lib/form';
import { mediaFileUrl } from '@/lib/media';
import { socialExamples, socialNames } from '@/lib/social';
import { MediaPicker } from './MediaParts';
import { Badge, buttonClass, Field, inputClass, Notice } from './ui';

type Failure = { message: string; issues: string[] } | null;

/** The picture of a person: a round thumbnail, and buttons to choose one from the media library or remove it. */
function Portrait({ imageId, onChoose, onRemove }: { imageId: string | null; onChoose: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3">
      {imageId ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaFileUrl(imageId, 'thumb')} alt="" width={64} height={64} className="h-16 w-16 rounded-full border border-line object-cover" />
      ) : (
        <span className="grid h-16 w-16 place-items-center rounded-full border border-dashed border-line text-xs text-muted">No photo</span>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium">Photo</p>
        <div className="flex gap-2">
          <button type="button" className={buttonClass()} onClick={onChoose}>{imageId ? 'Change' : 'Choose from library'}</button>
          {imageId ? <button type="button" className={buttonClass()} onClick={onRemove}>Remove</button> : null}
        </div>
        <p className="text-xs text-muted">Shown on the byline once the image has a credit or licence and allows the web.</p>
      </div>
    </div>
  );
}

/** The fields of a person, for adding and for editing. `person` is the saved one when editing. */
function ProfileForm({ person, submit, label, pending, error }: {
  person?: ContributorProfile; label: string; pending: boolean; error: Failure;
  submit: (body: Record<string, unknown>, reset: () => void) => void;
}) {
  const [imageId, setImageId] = useState<string | null>(person?.imageId ?? null);
  const [picking, setPicking] = useState(false);
  return (
    <>
      <form className="space-y-3" onSubmit={submitWith((form, el) => submit({
        kind: form.get('kind'), displayName: String(form.get('displayName') ?? '').trim(),
        bio: String(form.get('bio') ?? '').trim() || null, contactEmail: String(form.get('contactEmail') ?? '').trim() || null,
        imageId, socialLinks: Object.fromEntries(socialNetworks.map((n) => [n, String(form.get(n) ?? '').trim() || null])),
      }, () => { el.reset(); setImageId(null); }))}>
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
          <Field label="Name"><input name="displayName" required maxLength={200} defaultValue={person?.displayName ?? ''} className={inputClass} /></Field>
          <Field label="Kind">
            <select name="kind" defaultValue={person?.kind ?? 'person'} className={inputClass}>
              {contributorKinds.map((k) => <option key={k} value={k}>{k === 'person' ? 'Person' : 'Organization'}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Bio" hint="Shown on the public byline."><textarea name="bio" rows={3} maxLength={2000} defaultValue={person?.bio ?? ''} className={inputClass} /></Field>
        <Field label="Contact email" hint="Private. Only the newsroom sees it."><input name="contactEmail" type="email" maxLength={320} defaultValue={person?.contactEmail ?? ''} className={inputClass} /></Field>
        <Portrait imageId={imageId} onChoose={() => setPicking(true)} onRemove={() => setImageId(null)} />
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Social links</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {socialNetworks.map((n) => (
              <Field key={n} label={socialNames[n]}>
                <input name={n} type="url" maxLength={300} defaultValue={person?.socialLinks[n] ?? ''} placeholder={socialExamples[n]} className={inputClass} />
              </Field>
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={pending} className={buttonClass('primary')}>{label}</button>
        {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
      </form>
      <MediaPicker open={picking} onClose={() => setPicking(false)} onChoose={(c) => { setImageId(c.mediaAssetId); setPicking(false); }} />
    </>
  );
}

function useSave(method: 'POST' | 'PUT', path: string) {
  const router = useRouter();
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();
  const save = (body: Record<string, unknown>, after: () => void) => {
    setError(null);
    start(async () => {
      const res = await bff(method, path, body);
      if (!res.ok) return setError({ message: res.message, issues: res.issues });
      after();
      announce('Saved');
      router.refresh();
    });
  };
  return { error, pending, save };
}

export function NewContributorForm() {
  const { error, pending, save } = useSave('POST', 'contributors');
  return <ProfileForm label="Add person" pending={pending} error={error} submit={(body, reset) => save(body, reset)} />;
}

export function ContributorRow({ person }: { person: ContributorProfile }) {
  const { error, pending, save } = useSave('PUT', `contributors/${person.id}`);
  const [editing, setEditing] = useState(false);
  const links = socialNetworks.filter((n) => person.socialLinks[n]);
  return (
    <li className="rounded-lg border border-line bg-panel p-3">
      <div className="flex flex-wrap items-center gap-3">
        {person.imageId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaFileUrl(person.imageId, 'thumb')} alt="" width={40} height={40} className="h-10 w-10 rounded-full border border-line object-cover" />
        ) : (
          <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full border border-dashed border-line text-xs text-muted">{person.displayName.slice(0, 1).toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <strong>{person.displayName}</strong>
          {person.bio ? <p className="max-w-xl truncate text-sm text-muted">{person.bio}</p> : null}
        </div>
        {person.kind === 'organization' ? <Badge>Organization</Badge> : null}
        {links.map((n) => (
          <a key={n} href={person.socialLinks[n]!} target="_blank" rel="noopener noreferrer" className="text-xs underline">{socialNames[n]}</a>
        ))}
        <Badge tone="info">{`${person.usageCount} ${person.usageCount === 1 ? 'news item' : 'news items'}`}</Badge>
        <button type="button" onClick={() => setEditing(!editing)} aria-expanded={editing} className={`${buttonClass()} ml-auto`}>{editing ? 'Close' : 'Edit'}</button>
      </div>
      {editing ? (
        <div className="mt-3">
          <ProfileForm person={person} label="Save" pending={pending} error={error} submit={(body) => save(body, () => setEditing(false))} />
        </div>
      ) : null}
    </li>
  );
}
