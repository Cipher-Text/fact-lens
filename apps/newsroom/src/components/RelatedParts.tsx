'use client';

import { useState, useTransition } from 'react';
import { bff } from '@/lib/client';
import { addPick, filterCandidates, movePick, removePick, toPayload, type RelatedPick } from '@/lib/related';
import { buttonClass, inputClass, Notice } from './ui';

export function RelatedPicker({ newsId, picks: initialPicks, candidates }: {
  newsId: string; picks: RelatedPick[]; candidates: Array<{ id: string; title: string }>;
}) {
  const [picks, setPicks] = useState(initialPicks);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const save = (next: RelatedPick[]) => {
    setPicks(next);
    setError(null);
    startTransition(async () => {
      const result = await bff<Array<{ newsId: string; position: number; title: string | null }>>('PUT', `news/${newsId}/related`, toPayload(next));
      if (!result.ok) return setError(result.message);
      setPicks(result.data);
    });
  };
  const results = filterCandidates(candidates, query, [newsId, ...picks.map((pick) => pick.newsId)]);

  return (
    <section className="space-y-2" aria-labelledby="related-news-heading">
      <div>
        <h3 id="related-news-heading" className="text-sm font-medium">Related news</h3>
        <p className="text-xs text-muted">Up to three. Shown under the article on the site; empty means the site fills the list itself.</p>
      </div>
      {picks.length === 0 ? <p className="text-sm text-muted">No related news selected.</p> : (
        <ol className="space-y-1">
          {picks.map((pick, index) => (
            <li key={pick.newsId} className="flex items-center gap-1 text-sm">
              <span className="min-w-0 flex-1 truncate">{pick.title ?? 'Untitled news item'}</span>
              <button type="button" aria-label={`Move ${pick.title ?? 'news item'} up`} disabled={pending || index === 0} onClick={() => save(movePick(picks, pick.newsId, 'up'))} className={buttonClass()}>↑</button>
              <button type="button" aria-label={`Move ${pick.title ?? 'news item'} down`} disabled={pending || index === picks.length - 1} onClick={() => save(movePick(picks, pick.newsId, 'down'))} className={buttonClass()}>↓</button>
              <button type="button" aria-label={`Remove ${pick.title ?? 'news item'}`} disabled={pending} onClick={() => save(removePick(picks, pick.newsId))} className={buttonClass('danger')}>Remove</button>
            </li>
          ))}
        </ol>
      )}
      <label className="block text-xs font-medium" htmlFor="related-news-search">Find news to add</label>
      <input id="related-news-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} disabled={picks.length >= 3} placeholder="Search titles" className={inputClass} />
      {picks.length < 3 ? (
        <ul className="space-y-1" aria-label="Matching news">
          {results.map((item) => <li key={item.id}><button type="button" disabled={pending} onClick={() => save(addPick(picks, item.id, item.title))} className={buttonClass()}>+ {item.title}</button></li>)}
          {query.trim() && results.length === 0 ? <li className="text-sm text-muted">No matching news items.</li> : null}
        </ul>
      ) : null}
      {error ? <Notice kind="error" message={error} /> : null}
    </section>
  );
}
