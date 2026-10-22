import type { MediaDetail, MediaVariantName } from '@fact-lens/contracts';

/** Images come through the newsroom's own `/api` proxy, so the browser sends its session cookie and never sees the API. */
export const mediaFileUrl = (id: string, variant: MediaVariantName = 'card') => `/api/media/${encodeURIComponent(id)}/file?variant=${variant}`;

export const licenseSuggestions = [
  'CC BY 4.0', 'CC BY-SA 4.0', 'CC0 1.0', 'Public domain', 'Licensed (agency)', 'Licensed (photographer)', 'All rights reserved',
] as const;

export interface RightsStatus {
  label: string;
  tone: 'good' | 'warn' | 'bad';
  /** True when a news item using the image can be published. */
  ready: boolean;
}

/** The same checks the API makes before publishing, so the library shows a problem before an editor meets it. */
export function rightsStatus(a: Pick<MediaDetail, 'license' | 'attribution' | 'rightsExpiresAt' | 'permittedChannels'>, now = Date.now()): RightsStatus {
  if (a.rightsExpiresAt && Date.parse(a.rightsExpiresAt) <= now) return { label: 'Rights expired', tone: 'bad', ready: false };
  if (!a.license && !a.attribution) return { label: 'Needs credit or licence', tone: 'warn', ready: false };
  if (!a.permittedChannels.includes('web')) return { label: 'Not cleared for the web', tone: 'warn', ready: false };
  return { label: 'Ready to publish', tone: 'good', ready: true };
}

export const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

/** A date picked in the form means the end of that day in Dhaka. */
export const expiryFromDate = (date: string) => (date ? new Date(`${date}T23:59:59+06:00`).toISOString() : null);
export const dateFromExpiry = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date(iso)) : '';
