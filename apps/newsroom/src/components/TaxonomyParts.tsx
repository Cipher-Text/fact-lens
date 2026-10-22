'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Locale, TaxonomyCategory, TaxonomyTag } from '@fact-lens/contracts';
import { announce } from '@/lib/announce';
import { bff } from '@/lib/client';
import { submitWith } from '@/lib/form';
import { mediaFileUrl } from '@/lib/media';
import { MediaPicker } from './MediaParts';
import { Badge, buttonClass, Field, inputClass, Notice } from './ui';

type Failure = { message: string; issues: string[] } | null;
type Item = TaxonomyCategory | TaxonomyTag;

function useCommand() {
  const router = useRouter();
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();
  const run = (method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown, after?: () => void) => {
    setError(null);
    start(async () => {
      const res = await bff(method, path, body);
      if (!res.ok) {
        const message = res.reason === 'mfa_required' ? 'This step needs a sign-in with a second factor. Sign out and sign in again with MFA.' : res.message;
        return setError({ message, issues: res.issues });
      }
      after?.();
      announce('Saved');
      router.refresh();
    });
  };
  return { error, pending, run };
}

const nameIn = (item: Item, locale: string) => item.labels.find((l) => l.locale === locale)?.name;
const missingIn = (item: Item, locales: Locale[]) => locales.filter((l) => !nameIn(item, l.code));
/** What to call an item in the list: its English name, else any name, else its key. */
export const displayName = (item: Item) => nameIn(item, 'en') ?? item.labels[0]?.name ?? item.key;

/** One name field per active language. The languages come from the server, so a new one appears with no change here. */
function LabelFields({ item, locales, withDescription }: { item?: Item; locales: Locale[]; withDescription: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {locales.map((l) => {
        const label = item?.labels.find((x) => x.locale === l.code);
        return (
          <fieldset key={l.code} className="space-y-2 rounded border border-line p-2" dir={l.direction}>
            <legend className="px-1 text-xs font-medium text-muted">{l.displayName} ({l.code})</legend>
            <Field label="Name"><input name={`name:${l.code}`} lang={l.code} defaultValue={label?.name ?? ''} maxLength={120} className={inputClass} /></Field>
            {withDescription ? (
              <Field label="Description"><textarea name={`description:${l.code}`} lang={l.code} defaultValue={label?.description ?? ''} maxLength={500} rows={2} className={inputClass} /></Field>
            ) : null}
            {label ? <p className="text-xs text-muted" dir="ltr">Address: <code>{label.slug}</code></p> : null}
          </fieldset>
        );
      })}
    </div>
  );
}

/** Reads the per-language fields. An empty name means "no name in this language": removed on an edit, skipped on a create. */
function readLabels(form: FormData, locales: Locale[], item: Item | undefined, withDescription: boolean) {
  const labels: Record<string, { name: string; description?: string | null } | null> = {};
  for (const l of locales) {
    const name = String(form.get(`name:${l.code}`) ?? '').trim();
    if (name) {
      const description = withDescription ? String(form.get(`description:${l.code}`) ?? '').trim() : '';
      labels[l.code] = { name, ...(withDescription ? { description: description || null } : {}) };
    } else if (item && nameIn(item, l.code)) {
      labels[l.code] = null;
    }
  }
  return labels;
}

function Missing({ item, locales }: { item: Item; locales: Locale[] }) {
  const missing = missingIn(item, locales);
  if (missing.length === 0) return null;
  return <Badge tone="warn">{`No name in ${missing.map((l) => l.displayName).join(', ')}: left out there`}</Badge>;
}

/** Picks the parent menu. Only top-level sections can be parents, and a section with child menus cannot become a child. */
function ParentSelect({ parents, current, self, hasChildren }: { parents: TaxonomyCategory[]; current?: string | null; self?: string; hasChildren?: boolean }) {
  return (
    <Field label="Parent menu" hint={hasChildren ? 'This section has child menus, so it stays a top-level menu.' : 'Optional. Makes this a child menu under the parent. The menu has two levels.'}>
      <select name="parentId" defaultValue={current ?? ''} disabled={hasChildren} className={inputClass}>
        <option value="">None: a top-level menu</option>
        {parents.filter((p) => p.id !== self).map((p) => <option key={p.id} value={p.id}>{displayName(p)}</option>)}
      </select>
    </Field>
  );
}

export function NewCategoryForm({ locales, parents }: { locales: Locale[]; parents: TaxonomyCategory[] }) {
  const { error, pending, run } = useCommand();
  return (
    <form className="space-y-3" onSubmit={submitWith((form, el) => {
      const key = String(form.get('key') ?? '').trim();
      run('POST', 'taxonomy/categories', {
        ...(key ? { key } : {}), showInMenu: form.get('showInMenu') === 'on', parentId: String(form.get('parentId') ?? '') || null,
        labels: readLabels(form, locales, undefined, true),
      }, () => el.reset());
    })}>
      <LabelFields locales={locales} withDescription />
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Key" hint="Optional. Lowercase letters, digits and hyphens. Made from the English name when left empty."><input name="key" maxLength={60} className={inputClass} /></Field>
        <ParentSelect parents={parents} />
        <label className="flex items-center gap-2 pb-5 text-sm"><input type="checkbox" name="showInMenu" defaultChecked /> Show in the menu</label>
        <button type="submit" disabled={pending} className={`${buttonClass('primary')} mb-5`}>Add section</button>
      </div>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </form>
  );
}

/**
 * One menu section. `order` is every section in menu order; `siblings` are the ones under the same
 * parent, so the arrows move a section among its siblings and a child stays under its parent.
 */
export function CategoryRow({ category, order, siblings, parents, hasChildren, locales }: {
  category: TaxonomyCategory; order: string[]; siblings: string[]; parents: TaxonomyCategory[]; hasChildren: boolean; locales: Locale[];
}) {
  const { error, pending, run } = useCommand();
  const [editing, setEditing] = useState(false);
  const at = siblings.indexOf(category.id);
  const move = (by: -1 | 1) => {
    const neighbour = siblings[at + by];
    if (!neighbour) return;
    const next = [...order];
    const a = next.indexOf(category.id);
    const b = next.indexOf(neighbour);
    [next[a], next[b]] = [next[b]!, next[a]!];
    run('PUT', 'taxonomy/categories/order', { ids: next });
  };
  const child = category.parentId !== null;
  const archived = category.status === 'archived';
  return (
    <li className={`rounded-lg border border-line bg-panel p-3 ${child ? 'ml-8 border-l-4' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs tabular-nums text-muted">{at + 1}</span>
        {child ? <Badge>Child menu</Badge> : hasChildren ? <Badge tone="info">Parent menu</Badge> : null}
        <strong>{displayName(category)}</strong>
        <code className="text-xs text-muted">{category.key}</code>
        {archived ? <Badge>Archived</Badge> : null}
        {!category.showInMenu ? <Badge>Not in menu</Badge> : null}
        <Badge tone="info">{`${category.usageCount} ${category.usageCount === 1 ? 'news item' : 'news items'}`}</Badge>
        <Missing item={category} locales={locales} />
        <span className="ml-auto flex flex-wrap gap-1">
          <button type="button" aria-label={`Move ${displayName(category)} up`} disabled={pending || at <= 0} onClick={() => move(-1)} className={buttonClass()}>↑</button>
          <button type="button" aria-label={`Move ${displayName(category)} down`} disabled={pending || at < 0 || at >= siblings.length - 1} onClick={() => move(1)} className={buttonClass()}>↓</button>
          <button type="button" disabled={pending} onClick={() => run('PUT', `taxonomy/categories/${category.id}`, { showInMenu: !category.showInMenu })} className={buttonClass()}>
            {category.showInMenu ? 'Hide from menu' : 'Show in menu'}
          </button>
          <button type="button" onClick={() => setEditing(!editing)} aria-expanded={editing} className={buttonClass()}>{editing ? 'Close' : 'Edit'}</button>
        </span>
      </div>
      {editing ? (
        <form className="mt-3 space-y-3" onSubmit={submitWith((form) => run('PUT', `taxonomy/categories/${category.id}`, {
          labels: readLabels(form, locales, category, true),
          ...(hasChildren ? {} : { parentId: String(form.get('parentId') ?? '') || null }),
        }, () => setEditing(false)))}>
          <LabelFields item={category} locales={locales} withDescription />
          <ParentSelect parents={parents} current={category.parentId} self={category.id} hasChildren={hasChildren} />
          <p className="text-xs text-muted">Changing a name keeps its address, so links to the section keep working. Leave a name empty to remove that language.</p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className={buttonClass('primary')}>Save</button>
            <button type="button" disabled={pending} onClick={() => run('PUT', `taxonomy/categories/${category.id}`, { status: archived ? 'active' : 'archived' })} className={buttonClass()}>
              {archived ? 'Restore' : 'Archive'}
            </button>
            <button type="button" disabled={pending || category.usageCount > 0 || hasChildren} title={hasChildren ? 'Has child menus: move or delete them first' : category.usageCount > 0 ? 'Used by news items: archive it instead' : undefined}
              onClick={() => { if (window.confirm(`Delete ${displayName(category)}?`)) run('DELETE', `taxonomy/categories/${category.id}`); }} className={buttonClass('danger')}>Delete</button>
          </div>
        </form>
      ) : null}
      {error ? <div className="mt-2"><Notice kind="error" message={error.message} issues={error.issues} /></div> : null}
    </li>
  );
}

/** The picture of a tag: a thumbnail, and buttons to choose one from the media library or remove it. */
function TagImage({ imageId, onChoose, onRemove }: { imageId: string | null; onChoose: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3">
      {imageId ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaFileUrl(imageId, 'thumb')} alt="" width={96} height={64} className="h-16 w-24 rounded-lg border border-line object-cover" />
      ) : (
        <span className="grid h-16 w-24 place-items-center rounded-lg border border-dashed border-line text-xs text-muted">No picture</span>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium">Picture</p>
        <div className="flex gap-2">
          <button type="button" className={buttonClass()} onClick={onChoose}>{imageId ? 'Change' : 'Choose from library'}</button>
          {imageId ? <button type="button" className={buttonClass()} onClick={onRemove}>Remove</button> : null}
        </div>
        <p className="text-xs text-muted">Shown on the tag page once it has a credit or licence.</p>
      </div>
    </div>
  );
}

export function NewTagForm({ locales }: { locales: Locale[] }) {
  const { error, pending, run } = useCommand();
  const [imageId, setImageId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  return (
    <>
      <form className="space-y-3" onSubmit={submitWith((form, el) => run('POST', 'taxonomy/tags', { imageId, labels: readLabels(form, locales, undefined, true) }, () => { el.reset(); setImageId(null); }))}>
        <LabelFields locales={locales} withDescription />
        <TagImage imageId={imageId} onChoose={() => setPicking(true)} onRemove={() => setImageId(null)} />
        <button type="submit" disabled={pending} className={buttonClass('primary')}>Add tag</button>
        {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
      </form>
      <MediaPicker open={picking} onClose={() => setPicking(false)} onChoose={(c) => { setImageId(c.mediaAssetId); setPicking(false); }} />
    </>
  );
}

export function TagRow({ tag, locales }: { tag: TaxonomyTag; locales: Locale[] }) {
  const { error, pending, run } = useCommand();
  const [editing, setEditing] = useState(false);
  const [imageId, setImageId] = useState<string | null>(tag.imageId);
  const [picking, setPicking] = useState(false);
  const archived = tag.status === 'archived';
  return (
    <li className="rounded-lg border border-line bg-panel p-3">
      <div className="flex flex-wrap items-center gap-2">
        <strong>{displayName(tag)}</strong>
        {tag.labels.filter((l) => l.locale !== 'en').map((l) => <span key={l.locale} lang={l.locale} className="text-sm text-muted">{l.name}</span>)}
        {archived ? <Badge>Archived</Badge> : null}
        <Badge tone="info">{`${tag.usageCount} ${tag.usageCount === 1 ? 'news item' : 'news items'}`}</Badge>
        <Missing item={tag} locales={locales} />
        <button type="button" onClick={() => setEditing(!editing)} aria-expanded={editing} className={`${buttonClass()} ml-auto`}>{editing ? 'Close' : 'Edit'}</button>
      </div>
      {editing ? (
        <form className="mt-3 space-y-3" onSubmit={submitWith((form) => run('PUT', `taxonomy/tags/${tag.id}`, { imageId, labels: readLabels(form, locales, tag, true) }, () => setEditing(false)))}>
          <LabelFields item={tag} locales={locales} withDescription />
          <TagImage imageId={imageId} onChoose={() => setPicking(true)} onRemove={() => setImageId(null)} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className={buttonClass('primary')}>Save names</button>
            <button type="button" disabled={pending} onClick={() => run('PUT', `taxonomy/tags/${tag.id}`, { status: archived ? 'active' : 'archived' })} className={buttonClass()}>{archived ? 'Restore' : 'Archive'}</button>
            <button type="button" disabled={pending || tag.usageCount > 0} title={tag.usageCount > 0 ? 'Used by news items: archive it instead' : undefined}
              onClick={() => { if (window.confirm(`Delete ${displayName(tag)}?`)) run('DELETE', `taxonomy/tags/${tag.id}`); }} className={buttonClass('danger')}>Delete</button>
          </div>
        </form>
      ) : null}
      <MediaPicker open={picking} onClose={() => setPicking(false)} onChoose={(c) => { setImageId(c.mediaAssetId); setPicking(false); }} />
      {error ? <div className="mt-2"><Notice kind="error" message={error.message} issues={error.issues} /></div> : null}
    </li>
  );
}

/** Tags of one news: shows the current set and searches the active tags to add more. */
export function NewsTagPicker({ newsId, tags, locales }: { newsId: string; tags: TaxonomyTag[]; locales: Locale[] }) {
  const { error, pending, run } = useCommand();
  const [found, setFound] = useState<TaxonomyTag[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const ids = tags.map((t) => t.id);
  const set = (next: string[]) => run('PUT', `news/${newsId}/tags`, { tagIds: next }, () => setFound([]));

  const search = async (query: string) => {
    setSearching(true);
    setSearchError(null);
    const res = await bff<{ items: TaxonomyTag[] }>('GET', `reference/tags?limit=10&query=${encodeURIComponent(query)}`);
    setSearching(false);
    if (!res.ok) return setSearchError(res.message);
    setFound(res.data.items.filter((t) => !ids.includes(t.id)));
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Tags</p>
      <ul className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <li key={t.id} className="flex items-center gap-1 rounded bg-line/60 px-2 py-0.5 text-sm">
            {displayName(t)}
            {missingIn(t, locales).length > 0 ? <span title={`No name in ${missingIn(t, locales).map((l) => l.displayName).join(', ')}`} aria-label="Missing a translation">⚠</span> : null}
            <button type="button" aria-label={`Remove tag ${displayName(t)}`} disabled={pending} onClick={() => set(ids.filter((x) => x !== t.id))} className="text-danger">×</button>
          </li>
        ))}
        {tags.length === 0 ? <li className="text-sm text-muted">No tags yet.</li> : null}
      </ul>
      <form className="flex gap-2" onSubmit={submitWith((form) => { void search(String(form.get('q') ?? '').trim()); })}>
        <input name="q" aria-label="Find a tag" placeholder="Find a tag in any language" maxLength={100} className={inputClass} />
        <button type="submit" disabled={searching} className={buttonClass()}>Find</button>
      </form>
      {searchError ? <Notice kind="error" message={searchError} /> : null}
      {found.length > 0 ? (
        <ul className="flex flex-wrap gap-1" aria-label="Matching tags">
          {found.map((t) => (
            <li key={t.id}><button type="button" disabled={pending} onClick={() => set([...ids, t.id])} className={buttonClass()}>+ {displayName(t)}</button></li>
          ))}
        </ul>
      ) : null}
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </div>
  );
}

/** Languages the platform publishes in. A new one is usable for names and translations straight away. */
export function LanguageManager({ locales }: { locales: Locale[] }) {
  const { error, pending, run } = useCommand();
  return (
    <div className="space-y-3">
      <ul className="space-y-1 text-sm">
        {locales.map((l) => (
          <li key={l.code} className="flex flex-wrap items-center gap-2">
            <code>{l.code}</code> <span>{l.displayName}</span> <span className="text-muted">{l.direction.toUpperCase()}</span>
            <Badge tone={l.active ? 'good' : 'neutral'}>{l.active ? 'Active' : 'Off'}</Badge>
            <button type="button" disabled={pending} onClick={() => run('PUT', `config/locales/${l.code}`, { active: !l.active })} className={`${buttonClass()} ml-auto`}>
              {l.active ? 'Turn off' : 'Turn on'}
            </button>
          </li>
        ))}
      </ul>
      <form className="flex flex-wrap items-end gap-2" onSubmit={submitWith((form, el) => run('POST', 'config/locales', {
        code: String(form.get('code') ?? '').trim(), displayName: String(form.get('displayName') ?? '').trim(), direction: form.get('direction'),
      }, () => el.reset()))}>
        <Field label="Code" hint="For example hi or ar"><input name="code" required maxLength={16} className={inputClass} /></Field>
        <Field label="Name"><input name="displayName" required maxLength={60} className={inputClass} /></Field>
        <Field label="Direction"><select name="direction" defaultValue="ltr" className={inputClass}><option value="ltr">Left to right</option><option value="rtl">Right to left</option></select></Field>
        <button type="submit" disabled={pending} className={`${buttonClass('primary')} mb-5`}>Add language</button>
      </form>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </div>
  );
}
