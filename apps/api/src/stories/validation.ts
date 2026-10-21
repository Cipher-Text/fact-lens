import { bodyPlainText } from '@fact-lens/contracts';

/** Facts about a revision that the readiness rules look at. Gathered by the service, judged here. */
export interface RevisionSnapshot {
  deskId: string | null;
  authorCount: number;
  translations: Array<{
    locale: string;
    title: string;
    slug: string;
    body: unknown;
    translationStatus: string;
  }>;
  media: Array<{ id: string; license: string | null; attribution: string | null; processingState: string }>;
}

/** docs/06: Draft -> Editor review needs title, body, author and desk. */
export function reviewIssues(s: RevisionSnapshot): string[] {
  const issues: string[] = [];
  if (s.translations.length === 0) issues.push('Add at least one translation.');
  for (const t of s.translations) {
    if (t.title.trim().length === 0) issues.push(`${t.locale}: title is empty.`);
    if (bodyPlainText(t.body).length === 0) issues.push(`${t.locale}: body is empty.`);
  }
  if (s.authorCount === 0) issues.push('Credit at least one author.');
  if (!s.deskId) issues.push('Assign a desk.');
  return issues;
}

/** docs/06: Ready -> Published needs locale readiness and a media rights check, on top of review rules. */
export function publishIssues(s: RevisionSnapshot): string[] {
  const issues = reviewIssues(s);
  for (const t of s.translations) {
    if (t.translationStatus === 'machine_draft') issues.push(`${t.locale}: machine draft needs human review first.`);
    if (t.slug.length === 0) issues.push(`${t.locale}: slug is empty.`);
  }
  for (const m of s.media) {
    if (!m.license && !m.attribution) issues.push(`Media ${m.id}: record a license or attribution.`);
    if (m.processingState !== 'ready') issues.push(`Media ${m.id}: still ${m.processingState}.`);
  }
  return issues;
}

export function slugify(title: string, fallback: string): string {
  const slug = title
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/g, '');
  return /^[\p{L}\p{N}]/u.test(slug) ? slug : fallback;
}
