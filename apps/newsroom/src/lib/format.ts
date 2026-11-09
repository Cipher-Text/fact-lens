import type { NewsFormat, NewsStatus } from '@fact-lens/contracts';

const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' });

/** Newsroom times are shown in Dhaka time, the desk's working time zone. */
export const formatDateTime = (iso: string | null | undefined) => (iso ? `${dateTime.format(new Date(iso))} (Dhaka)` : '—');

export function relativeTime(iso: string, now = Date.now()): string {
  const seconds = Math.round((now - Date.parse(iso)) / 1000);
  if (seconds < 45) return 'just now';
  const units: Array<[number, string]> = [[60, 'minute'], [3600, 'hour'], [86400, 'day']];
  for (let i = units.length - 1; i >= 0; i--) {
    const [size, name] = units[i]!;
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `${n} ${name}${n === 1 ? '' : 's'} ago`;
    }
  }
  return `${Math.floor(seconds / 60)} minutes ago`;
}

/** A news item's title for lists: English if there is one, otherwise whichever locale exists. */
export function pickTitle(titles: Record<string, string>): { text: string; locale: string } | null {
  const locale = titles.en ? 'en' : Object.keys(titles).sort()[0];
  return locale ? { text: titles[locale]!, locale } : null;
}

/** News, analysis or opinion, as an editor reads it. */
export const formatLabel = (f: NewsFormat) => ({ news: 'News', analysis: 'Analysis', opinion: 'Opinion' })[f];

export const statusLabel = (s: NewsStatus) => s.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

export type Tone = 'neutral' | 'info' | 'warn' | 'good' | 'bad';
export const statusTone = (s: NewsStatus): Tone =>
  ({ INGESTED: 'neutral', RESEARCHING: 'neutral', DRAFT: 'neutral', EDITOR_REVIEW: 'info', FACT_CHECK: 'info', READY: 'warn',
     SCHEDULED: 'warn', PUBLISHED: 'good', UPDATED: 'warn', CORRECTED: 'warn', ARCHIVED: 'bad' } as const)[s];
