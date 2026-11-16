'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { CardTemplate, GeneratedCardListItem } from '@fact-lens/contracts';
import { announce } from '@/lib/announce';
import { bff } from '@/lib/client';
import { submitWith } from '@/lib/form';
import { headlineDefault, validateCrop } from '@/lib/cards';
import { mediaFileUrl } from '@/lib/media';
import { Badge, buttonClass, Empty, Field, inputClass, Notice } from './ui';
import { MediaPicker } from './MediaParts';

type Failure = { message: string; issues: string[] } | null;
const initialCrop = { x: 0, y: 0, width: 1, height: 1 };

export function CardParts({ newsId, cards, templates, translations, canCreate }: {
  newsId: string; cards: GeneratedCardListItem[]; templates: CardTemplate[];
  translations: Array<{ locale: string; title: string }>; canCreate: boolean;
}) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [source, setSource] = useState('');
  const [locale, setLocale] = useState(translations[0]?.locale ?? '');
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();

  return <div className="space-y-4">
    {cards.length === 0 ? <Empty>No cards requested.</Empty> : <ul className="space-y-2">
      {cards.map((card) => <li key={card.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>{card.locale ?? 'Card'} · <span className="text-muted">{card.renderStatus}</span>{card.failureReason ? <span className="text-muted"> · {card.failureReason}</span> : null}</span>
        <Badge tone={card.renderStatus === 'ready' ? 'good' : card.renderStatus === 'failed' ? 'bad' : 'neutral'}>{card.renderStatus}</Badge>
        {card.renderStatus === 'ready' ? <a className="text-accent underline" href={mediaFileUrl(card.mediaAssetId, 'card')} target="_blank" rel="noreferrer">Open card image</a> : null}
      </li>)}
    </ul>}
    {canCreate ? <form className="space-y-3 border-t border-line pt-3" onSubmit={submitWith((form) => {
      setError(null);
      const crop = { x: Number(form.get('x')), y: Number(form.get('y')), width: Number(form.get('width')), height: Number(form.get('height')) };
      if (!validateCrop(crop)) { setError({ message: 'Enter a valid crop inside the photo.', issues: [] }); return; }
      start(async () => {
        const res = await bff<GeneratedCardListItem>('POST', `news/${newsId}/cards`, {
          sourceMediaAssetId: source, templateId: String(form.get('templateId') ?? ''), locale: String(form.get('locale') ?? ''), crop,
          headline: String(form.get('headline') ?? ''), byline: String(form.get('byline') ?? '') || undefined,
        });
        if (!res.ok) { setError({ message: res.message, issues: res.issues }); return; }
        announce('Card requested');
        router.refresh();
      });
    })}>
      <div className="flex items-end gap-2"><div className="min-w-0 flex-1"><Field label="Source photo"><span className="block truncate rounded-lg border border-line px-2.5 py-1.5 text-sm text-muted">{source || 'No photo selected'}</span></Field></div>
        <button type="button" className={buttonClass()} onClick={() => setPicking(true)}>Choose photo</button></div>
      <Field label="Template"><select name="templateId" required className={inputClass} defaultValue="">{templates.filter((t) => t.status === 'active').map((t) => <option key={t.id} value={t.id}>{t.name} · {t.aspectRatio}</option>)}</select></Field>
      <Field label="Locale"><select name="locale" required className={inputClass} value={locale} onChange={(e) => setLocale(e.target.value)}>{translations.map((t) => <option key={t.locale} value={t.locale}>{t.locale}</option>)}</select></Field>
      <Field label="Headline"><input key={locale} name="headline" required maxLength={300} defaultValue={headlineDefault(translations.find((t) => t.locale === locale)?.title)} className={inputClass} /></Field>
      <Field label="Byline"><input name="byline" maxLength={200} className={inputClass} /></Field>
      <fieldset className="grid grid-cols-2 gap-2"><legend className="mb-1 text-sm font-medium">Crop (0–1)</legend>
        {(['x', 'y', 'width', 'height'] as const).map((part) => <Field key={part} label={part}><input name={part} type="number" min="0" max="1" step="0.01" required defaultValue={initialCrop[part]} className={inputClass} /></Field>)}
      </fieldset>
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
      <button type="submit" disabled={pending || !source || templates.every((t) => t.status !== 'active') || translations.length === 0} className={buttonClass('primary')}>{pending ? 'Requesting…' : 'Request card'}</button>
    </form> : null}
    <MediaPicker open={picking} onClose={() => setPicking(false)} onChoose={(choice) => { setSource(choice.mediaAssetId); setPicking(false); }} />
  </div>;
}
