'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { sourceKinds, sourceRelations, sourceUseTypes, type AttachedSource, type SourceValidation } from '@fact-lens/contracts';
import { announce } from '@/lib/announce';
import { bff } from '@/lib/client';
import { submitWith } from '@/lib/form';
import { buildAttachBody, buildValidation } from '@/lib/sources';
import { Badge, buttonClass, Empty, Field, inputClass, Notice } from './ui';

type Failure = { message: string; issues: string[] } | null;
type CreatedSource = { id: string; title: string };

function useCommand() {
  const router = useRouter();
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();
  const fail = (res: { reason?: string; message: string; issues: string[] }) =>
    setError({ message: res.reason === 'mfa_required' ? 'This step needs a sign-in with a second factor.' : res.message, issues: res.issues });
  const run = (method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown, after?: () => void) => {
    setError(null);
    start(async () => {
      const res = await bff(method, path, body);
      if (!res.ok) return fail(res);
      after?.();
      announce('Saved');
      router.refresh();
    });
  };
  return { error, setError, pending, start, fail, run, refresh: () => router.refresh() };
}

export function SourceParts({ newsId, sources, canEdit, canReview }: { newsId: string; sources: AttachedSource[]; canEdit: boolean; canReview: boolean }) {
  const { error, setError, pending, start, fail, run, refresh } = useCommand();
  const [created, setCreated] = useState<CreatedSource | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});

  const attach = (source: CreatedSource, relation: string, useType: string, notes: string) => {
    setError(null);
    start(async () => {
      const res = await bff('PUT', `news/${newsId}/sources/${source.id}`, buildAttachBody(relation, useType, notes));
      if (!res.ok) return fail(res);
      setCreated(null);
      announce('Saved');
      refresh();
    });
  };

  const validate = (sourceId: string, status: SourceValidation['status']) => {
    const body = buildValidation(status, reason[sourceId] ?? '');
    if (!body) {
      setError({ message: 'Enter a reason between 3 and 500 characters.', issues: [] });
      return;
    }
    run('POST', `sources/${sourceId}/validation`, body);
  };

  return (
    <div className="space-y-3">
      {sources.length === 0 ? <Empty>No sources attached.</Empty> : (
        <ul className="space-y-2 text-sm">
          {sources.map((s) => (
            <li key={s.id} className="rounded-lg border border-line p-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{s.title}</span>
                <Badge tone={s.validationStatus === 'valid' ? 'good' : s.validationStatus === 'rejected' ? 'bad' : 'neutral'}>{s.validationStatus}</Badge>
              </div>
              <div className="text-muted">{s.relation} · {s.useType}{s.publisher ? ` · ${s.publisher}` : ''}</div>
              {s.url ? <a className="break-all text-muted underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.url}</a> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {canEdit ? <button type="button" disabled={pending} className={buttonClass('danger')} onClick={() => run('DELETE', `news/${newsId}/sources/${s.id}`)}>Detach</button> : null}
                {canReview ? (
                  <>
                    <button type="button" disabled={pending} className={buttonClass()} onClick={() => validate(s.id, 'valid')}>Accept</button>
                    <button type="button" disabled={pending} className={buttonClass('danger')} onClick={() => validate(s.id, 'rejected')}>Reject</button>
                  </>
                ) : null}
              </div>
              {canReview ? (
                <Field label="Validation reason"><input value={reason[s.id] ?? ''} onChange={(e) => setReason({ ...reason, [s.id]: e.target.value })} minLength={3} maxLength={500} className={inputClass} /></Field>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {created ? (
        <div className="rounded-lg border border-line p-3 text-sm">
          <p>Created source: <strong>{created.title}</strong></p>
          <AttachControls pending={pending} onAttach={(relation, useType, notes) => attach(created, relation, useType, notes)} />
        </div>
      ) : null}
      {canEdit ? (
        <>
          <form className="space-y-3 border-t border-line pt-3" onSubmit={submitWith((form, el) => {
            setError(null);
            start(async () => {
              const body = Object.fromEntries(['kind', 'title', 'publisher', 'url', 'canonicalUrl', 'archiveUrl', 'publishedAt', 'retrievedAt', 'notes'].flatMap((key) => {
                const value = String(form.get(key) ?? '').trim();
                return value ? [[key, key.endsWith('At') ? new Date(value).toISOString() : value]] : [];
              }));
              const res = await bff<{ id: string; title: string }>('POST', 'sources', body);
              if (!res.ok) return fail(res);
              setCreated({ id: res.data.id, title: res.data.title });
              const attachRes = await bff('PUT', `news/${newsId}/sources/${res.data.id}`, buildAttachBody(String(form.get('relation') ?? 'primary'), String(form.get('useType') ?? 'background'), String(form.get('attachNotes') ?? '')));
              if (!attachRes.ok) return fail(attachRes);
              setCreated(null);
              el.reset();
              announce('Saved');
              refresh();
            });
          })}>
            <h3 className="text-sm font-semibold">Create and attach a source</h3>
            <Field label="Kind"><select name="kind" defaultValue="web" className={inputClass}>{sourceKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></Field>
            <Field label="Title"><input name="title" required minLength={1} maxLength={500} className={inputClass} /></Field>
            <Field label="Publisher"><input name="publisher" maxLength={300} className={inputClass} /></Field>
            <Field label="URL"><input name="url" type="url" className={inputClass} /></Field>
            <Field label="Canonical URL"><input name="canonicalUrl" type="url" className={inputClass} /></Field>
            <Field label="Archive URL"><input name="archiveUrl" type="url" className={inputClass} /></Field>
            <Field label="Published at"><input name="publishedAt" type="datetime-local" className={inputClass} /></Field>
            <Field label="Retrieved at"><input name="retrievedAt" type="datetime-local" className={inputClass} /></Field>
            <Field label="Source notes"><textarea name="notes" maxLength={5000} className={inputClass} /></Field>
            <AttachFields />
            <button type="submit" disabled={pending} className={buttonClass('primary')}>Create and attach</button>
          </form>
          <form className="space-y-3 border-t border-line pt-3" onSubmit={submitWith((form) => {
            const id = String(form.get('sourceId') ?? '').trim();
            attach({ id, title: id }, String(form.get('relation') ?? 'primary'), String(form.get('useType') ?? 'background'), String(form.get('attachNotes') ?? ''));
          })}>
            <h3 className="text-sm font-semibold">Attach an existing source</h3>
            <Field label="Source ID"><input name="sourceId" required className={inputClass} /></Field>
            <AttachFields />
            <button type="submit" disabled={pending} className={buttonClass()}>Attach source</button>
          </form>
        </>
      ) : null}
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </div>
  );
}

function AttachFields() {
  return <>
    <Field label="Relation"><select name="relation" defaultValue="primary" className={inputClass}>{sourceRelations.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
    <Field label="Use type"><select name="useType" defaultValue="background" className={inputClass}>{sourceUseTypes.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
    <Field label="Attach notes" hint="Notes are internal and are not published."><textarea name="attachNotes" maxLength={2000} className={inputClass} /></Field>
  </>;
}

function AttachControls({ pending, onAttach }: { pending: boolean; onAttach: (relation: string, useType: string, notes: string) => void }) {
  return <form className="mt-3 space-y-3" onSubmit={submitWith((form) => onAttach(String(form.get('relation') ?? 'primary'), String(form.get('useType') ?? 'background'), String(form.get('attachNotes') ?? '')))}>
    <AttachFields />
    <button type="submit" disabled={pending} className={buttonClass('primary')}>Attach created source</button>
  </form>;
}
