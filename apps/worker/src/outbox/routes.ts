import { outboxEventSchemas, type JobPayload, type JobType, type OutboxEventType } from '@fact-lens/contracts';

export interface PlannedJob<T extends JobType = JobType> {
  type: T;
  payload: JobPayload<T>;
}

/** Raised for an event that can never be routed. Retrying will not help, so it is parked. */
export class UnroutableEventError extends Error {}

const job = <T extends JobType>(type: T, payload: JobPayload<T>): PlannedJob => ({ type, payload }) as PlannedJob;

/**
 * Which jobs each outbox event fans out to. Every event type the API writes must be listed:
 * an unlisted one is parked in the dead-letter set rather than silently dropped.
 */
const routes: { [K in OutboxEventType]: (p: import('@fact-lens/contracts').OutboxEventPayload<K>) => PlannedJob[] } = {
  'news.published': (p) => [
    job('cache.invalidate', { tags: [`news:${p.newsId}`, ...p.locales.map((l) => `locale:${l.locale}`), 'home'] }),
    job('search.index', { newsId: p.newsId, operation: 'upsert' }),
  ],
  'news.archived': (p) => [
    job('cache.invalidate', { tags: [`news:${p.newsId}`, 'home'] }),
    job('search.index', { newsId: p.newsId, operation: 'delete' }),
  ],
  'news.schedule_failed': (p) => [
    job('notification.send', { kind: 'schedule_failed', newsId: p.newsId, scheduleId: p.scheduleId, reason: p.reason }),
  ],
  'config.flag_changed': () => [job('cache.invalidate', { tags: ['config'] })],
};

export function planJobs(eventType: string, payload: unknown): PlannedJob[] {
  if (!(eventType in routes)) throw new UnroutableEventError(`No route for event type "${eventType}"`);
  const type = eventType as OutboxEventType;
  const parsed = outboxEventSchemas[type].safeParse(payload);
  if (!parsed.success) throw new UnroutableEventError(`Invalid payload for ${eventType}: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
  return (routes[type] as (p: unknown) => PlannedJob[])(parsed.data);
}
