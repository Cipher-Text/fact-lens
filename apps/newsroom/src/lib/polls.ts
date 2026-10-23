import type { Poll } from '@fact-lens/contracts';

/** The words an editor sees for a poll: its question in English, else in any language. */
export const pollTitle = (p: Poll) => p.questions.en ?? Object.values(p.questions)[0] ?? '(no question)';

/** The newsroom works in Dhaka time (UTC+6, no daylight saving). A date field holds Dhaka time; the API holds UTC. */
const OFFSET_MS = 6 * 3600_000;

/** `2026-10-22T16:00` as typed in a date field, in Dhaka, to an ISO time. Empty means no time. */
export function fromDhakaInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  return new Date(`${value}:00+06:00`).toISOString();
}

/** An ISO time to the value of a Dhaka date field. */
export function toDhakaInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(Date.parse(iso) + OFFSET_MS).toISOString().slice(0, 16);
}

/** Whole percents that add up to 100 (largest remainder), so the bars and the numbers agree. */
export function percents(votes: number[]): number[] {
  const total = votes.reduce((a, b) => a + b, 0);
  if (total === 0) return votes.map(() => 0);
  const exact = votes.map((v) => (v / total) * 100);
  const base = exact.map(Math.floor);
  let left = 100 - base.reduce((a, b) => a + b, 0);
  for (const { i } of exact.map((v, i) => ({ i, r: v - Math.floor(v) })).sort((a, b) => b.r - a.r)) {
    if (left-- <= 0) break;
    base[i]! += 1;
  }
  return base;
}
