import { notFound } from 'next/navigation';
import { z } from 'zod';
import {
  assignmentSchema, attachedSourceSchema, categorySchema, commentSchema, contributorSchema, deskSchema, localeSchema,
  newsDetailSchema, timelineEntrySchema,
} from '@fact-lens/contracts';
import { RichBody } from '@/components/RichBody';
import { CommentBox, CorrectionForm, MetaForm, NewPersonForm, ReviseForm, ResolveButton, NewsTagPicker, TransitionPanel, TranslationEditor } from '@/components';
import { Badge, Empty, Panel, StatusBadge, WorkflowSteps } from '@/components/ui';
import { ApiError, api, getPrincipal } from '@/lib/current';
import { formatDateTime, pickTitle } from '@/lib/format';
import { can } from '@/lib/nav';

export async function generateMetadata() {
  return { title: 'News item' };
}

async function load<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
}

export default async function NewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const here = `/news/${id}`;
  const principal = await getPrincipal();
  const [detail, comments, timeline, sources, assignments, desks, categories, locales, people] = await Promise.all([
    load(api(`/news/${id}`, newsDetailSchema, { returnTo: here })),
    api(`/news/${id}/comments`, z.array(commentSchema.extend({ resolvedBy: z.string().nullable().optional() })), { returnTo: here }),
    api(`/news/${id}/timeline`, z.array(timelineEntrySchema), { returnTo: here }),
    api(`/news/${id}/sources`, z.array(attachedSourceSchema), { returnTo: here }),
    api(`/news/${id}/assignments`, z.array(assignmentSchema), { returnTo: here }),
    api('/reference/desks', z.array(deskSchema), { returnTo: here }),
    api('/reference/categories', z.array(categorySchema), { returnTo: here }),
    api('/reference/locales', z.array(localeSchema), { returnTo: here }),
    api('/contributors', z.array(contributorSchema), { returnTo: here }),
  ]);

  const { news, revision, translations, editable } = detail;
  const heading = pickTitle(Object.fromEntries(translations.map((t) => [t.locale, t.title])));
  const canEdit = can(principal, 'news.edit') && editable && news.status !== 'ARCHIVED';
  const have = new Set(translations.map((t) => t.locale));
  const missing = locales.filter((l) => !have.has(l.code));
  const sectionName = (c: (typeof categories)[number]) => c.labels.find((l) => l.locale === 'en')?.name ?? c.key;

  return (
    <div>
      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={news.status} />
          <Badge>{`Revision ${revision.revisionNo}`}</Badge>
          <Badge tone={editable ? 'info' : 'neutral'}>{editable ? 'Open for editing' : 'Locked'}</Badge>
          {detail.openCommentCount > 0 ? <Badge tone="warn">{`${detail.openCommentCount} open comment${detail.openCommentCount === 1 ? '' : 's'}`}</Badge> : null}
        </div>
        <h1 className="mt-2 text-2xl font-semibold" lang={heading?.locale}>{heading?.text ?? 'Untitled'}</h1>
        <p className="text-sm text-muted">Revision opened {formatDateTime(revision.createdAt)} · last changed by {revision.changedBy}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {translations.map((t) => (
            <Panel key={t.id} title={`${locales.find((l) => l.code === t.locale)?.displayName ?? t.locale} text`} id={`t-${t.locale}`}
              actions={<span className="text-xs text-muted">v{t.version} · {t.translationStatus.replace('_', ' ')}</span>}>
              {canEdit ? (
                <TranslationEditor newsId={id} translation={{
                  locale: t.locale, localeName: locales.find((l) => l.code === t.locale)?.displayName ?? t.locale, title: t.title, dek: t.dek, slug: t.slug,
                  seoTitle: t.seoTitle, seoDescription: t.seoDescription, body: t.body, version: t.version,
                }} />
              ) : (
                <article lang={t.locale} className="space-y-2">
                  <h3 className="text-lg font-semibold">{t.title}</h3>
                  {t.dek ? <p className="text-muted">{t.dek}</p> : null}
                  <p className="text-xs text-muted">Slug: {t.slug}</p>
                  <RichBody body={t.body} lang={t.locale} />
                </article>
              )}
            </Panel>
          ))}
          {canEdit && missing.length > 0 ? (
            <Panel title="Add another language" id="add-lang">
              <div className="space-y-3">
                {missing.map((l) => (
                  <details key={l.code}>
                    <summary className="cursor-pointer text-sm font-medium">{l.displayName}</summary>
                    <div className="mt-3">
                      <TranslationEditor newsId={id} translation={{ locale: l.code, localeName: l.displayName, title: '', dek: null, slug: '', seoTitle: null, seoDescription: null, body: { type: 'doc', content: [] }, version: null }} />
                    </div>
                  </details>
                ))}
              </div>
            </Panel>
          ) : null}

          <Panel title="Timeline" id="timeline-h">
            {timeline.length === 0 ? <Empty>Nothing yet.</Empty> : (
              <ol className="space-y-2 text-sm">
                {timeline.map((e, i) => (
                  <li key={`${e.at}-${i}`}>
                    <span className="font-medium">{describe(e)}</span>
                    <span className="text-muted"> · {e.actor ?? 'system'} · {formatDateTime(e.at)}{e.revisionNo ? ` · revision ${e.revisionNo}` : ''}</span>
                    {e.reason ? <div className="text-muted">“{e.reason}”</div> : null}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Workflow" id="next-h">
            <WorkflowSteps status={news.status} />
            <TransitionPanel newsId={id} transitions={detail.transitions} />
          </Panel>

          {news.status === 'PUBLISHED' && can(principal, 'news.edit') ? <Panel title="Change a published news item" id="revise-h"><ReviseForm newsId={id} /></Panel> : null}
          {news.status === 'PUBLISHED' && can(principal, 'news.correct') ? <Panel title="Record a correction" id="correct-h"><CorrectionForm newsId={id} locales={translations.map((t) => t.locale)} /></Panel> : null}

          <Panel title="Details" id="meta-h">
            {can(principal, 'news.edit') && news.status !== 'ARCHIVED' ? (
              <div className="space-y-3">
                <MetaForm newsId={id} deskId={news.deskId} categoryId={news.categoryId}
                  desks={desks.map((d) => ({ id: d.id, name: d.name }))} categories={categories.map((c) => ({ id: c.id, name: sectionName(c) }))}
                  contributors={detail.contributors.map((c) => ({ id: c.contributor.id, name: c.contributor.displayName, role: c.role }))}
                  people={people.map((p) => ({ id: p.id, name: p.displayName }))} />
                <NewsTagPicker newsId={id} tags={detail.tags} locales={locales} />
                <NewPersonForm />
              </div>
            ) : (
              <dl className="space-y-1 text-sm">
                <div><dt className="inline text-muted">Desk: </dt><dd className="inline">{desks.find((d) => d.id === news.deskId)?.name ?? '—'}</dd></div>
                <div><dt className="inline text-muted">Tags: </dt><dd className="inline">{detail.tags.map((t) => t.labels.find((l) => l.locale === 'en')?.name ?? t.key).join(', ') || '—'}</dd></div>
                <div><dt className="inline text-muted">Credits: </dt><dd className="inline">{detail.contributors.map((c) => `${c.contributor.displayName} (${c.role})`).join(', ') || '—'}</dd></div>
              </dl>
            )}
          </Panel>

          <Panel title="Comments" id="comments-h">
            <ul className="mb-3 space-y-3 text-sm">
              {comments.filter((c) => !c.parentId).map((c) => (
                <li key={c.id} className={c.status === 'resolved' ? 'opacity-60' : undefined}>
                  <div><span className="font-medium">{c.author}</span> <span className="text-muted">{formatDateTime(c.createdAt)}</span> {c.status === 'resolved' ? <Badge tone="good">Resolved</Badge> : null}</div>
                  <p className="whitespace-pre-line">{c.body}</p>
                  <ul className="mt-1 space-y-1 border-l border-line pl-3">
                    {comments.filter((r) => r.parentId === c.id).map((r) => <li key={r.id}><span className="font-medium">{r.author}</span>: {r.body}</li>)}
                  </ul>
                  <ResolveButton commentId={c.id} resolved={c.status === 'resolved'} />
                </li>
              ))}
              {comments.length === 0 ? <li><Empty>No comments.</Empty></li> : null}
            </ul>
            <CommentBox newsId={id} />
          </Panel>

          <Panel title="Sources" id="sources-h">
            {sources.length === 0 ? <Empty>No sources attached.</Empty> : (
              <ul className="space-y-2 text-sm">
                {sources.map((s) => (
                  <li key={s.id}>
                    <span className="font-medium">{s.title}</span> <Badge tone={s.validationStatus === 'valid' ? 'good' : s.validationStatus === 'rejected' ? 'bad' : 'neutral'}>{s.validationStatus}</Badge>
                    <div className="text-muted">{s.relation} · {s.useType}{s.publisher ? ` · ${s.publisher}` : ''}</div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Assignments" id="assign-h">
            {assignments.length === 0 ? <Empty>Nobody is assigned.</Empty> : (
              <ul className="space-y-1 text-sm">
                {assignments.map((a) => <li key={a.id}>{a.assignee} · {a.role.replace('_', ' ')} · <span className="text-muted">{a.status}{a.dueAt ? ` · due ${formatDateTime(a.dueAt)}` : ''}</span></li>)}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function describe(e: { action: string; from: string | null; to: string | null }): string {
  switch (e.action) {
    case 'news.transition': return `Moved ${label(e.from)} → ${label(e.to)}`;
    case 'revision.created': return 'Opened a revision';
    case 'news.create': return 'Created the news item';
    case 'news.revise': return 'Opened a new revision of a published news item';
    case 'news.correct': return 'Recorded a correction';
    case 'news.meta_update': return 'Changed desk, section or credits';
    case 'news.source_attach': return 'Attached a source';
    case 'news.source_update': return 'Updated a source link';
    case 'news.source_detach': return 'Removed a source';
    default: return e.action;
  }
}
const label = (s: string | null) => (s ? s.replace(/_/g, ' ').toLowerCase() : '—');
