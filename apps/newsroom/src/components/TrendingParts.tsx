'use client';

import { useState, useTransition } from 'react';
import { bff } from '@/lib/client';
import { submitWith } from '@/lib/form';
import { addTerm, MAX_TERMS, moveTerm, removeTerm, validateTerms } from '@/lib/trending';
import { buttonClass, inputClass, Notice } from './ui';

export function TrendingTermsEditor({ locale, label, initialTerms }: { locale: string; label: string; initialTerms: string[] }) {
  const [terms, setTerms] = useState(initialTerms);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    const problem = validateTerms(terms);
    if (problem) { setError(problem); return; }
    setError(null);
    startTransition(async () => {
      const result = await bff<{ terms: string[] }>('PUT', `trending-searches/${locale}`, { terms });
      if (!result.ok) { setError(result.message); return; }
      setTerms(result.data.terms);
    });
  };

  const add = (form: FormData, element: HTMLFormElement) => {
    const raw = String(form.get('term') ?? '');
    const next = addTerm(terms, raw);
    if (next === terms) {
      if (raw.trim() && terms.some((term) => term.toLocaleLowerCase() === raw.trim().toLocaleLowerCase())) setError('That term is already listed.');
      return;
    }
    setTerms(next);
    setError(null);
    element.reset();
  };

  return (
    <section className="space-y-3" aria-labelledby={`trending-${locale}`}>
      <div>
        <h3 id={`trending-${locale}`} className="text-sm font-medium">{label}</h3>
        <p className="text-xs text-muted">Up to six, in order. An empty list hides the row on the site.</p>
      </div>
      <ol className="space-y-1">
        {terms.map((term, index) => (
          <li key={`${index}-${term}`} className="flex items-center gap-1 text-sm">
            <span className="min-w-0 flex-1 break-words">{term}</span>
            <button type="button" aria-label={`Move ${term} up`} disabled={pending || index === 0} onClick={() => { setTerms(moveTerm(terms, index, 'up')); setError(null); }} className={buttonClass()}>↑</button>
            <button type="button" aria-label={`Move ${term} down`} disabled={pending || index === terms.length - 1} onClick={() => { setTerms(moveTerm(terms, index, 'down')); setError(null); }} className={buttonClass()}>↓</button>
            <button type="button" aria-label={`Remove ${term}`} disabled={pending} onClick={() => { setTerms(removeTerm(terms, index)); setError(null); }} className={buttonClass('danger')}>Remove</button>
          </li>
        ))}
      </ol>
      <form className="flex gap-2" onSubmit={submitWith((form, element) => add(form, element))}>
        <input name="term" aria-label={`Add ${label} trending term`} maxLength={120} disabled={pending || terms.length >= MAX_TERMS} className={inputClass} />
        <button type="submit" disabled={pending || terms.length >= MAX_TERMS} className={buttonClass()}>Add</button>
      </form>
      {terms.some((term) => term.length > 60) ? <p className="text-xs text-danger">Each term must be 60 characters or fewer.</p> : null}
      <button type="button" onClick={save} disabled={pending} className={buttonClass('primary')}>{pending ? 'Saving…' : 'Save'}</button>
      {error ? <Notice kind="error" message={error} /> : null}
    </section>
  );
}
